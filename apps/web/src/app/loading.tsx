import { Logo } from "@/components/logo";

export default function RootLoading() {
  return (
    <div className="min-h-svh w-screen flex flex-col items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-6 animate-pulse select-none">
        <Logo size="lg" />
        <div className="flex items-center gap-2">
          {/* Subtle minimal spinner */}
          <div className="h-3 w-3 animate-spin rounded-full border border-ink/20 border-t-accent" />
          <span className="mono text-2xs text-mute-2 tracking-mono lowercase">
            optimizing orbit...
          </span>
        </div>
      </div>
    </div>
  );
}
