import { Stagger, StaggerItem } from "@/components/motion/stagger";

const COMPANIES = ["Stripe", "Linear", "Ramp", "Vercel", "Anthropic", "Notion", "Figma", "Datadog"];

function LogoRow() {
  return (
    <div className="py-10 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="eyebrow mono mb-5">
          where kursa members have landed · last 90 days
        </div>
        <Stagger staggerDelay={0.04} className="flex items-center gap-8 flex-wrap">
          {COMPANIES.map((name) => (
            <StaggerItem key={name}>
              <span
                className="font-semibold tracking-tight cursor-default select-none opacity-[0.65] hover:opacity-100 transition-opacity"
                style={{ fontSize: "var(--text-md)", color: "var(--mute-3)" }}
              >
                {name}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
export default LogoRow;
