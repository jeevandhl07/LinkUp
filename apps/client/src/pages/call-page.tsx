import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callsApi } from "../api/endpoints";
import { CallRoom } from "../components/calls/call-room";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/auth-context";
import { useSocket } from "../context/socket-context";

const buildIceServers = (): RTCIceServer[] => {
  const stun = import.meta.env.VITE_STUN_URL as string;
  const turnUrl = import.meta.env.VITE_TURN_URL as string;
  const turnUser = import.meta.env.VITE_TURN_USERNAME as string;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string;

  const servers: RTCIceServer[] = [{ urls: [stun] }];
  if (turnUrl) {
    servers.push({
      urls: [turnUrl],
      username: turnUser,
      credential: turnCredential,
    });
  }
  return servers;
};

export const CallPage = () => {
  const { callId = "" } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const callQuery = useQuery({
    queryKey: ["call", callId],
    queryFn: () => callsApi.get(callId),
    enabled: Boolean(callId),
  });

  const isDirect = (callQuery.data?.call.participants.length ?? 0) <= 2;

  useEffect(() => {
    if (!socket || !callId) return;

    const handleCanceled = ({ callId: eventCallId, userId: actorId }: { callId: string; userId: string }) => {
      if (eventCallId !== callId || actorId === user?.id) return;
      push("Call canceled");
      navigate("/app");
    };

    const handleDecline = ({ callId: eventCallId, userId: actorId }: { callId: string; userId: string }) => {
      if (eventCallId !== callId || actorId === user?.id) return;
      push("Call declined");
      navigate("/app");
    };

    const handleEnded = ({ callId: eventCallId, userId: actorId }: { callId: string; userId: string }) => {
      if (eventCallId !== callId || actorId === user?.id) return;
      push("Call ended");
      navigate("/app");
    };

    const handleLeave = ({ callId: eventCallId, userId: actorId }: { callId: string; userId: string }) => {
      if (!isDirect || eventCallId !== callId || actorId === user?.id) return;
      push("Call ended");
      navigate("/app");
    };

    socket.on("call:canceled", handleCanceled);
    socket.on("call:decline", handleDecline);
    socket.on("call:ended", handleEnded);
    socket.on("call:leave", handleLeave);

    return () => {
      socket.off("call:canceled", handleCanceled);
      socket.off("call:decline", handleDecline);
      socket.off("call:ended", handleEnded);
      socket.off("call:leave", handleLeave);
    };
  }, [callId, isDirect, navigate, push, socket, user?.id]);

  const iceServers = useMemo(() => buildIceServers(), []);

  if (callQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text">
        Loading call...
      </div>
    );
  }

  if (!callQuery.data?.call) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text">
        Call not found
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg text-text">
      <CallRoom
        callId={callId}
        participantIds={callQuery.data.call.participants}
        iceServers={iceServers}
        onLeave={() => {
          socket?.emit("call:cancel", { callId });
          socket?.emit("call:leave", { callId });
          navigate("/app");
        }}
      />
    </div>
  );
};
