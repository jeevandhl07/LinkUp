import { FormEvent, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Plus, Search } from "lucide-react";
import { Conversation, User } from "../../types/models";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LinkUpLogo } from "../ui/logo";

type Props = {
  conversations: Conversation[];
  selectedId?: string;
  currentUser?: User | null;
  onSelect: (id: string) => void;
  onSearchUsers: (q: string) => Promise<User[]>;
  onCreateDirect: (userId: string) => void;
  onCreateGroup: (title: string, memberIds: string[]) => void;
  onLogout: () => void;
};

export const Sidebar = ({
  conversations,
  selectedId,
  currentUser,
  onSelect,
  onSearchUsers,
  onCreateDirect,
  onCreateGroup,
  onLogout
}: Props) => {
  const [query, setQuery] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [directResults, setDirectResults] = useState<User[]>([]);
  const [groupResults, setGroupResults] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const direct = useMemo(() => conversations.filter((conversation) => conversation.type === "direct"), [conversations]);
  const groups = useMemo(() => conversations.filter((conversation) => conversation.type === "group"), [conversations]);

  const existingDirectPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    direct.forEach((conversation) => {
      conversation.members.forEach((member) => {
        if (member.userId !== currentUser?.id) {
          ids.add(member.userId);
        }
      });
    });
    return ids;
  }, [currentUser?.id, direct]);

  const runSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setDirectResults([]);
      return;
    }

    const users = await onSearchUsers(value);
    setDirectResults(users.filter((user) => !existingDirectPartnerIds.has(user.id)));
  };

  const runGroupSearch = async (value: string) => {
    setGroupQuery(value);
    if (value.length < 2) {
      setGroupResults([]);
      return;
    }

    const users = await onSearchUsers(value);
    setGroupResults(users);
  };

  const submitGroup = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || members.length === 0) return;
    onCreateGroup(title.trim(), members);
    setTitle("");
    setGroupQuery("");
    setMembers([]);
    setGroupResults([]);
    setOpen(false);
  };

  const subtitleForConversation = (conversation: Conversation) => {
    const lastMessage = conversation.lastMessage;
    if (!lastMessage?.content) {
      return "No messages yet";
    }

    const senderName =
      lastMessage.senderId === currentUser?.id
        ? "You"
        : conversation.members.find((member) => member.userId === lastMessage.senderId)?.user?.name || "User";

    return `${senderName}: ${lastMessage.content}`;
  };

  const section = (label: string, items: Conversation[]) => (
    <div>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="space-y-1">
        {items.length === 0 ? <div className="rounded-md p-2 text-xs text-muted">No conversations</div> : null}
        {items.map((conversation) => {
          const unreadCount = conversation.unreadCount || 0;
          return (
            <button
              key={conversation._id}
              onClick={() => onSelect(conversation._id)}
              className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition ${selectedId === conversation._id ? "bg-accent/20" : "hover:bg-border/40"}`}
            >
              <Avatar src={conversation.avatarUrl} fallback={conversation.title || "DM"} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{conversation.title || "Conversation"}</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-xs text-muted">{subtitleForConversation(conversation)}</div>
                  {unreadCount > 0 ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-panel p-3">
      <div className="mb-3">
        <LinkUpLogo className="mb-3" />
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input value={query} onChange={(e) => void runSearch(e.target.value)} className="pl-9" placeholder="Search people" />
          </div>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="outline" className="h-10 w-10 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-panel p-4">
                <Dialog.Title className="mb-3 text-lg font-semibold">Create Group</Dialog.Title>
                <form className="space-y-3" onSubmit={submitGroup}>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Group name" />
                  <Input value={groupQuery} onChange={(e) => void runGroupSearch(e.target.value)} placeholder="Search members" />
                  <div className="max-h-44 space-y-1 overflow-auto rounded-md border border-border p-2">
                    {groupResults.map((user) => {
                      const active = members.includes(user.id);
                      return (
                        <button
                          type="button"
                          key={user.id}
                          className={`flex w-full items-center justify-between rounded p-2 text-sm ${active ? "bg-accent/20" : "hover:bg-border/40"}`}
                          onClick={() => setMembers((prev) => (active ? prev.filter((id) => id !== user.id) : [...prev, user.id]))}
                        >
                          <span>{user.name}</span>
                          <span className="text-xs text-muted">{user.email}</span>
                        </button>
                      );
                    })}
                    {groupQuery.length >= 2 && groupResults.length === 0 ? <div className="p-2 text-xs text-muted">No users found</div> : null}
                  </div>
                  <Button type="submit" className="w-full">Create Group</Button>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {query.length >= 2 ? (
        <div className="mb-3 rounded-lg border border-border p-2">
          <p className="mb-2 px-1 text-xs text-muted">People</p>
          <div className="space-y-1">
            {directResults.map((user) => (
              <button key={user.id} className="w-full rounded-lg p-2 text-left text-sm hover:bg-border/40" onClick={() => onCreateDirect(user.id)}>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted">{user.email}</div>
              </button>
            ))}
            {directResults.length === 0 ? <div className="p-2 text-xs text-muted">No people found</div> : null}
          </div>
        </div>
      ) : null}

      <div className="flex-1 space-y-5 overflow-auto pr-1">
        {section("Direct", direct)}
        {section("Groups", groups)}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-2 px-2 text-xs text-muted">{currentUser?.name || currentUser?.email || "User"}</div>
        <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
};
