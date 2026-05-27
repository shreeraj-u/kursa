/* ──────────────────────────────────────────────────────────────
   Product UI mocks. Each one is the "proof" for a section.
   Realistic data, monospace technical details, status chips,
   diff-style before/after, in-motion live states.
   ────────────────────────────────────────────────────────────── */

// ── 1. Hero dashboard mock ────────────────────────────────────
function HeroDashboardMock(){
  return (
    <div className="mock dash">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="path mono">kursa.app / home</span>
        </div>
        <span className="chip live mono"><span className="dot"/>aria · online</span>
      </div>
      <div className="mbody">
        <div className="greet">
          <div className="label">tuesday · 7:42 am</div>
          <h3>Good morning, Alex.</h3>
          <p>You're three weeks into the new role at Stripe. Things look steady — two items worth your attention below.</p>
        </div>
        <div className="observe">
          <div className="o">
            <div className="marker"/>
            <div>
              <p>Your Python work has slowed to a trickle over the past four months. You said staying sharp here mattered — want to scope a weekend project?</p>
              <div className="meta">noticed · 2h ago</div>
            </div>
          </div>
          <div className="o">
            <div className="marker"/>
            <div>
              <p>A staff role just opened at Linear — on your target list since March. Strategic fit reads <b>high</b>. Worth a look before applications close.</p>
              <div className="meta">surfaced · 18m ago</div>
            </div>
          </div>
        </div>
        <div className="pulse">
          <PulseCol label="growth" pattern={[0,1,1,2,1,2,2,2,1,2,2,2]} accent={[10,11]} />
          <PulseCol label="visibility" pattern={[1,0,1,1,1,2,1,1,2,1,2,1]} accent={[]} />
          <PulseCol label="progression" pattern={[0,0,0,1,1,1,1,1,1,2,2,2]} accent={[10,11]} />
        </div>
        <div className="input">
          <span className="caret">›</span>
          <span className="field">Ask Aria anything…</span>
          <span className="kbd">⌘ K</span>
        </div>
      </div>
    </div>
  );
}
function PulseCol({label,pattern,accent}){
  return (
    <div className="p">
      <div className="k">{label}</div>
      <div className="bar">
        {pattern.map((v,i)=>{
          const h = [6,14,22][v];
          const isAcc = accent.includes(i);
          return <i key={i} className={isAcc?'acc':(v>0?'on':'')} style={{height:h+'px'}}/>;
        })}
      </div>
    </div>
  );
}

