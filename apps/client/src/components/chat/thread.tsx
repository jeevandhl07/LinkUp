import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { Conversation, Message, User } from "../../types/models";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Props = {
  conversation?: Conversation;
  messages: Message[];
  me?: User | null;
  typingUsers: string[];
  onSend: (content: string) => void;
  onTyping: (typing: boolean) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onBackToList: () => void;
  onStartCall: () => void;
};

export const Thread = ({
  conversation,
  messages,
  me,
  onSend,
  onTyping,
  typingUsers,
  onLoadMore,
  hasMore,
  onBackToList,
  onStartCall,
}: Props) => {
  const [draft, setDraft] = useState("");
  const typingTimeoutRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation?._id, messages.length]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    (conversation?.members || []).forEach((member) => {
      map.set(member.userId, member.user?.name || member.userId);
    });
    return map;
  }, [conversation?.members]);

  const typingText = useMemo(() => {
    if (typingUsers.length === 0) return "";
    const names = typingUsers.map((id) => memberNameById.get(id) || "Someone");
    return `${names.join(", ")} is typing...`;
  }, [typingUsers, memberNameById]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
    onTyping(false);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    const typing = value.trim().length > 0;
    onTyping(typing);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      typingTimeoutRef.current = window.setTimeout(() => {
        onTyping(false);
      }, 1200);
    }
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Select a conversation
      </div>
    );
  }

  const isDirect = conversation.type === "direct";

  return (
    <section className="flex h-full flex-1 flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-panel px-3 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 md:hidden"
            onClick={onBackToList}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar
            src={conversation.avatarUrl}
            fallback={conversation.title || "DM"}
          />
          <div>
            <h2 className="text-sm font-semibold">
              {conversation.title || "Conversation"}
            </h2>
            <p className="text-xs text-muted">
              {isDirect
                ? "Direct message"
                : `${conversation.members.length} participants`}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="h-10 w-10 p-0" onClick={onStartCall}>
          <Phone className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {hasMore ? (
          <div className="mb-3 text-center">
            <Button variant="outline" onClick={onLoadMore}>
              Load older
            </Button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="text-sm text-muted">No messages yet.</div>
        ) : null}

        <div className="space-y-2">
          {messages.map((message) => {
            const mine = message.senderId === me?.id;
            const sentAt = new Date(message.createdAt)
              .toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase();

            return (
              <div
                key={message._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl border px-3 py-2 text-sm shadow-sm md:max-w-[75%] ${mine ? "border-cyan-300/60 bg-cyan-200/30 text-text" : "border-border bg-panel text-text"}`}
                >
                  <p>{message.content}</p>
                  <p className="mt-1 text-[11px] opacity-70">{sentAt}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-border bg-panel p-3 md:p-4">
        <div className="mb-2 min-h-4 text-xs text-muted">{typingText}</div>
        <form className="flex gap-2" onSubmit={submit}>
          <Input
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onBlur={() => {
              onTyping(false);
            }}
            placeholder="Type a message"
          />
          <Button type="submit">Send</Button>
        </form>
      </footer>
    </section>
  );
};
