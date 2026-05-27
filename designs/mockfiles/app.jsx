/* ──────────────────────────────────────────────────────────────
   Kursa landing page composition.
   Sections kept short; the product mocks do the selling.
   ────────────────────────────────────────────────────────────── */

const { useState } = React;

function Nav(){
  return (
    <nav className="top">
      <div className="wrap inner">
        <a className="brand" href="#">
          <span className="brand-mark"></span>
          <span>Kursa</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">The product</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-right">
          <a className="login" href="#">Log in</a>
          <a className="btn sm" href="#">Get started</a>
        </div>
      </div>
    </nav>
  );
}

function Hero(){
  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="yc-badge">
            <span className="dot"/>
            Backed by First Round &amp; founders of Stripe, Vercel
          </span>
          <h1 className="head">
            A career, designed.<br/>
            <em>Not job-hunted.</em>
          </h1>
          <p className="sub">
            Kursa is an AI career operating system. It thinks alongside you between roles, during reviews, and across the years in between. One advisor. Your whole career.
          </p>
          <div className="hero-ctas">
            <a className="btn" href="#">Get started — free</a>
            <a className="link" href="#how">See how it works <span aria-hidden>→</span></a>
          </div>
        </div>
        <div>
          <HeroDashboardMock/>
        </div>
      </div>
    </header>
  );
}

