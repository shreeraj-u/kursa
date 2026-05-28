"use client";

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span
        className="mono shrink-0 text-mute-2 tracking-[0.05em] uppercase"
        style={{ fontSize: "var(--text-xs)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

export function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? "" : opt.value)}
            style={{ fontSize: "var(--text-sm)" }}
            className={`px-3 py-1 rounded-md cursor-pointer transition-all duration-150 border ${
              active
                ? "font-medium text-ink bg-bg-sub-2 border-line-2"
                : "font-normal text-mute bg-transparent border-line"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Textarea({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 3,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      style={{ fontSize: "var(--text-base)" }}
      className="w-full resize-y rounded-lg px-3 py-2 text-ink bg-surface border border-line-2 outline-none font-inherit leading-relaxed focus:border-ink-3 transition-colors"
    />
  );
}

export function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative shrink-0 w-9 h-5 rounded-full p-[2px] transition-colors duration-150 border-none disabled:opacity-50 ${on ? "bg-accent" : "bg-line-2"} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`block w-4 h-4 rounded-full bg-white transition-transform duration-150 ${on ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}