// ── 2. Career path map mock ───────────────────────────────────
function CareerMapMock(){
  // 5 paths branching from the "now" node at (12%, 50%)
  // x = % horizontal, y = % vertical
  const now = {x:11, y:52};
  const nodes = [
    // chosen path (Engineering Manager)
    {x:30, y:30, label:"Tech lead", yr:"+0.7y", cls:"chosen"},
    {x:50, y:22, label:"Eng manager", yr:"+1.8y", cls:"chosen"},
    {x:74, y:18, label:"Director", yr:"+3.5y", cls:"chosen"},
    // senior engineer path
    {x:35, y:54, label:"Senior eng", yr:"+1y", cls:"dim"},
    {x:62, y:48, label:"Staff eng", yr:"+2.5y", cls:"dim"},
    {x:88, y:42, label:"Principal", yr:"+5y", cls:"dim"},
    // product
    {x:38, y:74, label:"PM rotation", yr:"+1.2y", cls:"dim"},
    {x:68, y:78, label:"Senior PM", yr:"+3y", cls:"dim"},
    // consultant
    {x:42, y:90, label:"Independent", yr:"+2y", cls:"dim"},
  ];
  const edges = [
    // chosen path
    {from:now, to:nodes[0], chosen:true},
    {from:nodes[0], to:nodes[1], chosen:true},
    {from:nodes[1], to:nodes[2], chosen:true},
    // senior eng
    {from:now, to:nodes[3]},
    {from:nodes[3], to:nodes[4]},
    {from:nodes[4], to:nodes[5]},
    // product
    {from:now, to:nodes[6]},
    {from:nodes[6], to:nodes[7]},
    // consultant
    {from:now, to:nodes[8]},
  ];
  return (
    <div className="mock map-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / path</span>
        </div>
        <div className="row" style={{gap:10}}>
          <span className="chip mono"><span className="dot" style={{background:'oklch(0.42 0.04 160)'}}/>chosen · eng manager</span>
          <span className="chip mono">+ alt 4</span>
        </div>
      </div>
      <div className="mbody">
        <div className="map-canvas">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {edges.map((e,i)=>(
              <line key={i}
                x1={e.from.x} y1={e.from.y}
                x2={e.to.x} y2={e.to.y}
                stroke={e.chosen ? "oklch(0.42 0.04 160)" : "#C9C6BD"}
                strokeWidth={e.chosen ? "0.35" : "0.2"}
                strokeDasharray={e.chosen ? "" : "1 0.8"}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="map-node now" style={{left:now.x+'%',top:now.y+'%'}}>
            <span className="pin"/> you are here <span className="yr">2026 · sde II</span>
          </div>
          {nodes.map((n,i)=>(
            <div key={i}
              className={"map-node "+n.cls}
              style={{left:n.x+'%',top:n.y+'%'}}>
              <span className="pin"/> {n.label} <span className="yr">{n.yr}</span>
            </div>
          ))}
          <div className="map-tip">
            <div className="t mono">milestone · eng manager</div>
            <h5>Run your first team</h5>
            <p>Requires: 1 yr tech lead, 2 reports, hiring loop trained. Unlocks the management track at most series-B+ companies.</p>
            <div className="meta">
              <span>~14 months</span>
              <span>impact · high</span>
            </div>
          </div>
        </div>
        <div className="axis">
          <span>now</span>
          <span>+1 yr</span>
          <span>+2 yr</span>
          <span>+3 yr</span>
          <span>+5 yr</span>
        </div>
      </div>
    </div>
  );
}

// ── 3. Skills profile mock ────────────────────────────────────
function SkillsMock(){
  const tech = [
    {n:"TypeScript", w:[3,3,3,3,3,3], since:"used now"},
    {n:"React",      w:[3,3,3,3,3], since:"used now"},
    {n:"Python",     w:[3,3,3], since:"4mo ago", faded:true},
    {n:"Go",         w:[3,3], since:"2mo ago"},
    {n:"Postgres",   w:[3,3,3,3], since:"used now"},
    {n:"Kubernetes", w:[3,3], since:"1yr ago", faded:true},
  ];
  const lead = [
    {n:"1:1 coaching",     w:[3,3,3], since:"used now"},
    {n:"Hiring loops",     w:[3,3], since:"3wk ago"},
    {n:"Roadmap planning", w:[3,3,3], since:"used now"},
  ];
  const build = [
    {n:"Systems design",  w:[3,3,3], total:5, label:"in progress"},
    {n:"Eng management",  w:[3], total:5, label:"in progress"},
  ];
  const gaps = [
    {n:"Performance reviews", why:"required for the EM ladder at most companies"},
    {n:"Cross-functional planning", why:"surfaces in 14 of 18 EM JDs you've matched"},
    {n:"Budget ownership", why:"differentiator at series-C and beyond"},
  ];
  return (
    <div className="mock skills-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / skills</span>
        </div>
        <span className="chip mono"><span className="dot"/>last refreshed · 2d</span>
      </div>
      <div className="mbody">
        <div className="skill-grid">
          <div className="skill-left">
            <SkillCat name="technical" count="6 / 32" items={tech} />
            <SkillCat name="leadership" count="3 / 9" items={lead} />
            <div className="skill-cat">
              <div className="cat mono"><span>being built</span><span>2</span></div>
              {build.map((b,i)=>(
                <div className="skill-row" key={i}>
                  <span className="name">{b.n}</span>
                  <span className="skill-bar">
                    {Array.from({length:b.total}).map((_,j)=>(
                      <i key={j} className={j<b.w.length?'build':''} style={{flex:1,marginRight:j<b.total-1?1:0}}/>
                    ))}
                  </span>
                  <span className="since mono">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="skill-right">
            <h5>Gap to chosen path</h5>
            <p className="sub mono">ranked by strategic impact · eng manager track</p>
            <div className="gap-list">
              {gaps.map((g,i)=>(
                <div className="gap-item" key={i}>
                  <span className="rank mono">{String(i+1).padStart(2,'0')}</span>
                  <div>
                    <div className="n">{g.n}</div>
                    <div className="why">{g.why}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid var(--line)',fontSize:11,color:'var(--mute)',fontFamily:'JetBrains Mono,monospace',lineHeight:1.5}}>
              <span style={{color:'var(--ink)'}}>add a skill</span> via conversation —<br/>
              "Aria, I led the search&nbsp;rewrite last quarter."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function SkillCat({name,count,items}){
  return (
    <div className="skill-cat">
      <div className="cat mono"><span>{name}</span><span>{count}</span></div>
      {items.map((s,i)=>(
        <div className="skill-row" key={i}>
          <span className={"name"+(s.faded?' faded':'')}>{s.n}</span>
          <span className="skill-bar">
            {s.w.map((_,j)=><i key={j} className={s.faded?'faded':''} style={{flex:1,marginRight:j<s.w.length-1?1:0}}/>)}
          </span>
          <span className="since mono">{s.since}</span>
        </div>
      ))}
    </div>
  );
}

// ── 4. Resume Studio mock ─────────────────────────────────────
function ResumeMock(){
  return (
    <div className="mock resume-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / resume</span>
        </div>
        <span className="chip live mono"><span className="dot"/>tailoring · reading JD</span>
      </div>
      <div className="res-version-bar">
        <span className="v active">alex_morgan · em_track_v6.pdf</span>
        <span className="v">staff_eng_v4.pdf</span>
        <span className="v">linear_em_v1.pdf</span>
        <span className="v">stripe_apply_v2.pdf</span>
        <span style={{marginLeft:'auto'}}>4 versions</span>
      </div>
      <div className="mbody">
        <div className="resume-grid">
          <div className="resume-left">
            <div className="doc">
              <div className="name">Alex Morgan</div>
              <div className="contact mono">
                <span>alex@morgan.dev</span><span>sf · ca</span><span>github.com/amorgan</span>
              </div>
              <hr/>
              <div className="sec-h">experience</div>
              <div className="role">
                <div className="r">Senior Software Engineer · Stripe</div>
                <div className="d mono">2024 – present</div>
              </div>
              <ul>
                <li className="diff-add">Led a four-engineer effort to rebuild the payouts ledger, cutting reconciliation lag from <b>11h</b> to under <b>20m</b>.</li>
                <li className="diff-del">Worked on the payouts team and helped improve reconciliation.</li>
                <li>Mentored two junior engineers through their first production launches.</li>
                <li className="diff-add">Ran the quarterly hiring loop — interviewed <b>22</b> candidates, made <b>4</b> hires now performing at-bar.</li>
              </ul>
              <div className="role">
                <div className="r">Software Engineer · Datadog</div>
                <div className="d mono">2021 – 2024</div>
              </div>
              <ul>
                <li>Shipped the metrics intake rewrite, sustaining 2.3M req/s at p99 of 41ms.</li>
                <li>Owned the on-call rotation for the ingestion pod through three major outages.</li>
              </ul>
            </div>
          </div>
          <div className="resume-right">
            <div className="ats">
              <div className="ring"><i>88</i></div>
              <div>
                <div className="t">ATS readable · strong</div>
                <div className="s">Two suggestions left. Both about phrasing, not structure.</div>
              </div>
            </div>
            <div className="coverage">
              <h5>profile coverage</h5>
              <div className="cov-row in"><span className="icon"/><span className="label">Stripe — payouts ledger</span><span className="why">on-path</span></div>
              <div className="cov-row in"><span className="icon"/><span className="label">Hiring loop · 22 ints</span><span className="why">EM signal</span></div>
              <div className="cov-row in"><span className="icon"/><span className="label">Mentorship · 2 ICs</span><span className="why">EM signal</span></div>
              <div className="cov-row out"><span className="icon"/><span className="label">Kubernetes deep-dives</span><span className="why">off-path</span></div>
              <div className="cov-row out"><span className="icon"/><span className="label">Side project · clipsy</span><span className="why">unrelated</span></div>
            </div>
            <div className="tailor">
              <div className="t mono"><span>tailoring</span><span>auto · live</span></div>
              <div className="reading">
                <span className="pip"/>
                <span>Reading job description…</span>
                <span className="url mono">linear.app/careers/em-core</span>
              </div>
              <div style={{marginTop:10,fontSize:11.5,color:'var(--mute)',lineHeight:1.5}}>
                Two bullets re-ranked. One impact phrase shortened to fit the role's emphasis on <b style={{color:'var(--ink)'}}>scope ownership</b>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Shortlist mock ─────────────────────────────────────────
function ShortlistMock(){
  const roles = [
    {co:"Linear", letter:"L", title:"Engineering Manager, Core", reason:"On the line you've been walking — a real first EM seat at a product-led company you already admire.", cur:74, strat:92},
    {co:"Vercel", letter:"V", title:"Staff Engineer, Build Platform", reason:"Stepping stone. Closes the systems-design gap without leaving the IC track yet.", cur:82, strat:71},
    {co:"Ramp", letter:"R", title:"Engineering Manager, Money Movement", reason:"Direct analog to your Stripe ledger work — the easiest story to tell in an EM loop.", cur:79, strat:88},
    {co:"Render", letter:"r", title:"Senior Tech Lead, Infra", reason:"Tech-lead role that often promotes to EM within a year. Aligned with your stated timeline.", cur:86, strat:78},
  ];
  return (
    <div className="mock short-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / shortlist</span>
        </div>
        <span className="chip mono"><span className="dot"/>12 curated · 0 noise</span>
      </div>
      <div className="short-filter">
        <span>show me</span>
        <span className="pick">stepping-stone roles</span>
        <span>that match my</span>
        <span className="pick">eng manager track</span>
      </div>
      <div className="mbody" style={{padding:0}}>
        {roles.map((r,i)=>(
          <div className="role" key={i}>
            <div className="lg" style={{fontStyle:i===3?'italic':'normal'}}>{r.letter}</div>
            <div className="meta">
              <div className="top">
                <span className="t">{r.title}</span>
                <span className="c">{r.co}</span>
              </div>
              <div className="reason">{r.reason}</div>
            </div>
            <div className="fits">
              <div className="fit-pair mono"><span>current</span><span className="bar"><i style={{width:r.cur+'%'}}/></span><b>{r.cur}</b></div>
              <div className="fit-pair strat mono"><span>strategic</span><span className="bar"><i style={{width:r.strat+'%'}}/></span><b>{r.strat}</b></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 6. Agent conversation mock ────────────────────────────────
function AgentMock(){
  return (
    <div className="mock agent-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / aria</span>
        </div>
        <span className="chip mono"><span className="dot" style={{background:'var(--accent)'}}/>thread · 142 days</span>
      </div>
      <div className="mbody" style={{padding:0}}>
        <div className="agent-thread">
          <div className="msg user"><div className="body">I just got an offer from Ramp. 240 base, big equity grant. Should I take it?</div></div>
          <div className="msg aria">
            <div className="who"><span className="av"/><span>aria · 14:02</span></div>
            <div className="body">
              Given your two-year goal of stepping into engineering management, this is the cleanest setup I've seen for you. The team is small enough that tech-lead-to-EM is a real ladder, and your ledger work at Stripe maps directly to what they're solving. The base is on par with your current — the upside is in scope, not comp.
              <div style={{marginTop:8,fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--mute)'}}>
                · evaluated against your stated priorities (mar 2025) <br/>
                · cross-checked with 4 EM transitions in your network
              </div>
            </div>
          </div>
          <div className="msg aria">
            <div className="who"><span className="av"/><span>aria · 14:03</span></div>
            <div className="body">One thing I'd push back on — you haven't mentioned the people. The manager you'd report to is the variable that matters most. Want me to set up a question list before your closing call?</div>
          </div>
        </div>
        <div className="agent-prompts">
          <span className="sg">How am I tracking against my goals this month?</span>
          <span className="sg">Should I bring up a pay rise in my next review?</span>
          <span className="sg">Draft the questions for the closing call</span>
        </div>
        <div className="agent-input">
          <span className="caret">›</span>
          <span className="field">Continue the thread…</span>
          <span className="send mono">↵</span>
        </div>
      </div>
    </div>
  );
}

// ── 7. Career journal mock ────────────────────────────────────
function JournalMock(){
  // simple polyline of sentiment
  const points = [12,30,28,42,40,55,48,30,28,18,22,35,40];
  const sw = 480, sh = 60, pad = 6;
  const pts = points.map((p,i)=>{
    const x = pad + (i/(points.length-1))*(sw-pad*2);
    const y = pad + (1 - p/60)*(sh-pad*2);
    return [x,y];
  });
  const path = "M "+pts.map(p=>p.join(",")).join(" L ");
  return (
    <div className="mock journal-mock">
      <div className="mhead">
        <div className="row" style={{gap:8}}>
          <div className="dots"><span/><span/><span/></div>
          <span className="mono" style={{fontSize:11}}>kursa.app / journal</span>
        </div>
        <span className="chip mono"><span className="dot"/>employed · stripe · 84 days</span>
      </div>
      <div className="mbody" style={{padding:0}}>
        <div className="j-tabs">
          <span className="t on">Log</span>
          <span className="t">Wins</span>
          <span className="t">Review prep</span>
          <span className="t">Relevance</span>
        </div>
        <div className="j-entries">
          <div className="j-entry agent">
            <div className="when">today · 9:14</div>
            <div className="what"><span className="tag">aria</span>You've mentioned feeling under-challenged three times in the last six weeks. That's a pattern worth looking at, not panicking about.</div>
          </div>
          <div className="j-entry">
            <div className="when">yesterday</div>
            <div className="what"><span className="tag">win</span>Shipped the payouts retry queue — first design fully owned end-to-end. Director acknowledged in standup.</div>
          </div>
          <div className="j-entry">
            <div className="when">mon · 14:20</div>
            <div className="what"><span className="tag">feedback</span>Manager noted that I "drive clarity" in technical discussions. Filed under EM-relevant signal.</div>
          </div>
          <div className="j-entry agent">
            <div className="when">last wk</div>
            <div className="what"><span className="tag">aria</span>Your current role hasn't touched cross-functional planning in four months — that's the #1 gap for your next move. Three internal ways to close it noted in your roadmap.</div>
          </div>
        </div>
        <div className="j-sentiment">
          <div className="lbl mono"><span>engagement · last 12 weeks</span><span>quiet uptick</span></div>
          <svg className="sent-svg" viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="none">
            <path d={path} fill="none" stroke="oklch(0.42 0.04 160)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
            {pts.map((p,i)=>(
              <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="oklch(0.42 0.04 160)" />
            ))}
            <line x1={pad} y1={sh-pad} x2={sw-pad} y2={sh-pad} stroke="#E8E6E0" strokeWidth="0.7"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HeroDashboardMock, CareerMapMock, SkillsMock, ResumeMock,
  ShortlistMock, AgentMock, JournalMock
});
