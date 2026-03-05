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

export const CallRoom = ({ callId, participantIds, onLeave, iceServers }: Props) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string>("");
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const others = useMemo(() => participantIds.filter((id) => id !== user?.id), [participantIds, user?.id]);

  useEffect(() => {
    if (!socket || !user) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const ensurePeer = (targetUserId: string) => {
          if (peersRef.current[targetUserId]) return peersRef.current[targetUserId];

          const pc = new RTCPeerConnection({ iceServers });
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("webrtc:ice-candidate", { callId, toUserId: targetUserId, candidate: event.candidate });
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
          socket.emit("webrtc:offer", { callId, toUserId: targetUserId, offer });
        }

        socket.emit("call:join", { callId });

        socket.on("webrtc:offer", async ({ fromUserId, offer }) => {
          const pc = ensurePeer(fromUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", { callId, toUserId: fromUserId, answer });
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
      } catch {
        setMediaError("Camera or microphone permission denied.");
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
  }, [callId, iceServers, others, socket, user]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      {mediaError ? <div className="px-4 pt-14 text-sm text-red-300">{mediaError}</div> : null}

      <div className="grid flex-1 grid-cols-1 gap-2 p-2 pt-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-panel">
          <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">You</span>
        </div>

        {Object.entries(remoteStreams).map(([id, stream]) => (
          <div key={id} className="relative overflow-hidden rounded-xl border border-border bg-panel">
            <video
              autoPlay
              playsInline
              ref={(node) => {
                if (node) node.srcObject = stream;
              }}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">{id.slice(0, 8)}</span>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-panel/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-3">
          <Button variant="outline" onClick={toggleMute}>
            {muted ? <MicOff /> : <Mic />}
          </Button>
          <Button variant="outline" onClick={toggleCamera}>
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
