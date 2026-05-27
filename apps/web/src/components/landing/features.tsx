import type { ReactNode } from "react";

import { HoverLift } from "@/components/motion/hover-lift";
import { SlideIn } from "@/components/motion/slide-in";
import CareerMapMock from "@/components/mocks/career-map";
import SkillsMock from "@/components/mocks/skills";
import ResumeMock from "@/components/mocks/resume";
import ShortlistMock from "@/components/mocks/shortlist";
import AgentMock from "@/components/mocks/agent";
import JournalMock from "@/components/mocks/journal";

type FeatureProps = {
  eyebrow: string;
  num: string;
  head: string;
  body: string;
  mock: ReactNode;
  flip?: boolean;
};

function Feature({ eyebrow, num, head, body, mock, flip }: FeatureProps) {
  return (
    <section className="py-20 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <SlideIn direction={flip ? "right" : "left"} className={flip ? "lg:order-2" : ""}>
            <div className="eyebrow mono mb-3">
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{num}</span> · {eyebrow}
            </div>
            <h2
              className="font-semibold tracking-tight text-[var(--ink)] mb-4 leading-tight"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)" }}
            >
              {head}
            </h2>
            <p className="lede">{body}</p>
          </SlideIn>

          {/* Mock */}
          <SlideIn direction={flip ? "left" : "right"} className={flip ? "lg:order-1" : ""}>
            <HoverLift lift={-4}>{mock}</HoverLift>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesSection() {
  return (
    <div id="features">
      <Feature
        num="01" eyebrow="career path"
        head="Five futures. One map."
        body="Branching paths plotted from where you stand today. Hover any node to see what it costs, what it returns, and how it changes the shape of everything downstream."
        mock={<CareerMapMock />}
      />
      <Feature
        num="02" eyebrow="skills profile"
        head="A portrait, not a spreadsheet."
        body="Skills weighted by depth, recency, and relevance to the path you've chosen. Gaps ranked by strategic impact — not by what's trending on LinkedIn this week."
        mock={<SkillsMock />}
        flip
      />
      <Feature
        num="03" eyebrow="resume studio"
        head="The résumé writes itself. You edit."
        body="Pick a target. Watch the document re-rank. Every line that moves is explained. Every change is yours to accept or reject before it leaves your machine."
        mock={<ResumeMock />}
      />
      <Feature
        num="04" eyebrow="role shortlist"
        head="Twelve roles. None of them noise."
        body="No firehose. A curated list, each role chosen for where you want to be in three years, not just where you'd qualify today. Each card carries the reason it's there."
        mock={<ShortlistMock />}
        flip
      />
      <Feature
        num="05" eyebrow="aria"
        head="An advisor that remembers."
        body="Aria has the full thread. What you said in March is context for what you're asking in November. The conversation has memory — which means it can finally have weight."
        mock={<AgentMock />}
      />
      <Feature
        num="06" eyebrow="career journal"
        head="The work doesn't end at signing."
        body="Once you're in the role, Kursa keeps the log. Wins captured, drift noticed, review prep written for you. When the next move starts to make sense, you'll hear it here first."
        mock={<JournalMock />}
        flip
      />
    </div>
  );
}
