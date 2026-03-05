import { Phone, SunMoon } from "lucide-react";
import { Conversation, User } from "../../types/models";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";

type Props = {
  conversation?: Conversation;
  me?: User | null;
  onStartCall: () => void;
  onToggleTheme: () => void;
};

export const RightPanel = ({ conversation, me, onStartCall, onToggleTheme }: Props) => (
  <aside className="hidden h-full w-80 border-l border-border bg-panel p-4 lg:block">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Conversation Info</h3>
      <Button variant="ghost" onClick={onToggleTheme}>
        <SunMoon className="h-4 w-4" />
      </Button>
    </div>

    {!conversation ? (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Select a conversation</div>
    ) : (
      <>
        <div className="mb-4 flex items-center gap-3">
          <Avatar src={conversation.avatarUrl} fallback={conversation.title || "DM"} />
          <div>
            <p className="font-semibold">{conversation.title || "Conversation"}</p>
            <p className="text-xs text-muted">{conversation.type.toUpperCase()}</p>
          </div>
        </div>

        <Button className="mb-4 w-full" onClick={onStartCall}>
          <Phone className="mr-2 h-4 w-4" /> Start Video Call
        </Button>

        <p className="mb-2 text-xs font-semibold uppercase text-muted">Members</p>
        <div className="space-y-2">
          {conversation.members.map((member) => (
            <div key={member.userId} className="rounded-md border border-border px-2 py-1 text-sm">
              {member.userId === me?.id ? "You" : member.user?.name || member.userId}
              <span className="ml-2 text-xs text-muted">{member.role}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </aside>
);