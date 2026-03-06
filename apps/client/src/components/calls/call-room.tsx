import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "../ui/button";
import { useSocket } from "../../context/socket-context";
import { useAuth } from "../../context/auth-context";

type Props = {
  callId: string;
  participantIds: string[];
  onLeave: () => void;
  iceServers: RTCIceServer[];
};

const getMediaErrorMessage = (error: unknown): string => {
  if (!window.isSecureContext) {
    return "Camera and microphone need HTTPS. Open the app using the secure Render URL and retry.";
  }

  const err = error as { name?: string } | undefined;
  switch (err?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera or microphone permission denied. Allow access in browser settings and tap Retry.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone found on this device.";
    case "NotReadableError":
    case "TrackStartError":
      return "Camera or microphone is busy in another app. Close other apps and tap Retry.";
    default:
      return "Could not start camera/microphone. Check permissions and tap Retry.";
  }
};

const getLocalStreamWithFallback = async (): Promise<MediaStream> => {
  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: "user" }, audio: true },
    { video: true, audio: true },
    { video: false, audio: true },
    { video: true, audio: false }
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream.getTracks().length > 0) return stream;
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const CallRoom = ({
  callId,
  participantIds,
  onLeave,
  iceServers,
}: Props) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [mediaError, setMediaError] = useState<string>("");
  const [retryKey, setRetryKey] = useState(0);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(true);
  const [hasVideoTrack, setHasVideoTrack] = useState(true);

  const others = useMemo(
    () => participantIds.filter((id) => id !== user?.id),
    [participantIds, user?.id],
  );
  const totalTiles = 1 + Object.keys(remoteStreams).length;
  const gridClass = totalTiles <= 2
    ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3";

  useEffect(() => {
    if (!socket || !user) return;

    const init = async () => {
      setMediaError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError("This browser does not support camera/microphone access.");
        return;
      }

      try {
        const stream = await getLocalStreamWithFallback();
        localStreamRef.current = stream;

        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        setHasAudioTrack(audioTracks.length > 0);
        setHasVideoTrack(videoTracks.length > 0);
        setMuted(audioTracks.length === 0);
        setCameraOff(videoTracks.length === 0);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          void localVideoRef.current.play().catch(() => undefined);
        }

        const ensurePeer = (targetUserId: string) => {
          if (peersRef.current[targetUserId]) {
            return peersRef.current[targetUserId];
          }

          const pc = new RTCPeerConnection({ iceServers });
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("webrtc:ice-candidate", {
                callId,
                toUserId: targetUserId,
                candidate: event.candidate,
              });
            }
          };

          pc.ontrack = (event) => {
            const remote = event.streams[0];
            setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remote }));
          };

          peersRef.current[targetUserId] = pc;
          return pc;
        };

        for (const targetUserId of others) {
          const pc = ensurePeer(targetUserId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            callId,
            toUserId: targetUserId,
            offer,
          });
        }

        socket.emit("call:join", { callId });

        socket.on("webrtc:offer", async ({ fromUserId, offer }) => {
          const pc = ensurePeer(fromUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", {
            callId,
            toUserId: fromUserId,
            answer,
          });
        });

        socket.on("webrtc:answer", async ({ fromUserId, answer }) => {
          const pc = peersRef.current[fromUserId];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("webrtc:ice-candidate", async ({ fromUserId, candidate }) => {
          const pc = peersRef.current[fromUserId];
          if (!pc) return;
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("call:leave", ({ userId: leftUserId }) => {
          const pc = peersRef.current[leftUserId];
          pc?.close();
          delete peersRef.current[leftUserId];
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[leftUserId];
            return next;
          });
        });
      } catch (error) {
        setMediaError(getMediaErrorMessage(error));
      }
    };

    void init();

    return () => {
      socket.emit("call:leave", { callId });
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("call:leave");
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      setRemoteStreams({});
    };
  }, [callId, iceServers, others, retryKey, socket, user]);

  const toggleMute = () => {
    if (!hasAudioTrack) return;

    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  const toggleCamera = () => {
    if (!hasVideoTrack) return;

    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      {mediaError ? (
        <div className="px-4 pt-14 text-sm text-red-300">
          <p>{mediaError}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => setRetryKey((prev) => prev + 1)}
          >
            Retry Media Access
          </Button>
        </div>
      ) : null}

      <div className={`grid flex-1 ${gridClass} gap-2 p-2 pt-14`}> 
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-panel">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
            You
          </span>
        </div>

        {Object.entries(remoteStreams).map(([id, stream]) => (
          <div
            key={id}
            className="relative aspect-video overflow-hidden rounded-xl border border-border bg-panel"
          >
            <video
              autoPlay
              playsInline
              ref={(node) => {
                if (!node) return;
                node.srcObject = stream;
                void node.play().catch(() => undefined);
              }}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              {id.slice(0, 8)}
            </span>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-panel/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-3">
          <Button variant="outline" onClick={toggleMute} disabled={!hasAudioTrack}>
            {muted ? <MicOff /> : <Mic />}
          </Button>
          <Button variant="outline" onClick={toggleCamera} disabled={!hasVideoTrack}>
            {cameraOff ? <VideoOff /> : <Video />}
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={onLeave}>
            <PhoneOff className="mr-2 h-4 w-4" /> Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

