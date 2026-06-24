import { ReactNode } from "react";
import { CheckCircle2, MessageCircle, ShieldCheck, Video } from "lucide-react";
import { Card } from "../ui/card";
import { LinkUpLogo } from "../ui/logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const highlights = [
  { icon: MessageCircle, label: "Fast team messaging" },
  { icon: Video, label: "Calls when context matters" },
  { icon: ShieldCheck, label: "Workspace-ready access" }
];

export const AuthShell = ({ eyebrow, title, description, children }: AuthShellProps) => (
  <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:block">
        <LinkUpLogo className="mb-10" iconClassName="h-11 w-11" />
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h1 className="max-w-xl text-5xl font-semibold leading-tight text-text">
          Keep every conversation moving in one calm workspace.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          LinkUp brings messages, calls, and people together with a focused
          interface built for everyday team flow.
        </p>

        <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-lg border border-border/80 bg-panel/70 p-4 shadow-sm backdrop-blur"
            >
              <Icon className="mb-3 h-5 w-5 text-accent" />
              <p className="text-sm font-medium leading-5 text-text">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center lg:hidden">
          <LinkUpLogo iconClassName="h-10 w-10" />
        </div>
        <Card className="overflow-hidden shadow-xl shadow-blue-950/10">
          <div className="border-b border-border/70 bg-panel/70 px-6 py-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-bg/70 px-3 py-1 text-xs font-medium text-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              Secure workspace access
            </div>
            <h2 className="text-2xl font-semibold text-text">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </div>
          <div className="p-6">{children}</div>
        </Card>
      </section>
    </div>
  </main>
);
