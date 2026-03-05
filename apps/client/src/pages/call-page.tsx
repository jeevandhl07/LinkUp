import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { callsApi } from "../api/endpoints";
import { CallRoom } from "../components/calls/call-room";
import { Button } from "../components/ui/button";
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
      credential: turnCredential
    });
  }
  return servers;
};

export const CallPage = () => {
  const { callId = "" } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const callQuery = useQuery({
    queryKey: ["call", callId],
    queryFn: () => callsApi.get(callId),
    enabled: Boolean(callId)
  });

  const iceServers = useMemo(() => buildIceServers(), []);

  if (callQuery.isLoading) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text">Loading call...</div>;
  }

  if (!callQuery.data?.call) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text">Call not found</div>;
  }

  return (
    <div className="relative h-screen bg-bg text-text">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border bg-panel/90 px-2 py-1 backdrop-blur">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => {
            socket?.emit("call:leave", { callId });
            navigate("/app");
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="pr-2">
          <p className="text-xs font-semibold">Call</p>
          <p className="text-[10px] text-muted">{callQuery.data.call.participants.length} participants</p>
        </div>
      </div>

      <CallRoom
        callId={callId}
        participantIds={callQuery.data.call.participants}
        iceServers={iceServers}
        onLeave={() => {
          socket?.emit("call:leave", { callId });
          navigate("/app");
        }}
      />
    </div>
  );
};