function LogoRow(){
  // Stylised wordmarks — original treatments, kept greyscale per the brief.
  const cos = [
    {n:"Stripe"}, {n:"Linear"}, {n:"Ramp"}, {n:"Vercel", serif:true},
    {n:"Anthropic"}, {n:"Notion"}, {n:"Figma"}, {n:"Datadog"}
  ];
  return (
    <div className="logo-row">
      <div className="wrap">
        <div className="head mono">where kursa members have landed · last 90 days</div>
        <div className="logos">
          {cos.map((c,i)=>(
            <span key={i} className={"lg"+(c.serif?' serif':'')}>{c.n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Steps(){
  const steps = [
    {n:"01", k:"map",   t:"Know where you are.", d:"A real read of your current position — skills, signals, gaps. Not a quiz. A conversation that builds a working model of you over time."},
    {n:"02", k:"plan",  t:"See the territory.",  d:"Three to five paths plotted forward from where you stand. Each milestone, each decision point, anchored in real time."},
    {n:"03", k:"move",  t:"Apply with intent.",  d:"A shortlist of roles chosen for the path, not the algorithm. Resumes tailored from your stored history, not a template."},
    {n:"04", k:"grow",  t:"Stay sharp, in role.", d:"Once you're employed, Kursa keeps reading. It logs wins, watches for drift, and tells you when it's time to think about what's next."},
  ];
  return (
    <section id="how">
      <div className="wrap">
        <div className="eyebrow mono"><span className="num">·</span> how it works</div>
        <h2 className="section-head">One advisor. The whole career.</h2>
        <p className="section-body">Most career tools wake up when you start applying and disappear once you've signed. Kursa is the other way around — present in the long stretch between, where the work actually happens.</p>
        <div className="steps">
          {steps.map(s=>(
            <div className="step" key={s.n}>
              <div className="e mono"><span className="n">{s.n}</span> · {s.k}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({eyebrow, num, head, body, mock, flip}){
  return (
    <section>
      <div className="wrap">
        <div className={"two-col"+(flip?' flip':'')}>
          <div className="copy">
            <div className="eyebrow mono"><span className="num">{num}</span> · {eyebrow}</div>
            <h2 className="section-head">{head}</h2>
            <p className="section-body">{body}</p>
          </div>
          <div>{mock}</div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection(){
  return (
    <div id="features">
      <Feature
        num="01" eyebrow="career path"
        head="Five futures. One map."
        body="Branching paths plotted from where you stand today. Hover any node to see what it costs, what it returns, and how it changes the shape of everything downstream."
        mock={<CareerMapMock/>}
      />
      <Feature
        num="02" eyebrow="skills profile" flip
        head="A portrait, not a spreadsheet."
        body="Skills weighted by depth, recency, and relevance to the path you've chosen. Gaps ranked by strategic impact — not by what's trending on LinkedIn this week."
        mock={<SkillsMock/>}
      />
      <Feature
        num="03" eyebrow="resume studio"
        head="The résumé writes itself. You edit."
        body="Pick a target. Watch the document re-rank. Every line that moves is explained. Every change is yours to accept or reject before it leaves your machine."
        mock={<ResumeMock/>}
      />
      <Feature
        num="04" eyebrow="role shortlist" flip
        head="Twelve roles. None of them noise."
        body="No firehose. A curated list, each role chosen for where you want to be in three years, not just where you'd qualify today. Each card carries the reason it's there."
        mock={<ShortlistMock/>}
      />
      <Feature
        num="05" eyebrow="aria"
        head="An advisor that remembers."
        body="Aria has the full thread. What you said in March is context for what you're asking in November. The conversation has memory — which means it can finally have weight."
        mock={<AgentMock/>}
      />
      <Feature
        num="06" eyebrow="career journal" flip
        head="The work doesn't end at signing."
        body="Once you're in the role, Kursa keeps the log. Wins captured, drift noticed, review prep written for you. When the next move starts to make sense, you'll hear it here first."
        mock={<JournalMock/>}
      />
    </div>
  );
}

function Pricing(){
  const tiers = [
    {
      tag:"free", pop:false,
      name:"Open",
      pos:"Enough to feel what it does. No credit card.",
      vol:"3", unit:"path scenarios / month",
      cost:"$0 forever",
      bullets:[
        "Full career map · 3 scenarios",
        "Skills profile, no expiry",
        "10 messages / day with Aria",
        "1 résumé version"
      ],
      cta:"Get started"
    },
    {
      tag:"standard", pop:true,
      name:"Member",
      pos:"For the person actually planning a career, not just looking for a job.",
      vol:"∞", unit:"path scenarios · unlimited",
      cost:"$24 / month · billed yearly",
      bullets:[
        "Everything in Open",
        "Unlimited Aria conversations with memory",
        "Tailored shortlist · refreshed weekly",
        "Unlimited résumé versions + tailoring",
        "Career journal · post-placement"
      ],
      cta:"Start 14-day trial"
    },
    {
      tag:"intensive", pop:false,
      name:"In-search",
      pos:"For the laid-off, the OPT-clocked, the people who need this to work in the next 90 days.",
      vol:"50", unit:"tailored applications / month",
      cost:"$59 / month · cancel anytime",
      bullets:[
        "Everything in Member",
        "Same-day shortlist refresh",
        "Per-application tailoring at depth",
        "Practice interviews with Aria",
        "Priority human review on flagged drafts"
      ],
      cta:"Start In-search"
    }
  ];
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="eyebrow mono"><span className="num">·</span> pricing</div>
        <h2 className="section-head">Pay for the relationship. Not the form fields.</h2>
        <p className="section-body">Three tiers. One free. The middle one is what most people use. Nothing here is priced per résumé generated or per message sent — the agent gets weirder if you meter it.</p>
        <div className="price-grid">
          {tiers.map((t,i)=>(
            <div className="price" key={i}>
              <div className="tag mono">
                <span>{t.tag}</span>
                {t.pop && <span className="pop">most chosen</span>}
              </div>
              <h3>{t.name}</h3>
              <p className="pos">{t.pos}</p>
              <div className="vol">{t.vol}<span className="u">{t.unit}</span></div>
              <div className="cost mono">{t.cost}</div>
              <ul>
                {t.bullets.map((b,j)=><li key={j}>{b}</li>)}
              </ul>
              <a className={"btn"+(t.pop?'':' ghost')} href="#">{t.cta}</a>
            </div>
          ))}
        </div>
        <div className="reassure">
          <span className="r">Cancel anytime</span>
          <span className="r">Free tier never expires</span>
          <span className="r">Your data is portable on day one</span>
        </div>
      </div>
    </section>
  );
}

function FAQ(){
  const items = [
    {
      q:"Is this just ChatGPT with a résumé wrapper?",
      a:"No, and the difference shows up after a few weeks of use. ChatGPT forgets you between sessions. Kursa keeps a structured model of your career — your skills, decisions, goals, and the reasoning behind them — and uses it as context for every conversation. The agent isn't smart because the model is smart. It's smart because it remembers."
    },
    {
      q:"What happens to my data if I cancel?",
      a:"You can export everything — your full skills profile, every résumé version, the entire conversation history with Aria, your journal entries — as JSON or PDF on the way out. We don't hold your career hostage. The expectation is that you stay because it's useful, not because leaving is painful."
    },
    {
      q:"Does Aria apply to jobs for me automatically?",
      a:"No. Aria drafts, tailors, and queues — but a human presses send. The application pipeline is full of judgment calls (timing, tone, whether to apply at all) that don't belong to an agent yet. We may revisit this when models can be trusted with that judgment. Not now."
    },
    {
      q:"How is this different from a career coach?",
      a:"It's not a replacement, and we'll tell anyone who asks the same thing. A good coach reads you in ways the product can't. What Kursa does is the work between sessions — the tracking, the drafting, the watching for drift, the second-by-second context a coach simply doesn't have time to keep. If you already have a coach, Kursa makes their sessions sharper."
    },
    {
      q:"Who is this not for?",
      a:"People who want a single résumé to send to 200 jobs in a week. People looking for a job board. People who already know exactly where they want to go and just need to get there fast — that's a different tool. Kursa earns its keep over years, not weekends."
    },
    {
      q:"Will my employer find out I'm using it?",
      a:"No. The journal, conversations, and any draft applications live in your account and are never indexed externally. We don't sell signals to recruiters or employers. The product only works if you trust it with the honest version of where you are — so the boundaries are non-negotiable."
    }
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq">
      <div className="wrap">
        <div className="eyebrow mono"><span className="num">·</span> questions</div>
        <h2 className="section-head">The real ones, answered honestly.</h2>
        <p className="faq-intro">Don't see yours? <a href="mailto:shreeraj@kursa.app">Email a founder</a> — replies in under a day.</p>
        <div className="faq-list">
          {items.map((it,i)=>(
            <div className={"faq-item"+(open===i?' open':'')} key={i}>
              <button className="faq-q" onClick={()=>setOpen(open===i?-1:i)}>
                <span>{it.q}</span>
                <span className="toggle"></span>
              </button>
              <div className="faq-a">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EndCTA(){
  return (
    <div className="end-cta">
      <div className="wrap">
        <h2>The career was always going to be long.<br/><span style={{color:'var(--mute-2)'}}>Now it has someone watching.</span></h2>
        <p>Start in three minutes. No résumé upload. No quiz.</p>
        <a className="btn" href="#" style={{padding:'12px 22px'}}>Get started — free</a>
      </div>
    </div>
  );
}

function Footer(){
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div>
            <a className="brand" href="#">
              <span className="brand-mark"></span>
              <span>Kursa</span>
            </a>
            <p className="desc">An AI career operating system. Built for the people who think about work for more than a weekend at a time.</p>
          </div>
          <div>
            <h6 className="mono">product</h6>
            <ul>
              <li><a href="#">Career map</a></li>
              <li><a href="#">Skills profile</a></li>
              <li><a href="#">Resume studio</a></li>
              <li><a href="#">Role shortlist</a></li>
              <li><a href="#">Journal</a></li>
            </ul>
          </div>
          <div>
            <h6 className="mono">platforms</h6>
            <ul>
              <li><a href="#">macOS</a></li>
              <li><a href="#">Windows</a></li>
              <li><a href="#">iOS</a></li>
              <li><a href="#">Android</a></li>
              <li><a href="#">Web</a></li>
            </ul>
          </div>
          <div>
            <h6 className="mono">company</h6>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Manifesto</a></li>
              <li><a href="#">Journal</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h6 className="mono">legal</h6>
            <ul>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Data policy</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="copyrow mono">
          <span>© 2026 Kursa Labs · San Francisco</span>
          <span>v 2.4 · last shipped 4 days ago</span>
        </div>
      </div>
    </footer>
  );
}

function App(){
  return (
    <>
      <Nav/>
      <Hero/>
      <LogoRow/>
      <Steps/>
      <FeaturesSection/>
      <Pricing/>
      <FAQ/>
      <EndCTA/>
      <Footer/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
