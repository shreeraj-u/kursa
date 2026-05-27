type Skill = { n: string; w: number; total?: number; since: string; faded?: boolean; label?: string };

const TECH: Skill[] = [
  { n: "TypeScript", w: 6, since: "used now"  },
  { n: "React",      w: 5, since: "used now"  },
  { n: "Python",     w: 3, since: "4mo ago",  faded: true },
  { n: "Go",         w: 2, since: "2mo ago"   },
  { n: "Postgres",   w: 4, since: "used now"  },
  { n: "Kubernetes", w: 2, since: "1yr ago",  faded: true },
];

const LEAD: Skill[] = [
  { n: "1:1 coaching",     w: 3, since: "used now" },
  { n: "Hiring loops",     w: 2, since: "3wk ago"  },
  { n: "Roadmap planning", w: 3, since: "used now" },
];

const BUILD: Skill[] = [
  { n: "Systems design", w: 3, total: 5, since: "", label: "in progress" },
  { n: "Eng management", w: 1, total: 5, since: "", label: "in progress" },
];

const GAPS = [
  { n: "Performance reviews",       why: "required for the EM ladder at most companies"      },
  { n: "Cross-functional planning", why: "surfaces in 14 of 18 EM JDs you've matched"        },
  { n: "Budget ownership",          why: "differentiator at series-C and beyond"              },
];

function SkillRow({ skill, maxW }: { skill: Skill; maxW: number }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
      <span
        className="flex-shrink-0"
        style={{
          width: 90,
          fontSize: 11,
          color: skill.faded ? "var(--mute-3)" : "var(--ink)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {skill.n}
      </span>
      <div className="flex gap-px flex-1" style={{ maxWidth: 70 }}>
        {Array.from({ length: skill.total ?? maxW }).map((_, i) => (
          <i
            key={i}
            className="not-italic rounded-[1px]"
            style={{
              flex: 1,
              height: 5,
              background:
                i < skill.w
                  ? skill.faded
                    ? "var(--line-3)"
                    : skill.label
                      ? "var(--accent-line)"
                      : "var(--ink-3)"
                  : "var(--line)",
            }}
          />
        ))}
      </div>
      <span
        className="mono flex-shrink-0"
        style={{ fontSize: 9.5, color: "var(--mute-3)", whiteSpace: "nowrap" }}
      >
        {skill.label ?? skill.since}
      </span>
    </div>
  );
}

function Cat({ name, count, skills, maxW = 6 }: { name: string; count: string; skills: Skill[]; maxW?: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="mono flex items-center justify-between mb-2"
        style={{
          fontSize: 9.5,
          color: "var(--mute)",
          paddingBottom: 4,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span>{name}</span>
        <span>{count}</span>
      </div>
      {skills.map((s) => (
        <SkillRow key={s.n} skill={s} maxW={maxW} />
      ))}
    </div>
  );
}

export default function SkillsMock() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      {/* Chrome */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-sub)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {["#F5A0A0", "#F5D0A0", "#A0D0A0"].map((c, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 10, color: "var(--mute-2)" }}>
            kursa.app / skills
          </span>
        </div>
        <span className="chip">
          <span className="dot" />
          last refreshed · 2d
        </span>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 divide-x divide-[var(--line)]">
        {/* Left: skill categories */}
        <div className="p-4">
          <Cat name="technical"  count="6 / 32" skills={TECH} maxW={6} />
          <Cat name="leadership" count="3 / 9"  skills={LEAD} maxW={3} />
          <Cat name="being built" count="2"     skills={BUILD} maxW={5} />
        </div>

        {/* Right: gap list */}
        <div className="p-4">
          <div
            className="font-semibold text-[var(--ink)] mb-1"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Gap to chosen path
          </div>
          <div
            className="mono mb-4"
            style={{ fontSize: 9.5, color: "var(--mute)", lineHeight: 1.4 }}
          >
            ranked by strategic impact · eng manager track
          </div>
          <div className="flex flex-col gap-3">
            {GAPS.map((g, i) => (
              <div key={i} className="flex gap-2.5">
                <span
                  className="mono flex-shrink-0 font-semibold"
                  style={{ fontSize: 9.5, color: "var(--mute-3)", minWidth: 16 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div
                    className="font-medium text-[var(--ink)]"
                    style={{ fontSize: 11.5, marginBottom: 2 }}
                  >
                    {g.n}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--mute)", lineHeight: 1.4 }}>
                    {g.why}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mono mt-4 pt-3"
            style={{
              borderTop: "1px solid var(--line)",
              fontSize: 10,
              color: "var(--mute)",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "var(--ink)" }}>add a skill</span> via conversation —
            <br />
            "Aria, I led the search rewrite last quarter."
          </div>
        </div>
      </div>
    </div>
  );
}
