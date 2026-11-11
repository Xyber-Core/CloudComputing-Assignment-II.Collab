export async function initXyberOverlay() {
  // Avoid duplicate overlays if multiple controls invoke initialization.
  if (document.getElementById('xc-trigger')) return;
  /* ══════════════════════════════════════════════════════
  Configuration - [Json structure to hold all content for 
  the overlay.]
══════════════════════════════════════════════════════ */
  // Project details and labels are kept here to make future edits straightforward.
  const CONFIG = {
    badge: {
      image: './Assets/Images/Xyber.webp',
      label: 'XYBERCORE / PRINT',
      version: 'BACT7602',
    },

    credits: [
      {
        category: 'Academic context',
        items: [
          {
            name: 'Whitecliffe',
            role: 'BACT7602 Assessment 2 · T1 Web App Modernisation. The fictional Wellington client and assessment brief provide the scenario.',
            badge: 'Education',
            logo: 'https://www.google.com/s2/favicons?domain=whitecliffe.ac.nz&sz=64',
            color: 'rgba(91, 180, 252, .16)',
          },
        ],
      },
      {
        category: 'Application and delivery',
        items: [
          {
            name: 'HTML, CSS & JavaScript',
            role: 'Responsive interface, accessible controls, animated cards and dynamically loaded navigation and footer.',
            badge: 'Frontend',
            emoji: '✦',
            color: 'rgba(74, 211, 252, .15)',
          },
          {
            name: 'Node.js & Express',
            role: 'Local REST API, request validation and coordinator workflows for development and testing.',
            badge: 'Local API',
            emoji: '⬡',
            color: 'rgba(113, 231, 179, .14)',
          },
          {
            name: 'Cloudflare Pages, Workers & D1',
            role: 'Current demonstration frontend, API and database. Cloudflare D1 does not establish New Zealand-only residency.',
            badge: 'Cloud demo',
            logo: 'https://www.google.com/s2/favicons?domain=cloudflare.com&sz=64',
            color: 'rgba(249, 153, 77, .14)',
          },
          {
            name: 'TypeScript, Vitest & GitHub Actions',
            role: 'Worker implementation, automated tests and source-control workflows.',
            badge: 'Testing / CI',
            emoji: '✓',
            color: 'rgba(168, 153, 255, .15)',
          },
          {
            name: 'Visual Studio Code',
            role: 'Development environment for editing and reviewing the frontend and backend code.',
            badge: 'Editor',
            logo: 'https://www.google.com/s2/favicons?domain=code.visualstudio.com&sz=64',
            color: 'rgba(44, 141, 244, .15)',
          },
        ],
      },
      {
        category: 'Development assistance',
        items: [
          {
            name: 'ChatGPT',
            role: 'Assistance with troubleshooting, planning, code suggestions and documentation; use is disclosed in the assessment AI declaration.',
            badge: 'AI assistance',
            logo: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64',
            color: 'rgba(45, 199, 159, .14)',
          },
          {
            name: 'Claude',
            role: 'Listed as a brainstorming, debugging and refinement aid in the project credits; acknowledge actual use in the AI declaration.',
            badge: 'AI assistance',
            logo: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64',
            color: 'rgba(215, 141, 102, .14)',
          },
        ],
      },
    ],

    developers: [
      {
        section: 'Developers',
        items: [
          {
            name: 'Shatha Abid Ali',
            role: 'Coordination & Cloud Infrastructure',
            badge: 'Cloud / coordination',
            color: 'rgba(74, 211, 252, .18)',
            description: 'Coordinates team delivery and leads the planned cloud infrastructure work.',
          },
          {
            name: 'Riker Hoch',
            role: 'Frontend & Git Collaboration',
            badge: 'Frontend',
            logo: './Assets/Images/riker.webp',
            color: 'rgba(168, 153, 255, .18)',
            description: 'Develops the portal interface, responsive navigation, interaction design and Git collaboration workflow.',
            socials: [
              { name: 'GitHub', username: 'RikerHoch', url: 'https://github.com/RikerHoch' },
              { name: 'LinkedIn', username: 'Riker Hoch', url: 'https://www.linkedin.com/in/riker-hoch-4219b22aa/' },
            ],
          },
          {
            name: 'Caleb Lambert',
            role: 'API, Database & Delivery',
            badge: 'Backend',
            logo: './Assets/Images/caleb.webp',
            color: 'rgba(255, 180, 128, .18)',
            description: 'Works on the request API, data handling, persistence and application delivery.',
          },
          {
            name: 'Fatimah Almukhtar',
            role: 'Quality & Operations',
            badge: 'Testing / operations',
            color: 'rgba(243, 116, 231, .16)',
            description: 'Focuses on quality checks, testing, monitoring and assessment operations evidence.',
          },
        ],
      },
    ],

    features: [
      {
        section: 'Five core workflows',
        color: 'cyan',
        items: [
          { key: '01', title: 'Submit a print request', desc: 'Customers enter a campaign reference, print category, description and priority.' },
          { key: '02', title: 'View requests', desc: 'Customers view their own jobs; coordinators can view the whole request queue and details.' },
          { key: '03', title: 'Assign and update', desc: 'Coordinators assign a named staff member and advance jobs through the permitted sequence.' },
          { key: '04', title: 'Find outstanding work', desc: 'Filter the queue by status, category and priority to focus on work that needs attention.' },
          { key: '05', title: 'Review status history', desc: 'A timestamped activity trail shows status changes and the person responsible.' },
        ],
      },
      {
        section: 'Coordinator review tools',
        color: 'purple',
        items: [
          { title: 'Reject a submitted request', desc: 'Record a reason when a newly submitted request cannot proceed; retain the decision in history.' },
          { title: 'Archive completed work', desc: 'Remove a completed job from the active queue without erasing its record or audit trail.' },
        ],
      },
      {
        section: 'Interface experience',
        color: 'green',
        items: [
          { title: 'Desktop and mobile', desc: 'Responsive request cards, a mobile navigation drawer and touch-friendly dialogs.' },
          { title: 'Blue × magenta design', desc: 'Frosted-glass surfaces, subtle neon accents, smooth hover states and loading indicators.' },
          { title: 'Local / cloud API selector', desc: 'Switch between the Express development API and the demonstration Cloudflare Worker.' },
          { title: 'Playful typography toggle', desc: 'A just-for-fun font switch changes the interface typeface without changing the language.' },
        ],
      },
    ],
  };
  /* ════════ END CONFIG ════════ */

  /* ══════════════════════════════════════════════════════
  Overlay Styling - [To style the overlay elements.]
══════════════════════════════════════════════════════ */
  const style = document.createElement('style');
  style.textContent = `
  /* ── Trigger ── */
  #xc-trigger {
    position: fixed;
    bottom: 24px; left: 24px;
    z-index: 99998;
    width: 52px; height: 52px;
    border: 0; padding: 0;
    border-radius: 50%;
    cursor: pointer;
    background: #08080e;
    display: flex; align-items: center; justify-content: center;
    transition: transform .2s cubic-bezier(.34,1.5,.64,1);
  }
  /* spinning gradient ring */
  #xc-trigger::before {
    content: "";
    position: absolute; inset: -3px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      #7c4dff, #00e5ff, #00e5a0, #7c4dff
    );
    animation: xc-spin 3s linear infinite;
    z-index: -1;
  }
  /* inner mask */
  #xc-trigger::after {
    content: "";
    position: absolute; inset: 2px;
    border-radius: 50%;
    background: #08080e;
    z-index: 0;
  }
  @keyframes xc-spin { to { transform: rotate(360deg); } }

  #xc-trigger:hover { transform: scale(1.12); }
  #xc-trigger:hover::before { animation-duration: 1s; }

  #xc-trigger img, #xc-trigger .xc-fallback {
    width: 38px; height: 38px; border-radius: 50%;
    object-fit: cover; position: relative; z-index: 1;
    display: block;
  }
  #xc-trigger .xc-fallback {
    display: none;
    align-items: center; justify-content: center;
    font-size: .54rem; font-weight: 900; letter-spacing: .05em;
    background: linear-gradient(135deg,#7c4dff,#00e5ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
  }

  /* tooltip label on hover */
  #xc-tip {
    position: fixed;
    bottom: 34px; left: 84px;
    z-index: 99997;
    background: #0a0a0f;
    border: 1px solid rgba(124,77,255,.5);
    color: #e0dff8;
    font-family: 'Outfit','Segoe UI',sans-serif;
    font-size: .68rem; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase;
    padding: 6px 12px; border-radius: 8px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0; transform: translateX(-6px);
    transition: opacity .18s ease, transform .18s ease;
    box-shadow: 0 0 16px rgba(124,77,255,.35);
  }
  #xc-tip::before {
    content: "";
    position: absolute; left: -6px; top: 50%; transform: translateY(-50%);
    width: 6px; height: 6px; background: #0a0a0f;
    border-left: 1px solid rgba(124,77,255,.5);
    border-bottom: 1px solid rgba(124,77,255,.5);
    transform: translateY(-50%) rotate(45deg);
  }
  #xc-trigger:hover ~ #xc-tip { opacity: 1; transform: translateX(0); }

  /* ── Backdrop ── */
  #xc-backdrop {
    position: fixed; inset: 0;
    z-index: 99999;
    background: rgba(0,0,0,.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0; pointer-events: none;
    transition: opacity .25s ease;
    display: flex; align-items: center; justify-content: center;
  }
  #xc-backdrop.open { opacity: 1; pointer-events: all; }

  /* ── Modal ── */
  #xc-modal {
    font-family: 'Outfit','Segoe UI',sans-serif;
    --xc-bg:      #07070d;
    --xc-border:  rgba(124,77,255,.38);
    --xc-accent:  #7c4dff;
    --xc-accent2: #00e5ff;
    --xc-text:    #eceaf8;
    --xc-muted:   #706e98;
    --xc-good:    #00e5a0;
    width: min(500px, 95vw);
    max-height: 90vh;
    display: flex; flex-direction: column;
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    /* gradient border via box-shadow layering */
    box-shadow:
      0 0 0 1.5px rgba(124,77,255,.55),
      0 0 0 3px rgba(0,229,255,.12),
      0 40px 100px rgba(0,0,0,.95),
      0 0 80px rgba(124,77,255,.2),
      inset 0 1px 0 rgba(255,255,255,.06);
    transform: scale(.9) translateY(24px);
    transition: transform .3s cubic-bezier(.34,1.22,.64,1);
    background: var(--xc-bg);
  }
  #xc-backdrop.open #xc-modal { transform: scale(1) translateY(0); }

  /* noise grain overlay */
  #xc-modal::before {
    content:""; position:absolute; inset:0; pointer-events:none; z-index:0; border-radius:18px;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-size: 180px;
    opacity: .6;
  }

  /* ── Modal Header ── */
  .xc-mhead {
    position: relative; z-index: 2; flex-shrink: 0;
    padding: 0;
    overflow: hidden;
  }
  /* animated mesh gradient background */
  .xc-mhead-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 120% at 10% 50%, rgba(124,77,255,.35) 0%, transparent 60%),
      radial-gradient(ellipse 60% 100% at 90% 0%,  rgba(0,229,255,.2)   0%, transparent 60%),
      radial-gradient(ellipse 50% 80% at 50% 100%, rgba(0,229,160,.1)   0%, transparent 60%),
      #0d0d18;
    animation: xc-mesh 8s ease-in-out infinite alternate;
  }
  @keyframes xc-mesh {
    0%   { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(25deg); }
  }
  .xc-mhead-inner {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 14px;
    padding: 18px 18px 16px;
  }
  /* ring image */
  .xc-head-ring {
    width: 46px; height: 46px; border-radius: 50%;
    flex-shrink: 0; position: relative;
  }
  .xc-head-ring::before {
    content:""; position:absolute; inset:-2px; border-radius:50%;
    background: conic-gradient(from 180deg, var(--xc-accent), var(--xc-accent2), var(--xc-good), var(--xc-accent));
    animation: xc-spin 4s linear infinite;
  }
  .xc-head-ring::after { content:""; position:absolute; inset:2px; border-radius:50%; background:#0d0d18; }
  .xc-head-ring img {
    position: absolute; inset: 3px; border-radius: 50%;
    width: calc(100% - 6px); height: calc(100% - 6px);
    object-fit: cover; z-index: 1;
  }
  .xc-head-ring .xc-hfb {
    position:absolute; inset:3px; border-radius:50%; z-index:1;
    background: linear-gradient(135deg,rgba(124,77,255,.4),rgba(0,229,255,.3));
    display:flex; align-items:center; justify-content:center;
    font-size:.55rem; font-weight:900; color:var(--xc-accent2); letter-spacing:.06em;
    display:none;
  }
  .xc-head-text { flex:1; }
  .xc-head-name {
    font-size: .9rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase;
    background: linear-gradient(90deg, #fff 0%, var(--xc-accent2) 50%, var(--xc-accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: xc-shimmer 4s linear infinite;
    background-size: 200%;
  }
  @keyframes xc-shimmer { 0%{background-position:0%} 100%{background-position:200%} }
  .xc-head-sub { font-size:.62rem; color:rgba(255,255,255,.45); margin-top:3px; letter-spacing:.04em; }
  .xc-head-pills { display:flex; gap:6px; margin-top:6px; }
  .xc-head-pill {
    font-size:.55rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    padding:3px 9px; border-radius:50px;
    border:1px solid; display:flex; align-items:center; gap:4px;
  }
  .xc-head-pill.ver  { background:rgba(124,77,255,.15); border-color:rgba(124,77,255,.4); color:var(--xc-accent); }
  .xc-head-pill.live { background:rgba(0,229,160,.12);  border-color:rgba(0,229,160,.35); color:var(--xc-good); }
  .xc-head-pill.live::before { content:""; width:5px; height:5px; border-radius:50%; background:var(--xc-good); box-shadow:0 0 6px var(--xc-good); animation:xc-blink 2s infinite; }
  @keyframes xc-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  .xc-mbtn-close {
    width:30px; height:30px; border-radius:8px;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    color:rgba(255,255,255,.5); font-size:.85rem; line-height:1;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all .15s; flex-shrink:0;
  }
  .xc-mbtn-close:hover { background:rgba(255,60,60,.18); border-color:rgba(255,60,60,.4); color:#ff6060; transform:scale(1.1); }
  /* bottom border with glow */
  .xc-mhead-border {
    height:1px;
    background: linear-gradient(90deg, transparent, var(--xc-accent), var(--xc-accent2), var(--xc-good), transparent);
    opacity:.6; position:relative; z-index:2;
  }

  /* ── Tabs ── */
  .xc-mtabs {
    display:flex; flex-shrink:0;
    background: rgba(0,0,0,.35);
    border-bottom:1px solid rgba(124,77,255,.12);
    position:relative; z-index:2;
    padding: 0 4px;
    gap: 2px;
  }
  .xc-mtab {
    flex:1; padding:10px 4px;
    background:none; border:none; cursor:pointer;
    font-family:inherit; font-size:.65rem; font-weight:700;
    color:var(--xc-muted); letter-spacing:.07em; text-transform:uppercase;
    transition:color .15s; position:relative;
  }
  .xc-mtab::after {
    content:""; position:absolute; bottom:-1px; left:10%; right:10%; height:2px;
    background:linear-gradient(90deg,var(--xc-accent),var(--xc-accent2));
    border-radius:2px; transform:scaleX(0);
    transition:transform .22s cubic-bezier(.34,1.5,.64,1);
    box-shadow: 0 0 8px var(--xc-accent);
  }
  .xc-mtab.active { color:var(--xc-text); }
  .xc-mtab.active::after { transform:scaleX(1); }
  .xc-mtab:hover:not(.active) { color: rgba(224,223,248,.6); }

  /* ── Panes ── */
  .xc-mpane { display:none; position:relative; z-index:1; flex:1; min-height:0; overflow:hidden; }
  .xc-mpane.active { display:flex; flex-direction:column; }
  .xc-mscroll {
    flex:1; min-height:0; padding:12px 16px 18px;
    overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain;
    scrollbar-width:thin; scrollbar-color:var(--xc-accent) transparent;
  }


/* ── Premium Developer Contact Button ── */
.xc-dev-social-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    padding: 7px 13px;
    overflow: hidden;

    border: 1px solid rgba(124, 77, 255, .42);
    border-radius: 8px;

    background:
        linear-gradient(110deg,
            rgba(124, 77, 255, .13),
            rgba(0, 229, 255, .07));

    color: #c8bdff;
    font-family: inherit;
    font-size: .66rem;
    font-weight: 800;
    letter-spacing: .035em;

    cursor: pointer;
    transition:
        transform .2s ease,
        border-color .2s ease,
        box-shadow .2s ease,
        background .2s ease;
}

.xc-dev-social-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
        110deg,
        transparent 20%,
        rgba(255, 255, 255, .09) 50%,
        transparent 80%
    );
    transform: translateX(-120%);
    transition: transform .45s ease;
}

.xc-dev-social-btn:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 229, 255, .65);
    color: #fff;
    background: linear-gradient(
        110deg,
        rgba(124, 77, 255, .24),
        rgba(0, 229, 255, .13)
    );
    box-shadow:
        0 4px 18px rgba(124, 77, 255, .17),
        0 0 12px rgba(0, 229, 255, .08);
}

.xc-dev-social-btn:hover::before {
    transform: translateX(120%);
}

.xc-dev-social-btn:active {
    transform: translateY(0) scale(.97);
}

.xc-dev-social-btn:focus-visible {
    outline: 2px solid #00e5ff;
    outline-offset: 3px;
}

.xc-dev-social-btn .xc-social-arrow {
    display: inline-block;
    transition: transform .2s ease;
}

.xc-dev-social-btn:hover .xc-social-arrow {
    transform: translate(2px, -2px);
}

@media (prefers-reduced-motion: reduce) {
    .xc-dev-social-btn,
    .xc-dev-social-btn::before,
    .xc-dev-social-btn .xc-social-arrow {
        transition: none;
    }
}



/* ── Developer Contact Hub ── */
#xc-social-modal {
    position: fixed;
    inset: 0;
    z-index: 100001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;

    background: rgba(0, 0, 0, .68);
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .22s ease, visibility .22s ease;
}

#xc-social-modal.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

.xc-social-box {
    --social-purple: #7c4dff;
    --social-cyan: #00e5ff;
    --social-text: #eceaf8;
    --social-muted: #8986a8;

    position: relative;
    width: min(390px, 100%);
    max-height: min(78vh, 620px);
    overflow-y: auto;
    padding: 0;

    border: 1px solid rgba(124, 77, 255, .48);
    border-radius: 17px;
    background:
        radial-gradient(
            ellipse at top right,
            rgba(0, 229, 255, .08),
            transparent 55%
        ),
        radial-gradient(
            ellipse at bottom left,
            rgba(124, 77, 255, .12),
            transparent 55%
        ),
        #0b0b14;

    color: var(--social-text);
    box-shadow:
        0 0 0 1px rgba(0, 229, 255, .07),
        0 25px 80px rgba(0, 0, 0, .7),
        0 0 35px rgba(124, 77, 255, .13);

    transform: translateY(12px) scale(.97);
    transition: transform .22s ease;
}

#xc-social-modal.open .xc-social-box {
    transform: translateY(0) scale(1);
}

.xc-social-box::-webkit-scrollbar {
    width: 4px;
}

.xc-social-box::-webkit-scrollbar-thumb {
    background: linear-gradient(#7c4dff, #00e5ff);
    border-radius: 8px;
}

.xc-social-head {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 17px;
    margin: 0;

    border-bottom: 1px solid rgba(124, 77, 255, .2);
    background: rgba(11, 11, 20, .96);
    backdrop-filter: blur(12px);
}

.xc-social-heading {
    flex: 1;
    min-width: 0;
}

.xc-social-title {
    font-size: .88rem;
    font-weight: 900;
    letter-spacing: .015em;
    overflow-wrap: anywhere;
}

.xc-social-subtitle {
    margin-top: 4px;
    color: var(--social-muted);
    font-size: .65rem;
}

.xc-social-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: 39px;
    height: 39px;
    border: 1px solid rgba(0, 229, 255, .4);
    border-radius: 12px;

    background: linear-gradient(
        135deg,
        rgba(124, 77, 255, .3),
        rgba(0, 229, 255, .12)
    );

    color: #fff;
    font-size: .9rem;
    font-weight: 900;
}

.xc-social-close {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: 31px;
    height: 31px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;

    background: rgba(255, 255, 255, .04);
    color: #aaa7c3;
    font-size: 1rem;
    cursor: pointer;
    transition: .18s ease;
}

.xc-social-close:hover {
    border-color: rgba(255, 90, 110, .5);
    background: rgba(255, 60, 80, .12);
    color: #ff8290;
}

.xc-social-body {
    padding: 15px 16px 17px;
}

.xc-social-section {
    margin-bottom: 17px;
}

.xc-social-section:last-child {
    margin-bottom: 0;
}

.xc-social-section-title {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;

    color: #00d8ee;
    font-size: .59rem;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
}

.xc-social-section-title::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(
        90deg,
        rgba(0, 229, 255, .22),
        transparent
    );
}

.xc-social-link {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    margin-top: 6px;
    padding: 10px 11px;

    border: 1px solid rgba(255, 255, 255, .07);
    border-radius: 9px;
    background: rgba(255, 255, 255, .025);

    color: var(--social-text);
    text-decoration: none;
    transition:
        border-color .18s ease,
        background .18s ease,
        transform .18s ease;
}

.xc-social-link:hover {
    transform: translateX(2px);
    border-color: rgba(0, 229, 255, .35);
    background: rgba(0, 229, 255, .055);
}

.xc-social-link:focus-visible {
    outline: 2px solid #00e5ff;
    outline-offset: 2px;
}

.xc-social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 30px;
    height: 30px;

    border: 1px solid rgba(124, 77, 255, .22);
    border-radius: 8px;
    background: rgba(124, 77, 255, .1);

    color: #c7b9ff;
    font-size: .9rem;
}

.xc-social-link-copy {
    flex: 1;
    min-width: 0;
}

.xc-social-name {
    display: block;
    font-size: .72rem;
    font-weight: 800;
    overflow-wrap: anywhere;
}

.xc-social-user {
    display: block;
    margin-top: 3px;
    color: var(--social-muted);
    font-size: .62rem;
    overflow-wrap: anywhere;
}

.xc-social-external {
    color: #77748f;
    font-size: .8rem;
}

.xc-social-empty {
    margin: 0;
    padding: 10px;
    border: 1px dashed rgba(124, 77, 255, .2);
    border-radius: 8px;
    color: var(--social-muted);
    font-size: .68rem;
    line-height: 1.5;
}

.xc-social-footer {
    padding: 10px 16px;
    border-top: 1px solid rgba(124, 77, 255, .16);
    color: #77748f;
    font-size: .58rem;
    text-align: center;
}

@media (prefers-reduced-motion: reduce) {
    #xc-social-modal,
    .xc-social-box,
    .xc-social-link,
    .xc-social-close {
        transition: none;
    }
}

  /* section label */
  .xc-sec {
    font-size:.57rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase;
    color:var(--xc-accent2); margin:16px 0 8px;
    display:flex; align-items:center; gap:8px;
  }
  .xc-sec:first-child { margin-top:0; }
  .xc-sec::before { content:""; width:3px; height:10px; border-radius:2px; background:var(--xc-accent2); box-shadow:0 0 6px var(--xc-accent2); flex-shrink:0; }
  .xc-sec::after  { content:""; flex:1; height:1px; background:linear-gradient(90deg,rgba(0,229,255,.25),transparent); }

  /* ── Cards ── */
  .xc-card {
    display:flex; align-items:center; gap:12px;
    padding:10px 12px; border-radius:11px;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.07);
    margin-bottom:6px; transition:all .18s;
    position:relative; overflow:hidden;
  }
  .xc-card::before {
    content:""; position:absolute; inset:0; border-radius:11px;
    background:linear-gradient(135deg,rgba(124,77,255,.08),transparent);
    opacity:0; transition:opacity .18s;
  }
  .xc-card:last-child { margin-bottom:0; }
  .xc-card:hover { border-color:rgba(124,77,255,.35); transform:translateX(3px); }
  .xc-card:hover::before { opacity:1; }
  .xc-card-logo {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:1.05rem; overflow:hidden;
  }
  .xc-card-logo img { width:100%; height:100%; object-fit:contain; display:block; border-radius:7px; }
  .xc-card-body { flex:1; min-width:0; }
  .xc-card-name { font-size:.73rem; font-weight:700; color:var(--xc-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .xc-card-desc { font-size:.62rem; color:var(--xc-muted); margin-top:2px; line-height:1.45; }
  .xc-badge {
    font-size:.52rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    padding:2px 7px; border-radius:4px; margin-top:5px; display:inline-block;
    background:rgba(0,229,160,.1); color:var(--xc-good); border:1px solid rgba(0,229,160,.25);
  }

  /* dev card variant */
  .xc-devcard {
    display:flex; gap:13px;
    padding:12px 13px; border-radius:12px;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.07);
    margin-bottom:8px; transition:all .18s; position:relative; overflow:hidden;
  }
  .xc-devcard:hover { border-color:rgba(124,77,255,.4); background:rgba(124,77,255,.06); }
  .xc-devcard-img {
    width:40px; height:40px; border-radius:50%; flex-shrink:0;
    position:relative; overflow:hidden;
    background:rgba(124,77,255,.2);
    display:flex; align-items:center; justify-content:center;
    font-size:.7rem; font-weight:900; color:var(--xc-accent2);
  }
  .xc-devcard-img img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
  .xc-devcard-body { flex:1; min-width:0; }
  .xc-devcard-name { font-size:.77rem; font-weight:800; color:var(--xc-text); }
  .xc-devcard-role { font-size:.62rem; color:var(--xc-accent); margin-top:2px; font-weight:600; }
  .xc-devcard-desc { font-size:.61rem; color:var(--xc-muted); margin-top:5px; line-height:1.5; }

  /* ── Feature rows ── */
  .xc-feat {
    display:flex; align-items:center; gap:11px;
    padding:8px 12px; border-radius:10px;
    background:rgba(255,255,255,.028);
    border:1px solid rgba(255,255,255,.06);
    margin-bottom:5px; transition:all .15s; position:relative;
  }
  .xc-feat:last-child { margin-bottom:0; }
  .xc-feat:hover { background:rgba(124,77,255,.07); border-color:rgba(124,77,255,.2); transform:translateX(3px); }
  .xc-fdot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .xc-fdot.green  { background:var(--xc-good);   box-shadow:0 0 7px rgba(0,229,160,.7); }
  .xc-fdot.purple { background:var(--xc-accent);  box-shadow:0 0 7px rgba(124,77,255,.7); }
  .xc-fdot.cyan   { background:var(--xc-accent2); box-shadow:0 0 7px rgba(0,229,255,.7); }
  .xc-ftxt { flex:1; }
  .xc-ftitle { font-size:.7rem; font-weight:700; color:var(--xc-text); }
  .xc-fdesc  { font-size:.61rem; color:var(--xc-muted); margin-top:1px; line-height:1.4; }
  .xc-fkey {
    font-size:.57rem; font-weight:700; padding:2px 7px; border-radius:4px;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    color:var(--xc-muted); font-family:monospace; flex-shrink:0;
  }

  /* ── Footer ── */
  .xc-mfoot {
    padding:10px 16px; flex-shrink:0;
    border-top:1px solid rgba(124,77,255,.14);
    display:flex; align-items:center; justify-content:space-between;
    background:rgba(0,0,0,.4); position:relative; z-index:2;
  }
  .xc-mfoot::before {
    content:""; position:absolute; top:0; left:10%; right:10%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(124,77,255,.5),rgba(0,229,255,.4),transparent);
  }
  .xc-mfoot-sig { font-size:.61rem; color:var(--xc-muted); letter-spacing:.05em; }
  .xc-mfoot-sig strong { color:var(--xc-accent); font-weight:800; }
  .xc-mstatus { display:flex; align-items:center; gap:6px; font-size:.61rem; color:var(--xc-good); font-weight:700; letter-spacing:.05em; }
  .xc-sdot { width:7px; height:7px; border-radius:50%; background:var(--xc-good); box-shadow:0 0 8px var(--xc-good); animation:xc-blink 2s infinite; }

  /* Wellington printing portal: expanded, responsive information layout */
  #xc-backdrop { padding: 12px; }
  #xc-modal {
    width: min(650px, calc(100vw - 24px));
    max-height: min(88dvh, 760px);
    min-height: min(535px, calc(100dvh - 24px));
    border: 1px solid rgba(98, 221, 255, .19);
    background: radial-gradient(circle at top right, rgba(105,75,177,.10),transparent 46%), #0a1023;
  }
  #xc-modal .xc-mhead-inner { padding: 21px 23px 18px; }
  #xc-modal .xc-mtabs { padding: 0 12px; }
  #xc-modal .xc-mtab { padding: 13px 5px; font-size: .67rem; }
  #xc-modal .xc-mscroll { padding: 8px 22px 22px; }
  #xc-modal .xc-sec { margin: 20px 0 11px; font-size: .63rem; }
  #xc-modal .xc-card, #xc-modal .xc-feat, #xc-modal .xc-devcard {
    min-width: 0; margin-bottom: 0;
    background: rgba(22, 34, 61, .62);
    border: 1px solid rgba(135, 169, 234, .12);
    border-radius: 12px;
  }
  #xc-modal .xc-card-name, #xc-modal .xc-devcard-name {
    white-space: normal; overflow: visible; text-overflow: initial;
    font-size: .78rem; line-height: 1.35;
  }
  #xc-modal .xc-card-desc, #xc-modal .xc-devcard-desc, #xc-modal .xc-fdesc {
    font-size: .69rem; line-height: 1.55; color: #a4b4d1;
  }
  #xc-modal .xc-ftitle { font-size: .76rem; line-height: 1.4; }
  #xc-modal .xc-credit-grid, #xc-modal .xc-feature-grid, #xc-modal .xc-team-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px;
  }
  #xc-modal .xc-credit-grid .xc-card { align-items: flex-start; padding: 13px; }
  #xc-modal .xc-feature-grid .xc-feat { align-items: flex-start; padding: 13px; }
  #xc-modal .xc-team-grid .xc-devcard { align-items: flex-start; padding: 14px; }
  #xc-modal .xc-fdot { margin-top: 6px; }
  #xc-modal .xc-fkey { margin-left: 2px; }
  #xc-modal .xc-badge { margin-top: 8px; }
  #xc-modal .xc-devcard-role { color: #d2a8ff; font-size: .67rem; }
  #xc-modal .xc-dev-social-btn { width: 100%; margin-top: 10px; }
  #xc-modal .xc-mfoot { padding: 13px 22px; gap: 10px; }
  #xc-modal .xc-head-sub { font-size: .67rem; color: #a6b9d7; }
  #xc-modal .xc-head-name { font-size: .94rem; }
  #xc-modal .xc-head-pill.live { color: #7ae2fd; border-color: rgba(82,221,255,.35); background:rgba(82,221,255,.08); }
  #xc-modal .xc-head-pill.live::before { background: #52ddff; box-shadow: 0 0 6px #52ddff; }
  #xc-modal .xc-mstatus { color: #9caace; }
  #xc-modal .xc-sdot { animation:none; box-shadow:none; background: #9caace; }

  .xc-about-intro {
    display:flex; align-items:flex-start; gap:15px; padding:19px;
    background: linear-gradient(130deg, rgba(77, 210, 255, .10), rgba(208, 103, 244, .09));
    border: 1px solid rgba(115, 182, 251, .20); border-radius: 15px;
  }
  .xc-about-icon { display:grid; place-items:center; flex:0 0 44px; height:44px; font-size:24px;
    border-radius:12px; color:#a0f2ff; background:rgba(82,221,255,.13); }
  .xc-overline {font-size:.61rem; letter-spacing:.12em; text-transform:uppercase; color:#79def7; font-weight:800;}
  .xc-about-intro h3 { margin:7px 0; font-size:1.09rem; color:#f2f5ff; line-height:1.25; }
  .xc-about-intro p { margin:0; color:#b4c1d8; font-size:.73rem; line-height:1.6; }
  .xc-metrics {display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:11px 0;}
  .xc-metrics div {border:1px solid rgba(145,180,244,.12); background:rgba(255,255,255,.03); border-radius:12px; padding:12px 7px; text-align:center;}
  .xc-metrics strong {display:block; color:#8ae8ff; font-size:1.25rem; line-height:1.15; letter-spacing:-.04em;}
  .xc-metrics span {display:block; margin-top:5px; color:#98a8c6; font-size:.62rem;}
  .xc-about-grid {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px;}
  .xc-info-tile {padding:14px; border:1px solid rgba(144,180,245,.13); background:rgba(21,32,59,.68); border-radius:12px;}
  .xc-tile-icon {display:inline-grid; place-items:center; width:28px; height:28px; background:rgba(164,151,255,.15); color:#dbadff; border-radius:8px;}
  .xc-info-tile h4 {margin:9px 0 5px; color:#f1f4ff; font-size:.79rem;}
  .xc-info-tile p {color:#a4b4d1; margin:0; font-size:.68rem; line-height:1.5;}
  .xc-flow {display:flex; flex-wrap:wrap; gap:5px; align-items:center;}
  .xc-flow span {padding:7px 9px; background:rgba(74,211,252,.09); border:1px solid rgba(74,211,252,.19);
    border-radius:50px; color:#c4f3ff; font-size:.65rem; font-weight:700;}
  .xc-flow b {color:#b882e5; font-size:.8rem;}
  .xc-about-note {font-size:.67rem; line-height:1.55; color:#aebdd8; margin:10px 0 0;}
  .xc-fact-list {display:grid; gap:0; border:1px solid rgba(154,178,242,.12); border-radius:11px; overflow:hidden;}
  .xc-fact-list > div {display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding:10px 12px; background:rgba(21,32,57,.52);}
  .xc-fact-list > div + div {border-top:1px solid rgba(154,178,242,.10);}
  .xc-fact-list span {flex-shrink:0; color:#93a5c9; font-size:.66rem;}
  .xc-fact-list strong {color:#e2e9fa; font-size:.67rem; font-weight:650; text-align:right;}
  .xc-notice {padding:13px 15px; margin-top:15px; background:rgba(250,188,113,.07); border:1px solid rgba(250,188,113,.20); border-radius:12px;}
  .xc-notice strong {display:block; color:#ffdab0; font-size:.74rem;}
  .xc-notice p {margin:5px 0 0; color:#b8b9c3; font-size:.67rem; line-height:1.6;}

  @media (max-width: 520px) {
    #xc-trigger { bottom: max(16px, env(safe-area-inset-bottom)); left: max(16px, env(safe-area-inset-left)); }
    #xc-modal {width:calc(100vw - 18px); max-height:calc(100dvh - 18px); min-height:0;}
    #xc-backdrop {padding:9px;}
    #xc-modal .xc-mhead-inner {padding:15px 13px 14px; gap:10px;}
    #xc-modal .xc-head-name {font-size:.8rem;}
    #xc-modal .xc-head-sub {font-size:.57rem;}
    #xc-modal .xc-mtab {font-size:.60rem; padding:11px 3px;}
    #xc-modal .xc-mscroll {padding:8px 13px 18px;}
    #xc-modal .xc-credit-grid, #xc-modal .xc-feature-grid, #xc-modal .xc-team-grid {grid-template-columns:1fr; gap:8px;}
    .xc-about-intro {padding:15px; gap:10px;}
    .xc-about-icon {flex-basis:36px; height:36px; font-size:20px;}
    .xc-metrics {gap:5px;}
    .xc-metrics div {padding:10px 3px;}
    .xc-metrics strong {font-size:1.08rem;}
    .xc-metrics span {font-size:.54rem;}
    .xc-about-grid {grid-template-columns:1fr; gap:7px;}
    .xc-fact-list > div {display:block; padding:10px 12px;}
    .xc-fact-list strong {display:block; text-align:left; margin-top:4px;}
    #xc-modal .xc-mfoot {padding:11px 13px;}
    #xc-modal .xc-mstatus {display:none;}
  }
  @media (prefers-reduced-motion: reduce) {
    #xc-modal, #xc-modal *, #xc-modal *::before, #xc-modal *::after,
    #xc-trigger, #xc-trigger::before {animation: none !important; transition: none !important;}
  }
`;
  document.head.appendChild(style);

  /* ══════════════════════════════════════════════════════
  Section Builders - [To build each section in the overlay.]
══════════════════════════════════════════════════════ */
  function buildCredits() {
    return CONFIG.credits
      .map(
        (g) => `
    <div class="xc-sec">${g.category}</div>
    <div class="xc-credit-grid">
    ${g.items
      .map(
        (c) => `
      <div class="xc-card">
        <div class="xc-card-logo" style="background:${c.color}">
          ${c.logo ? `<img src="${c.logo}" alt="${c.name}" loading="lazy" onerror="this.parentElement.textContent='${c.emoji || '⚙️'}'"/>` : c.emoji || '⚙️'}
        </div>
        <div class="xc-card-body">
          <div class="xc-card-name">${c.name}</div>
          <div class="xc-card-desc">${c.role}</div>
          <span class="xc-badge">${c.badge}</span>
        </div>
      </div>`,
      )
      .join('')}
    </div>
  `,
      )
      .join('');
  }

  function buildFeatures() {
    return CONFIG.features
      .map(
        (g) => `
    <div class="xc-sec">${g.section}</div>
    <div class="xc-feature-grid">
    ${g.items
      .map(
        (f) => `
      <div class="xc-feat">
        <div class="xc-fdot ${g.color}"></div>
        <div class="xc-ftxt">
          <div class="xc-ftitle">${f.title}</div>
          <div class="xc-fdesc">${f.desc}</div>
        </div>
        ${f.key ? `<span class="xc-fkey">${f.key}</span>` : ''}
      </div>`,
      )
      .join('')}
    </div>
  `,
      )
      .join('');
  }

  function buildDevelopers() {
    return CONFIG.developers
      .map(
        (group) => `
        <div class="xc-sec">${group.section}</div>
        <div class="xc-team-grid">
        ${group.items
          .map(
            (d) => `
            <div class="xc-devcard">
              <div class="xc-devcard-img" style="border:2px solid ${d.color.replace('rgba', 'rgba').replace('.18', '.6')}">
                ${d.logo ? `<img src="${d.logo}" alt="${d.name}" loading="lazy" onerror="this.remove()"/>` : ''}
                ${d.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('')}
              </div>

              <div class="xc-devcard-body">
                <div class="xc-devcard-name">${d.name}</div>
                <div class="xc-devcard-role">${d.role}</div>
                <div class="xc-devcard-desc">${d.description}</div>
                <span class="xc-badge" style="margin-top:6px">${d.badge}</span>

            ${
              group.section === 'Developers' &&
              (d.socials?.length || d.emails?.length || d.email || d.websites?.length)
                ? `<button
                type="button"
                class="xc-dev-social-btn"
                data-developer="${encodeURIComponent(d.name)}"
                aria-label="View contact details for ${d.name}"
                >
                <span>Contact & Socials</span>
                <span class="xc-social-arrow" aria-hidden="true">↗</span>
                </button>`
                : ''
            }
              </div>
            </div>
          `,
          )
          .join('')}
        </div>
      `,
      )
      .join('');
  }

  function buildAbout() {
    return `
      <div class="xc-about-intro">
        <div class="xc-about-icon" aria-hidden="true">▤</div>
        <div>
          <div class="xc-overline">Capital Community Print · Wellington, NZ</div>
          <h3>Good ideas deserve great print.</h3>
          <p>A fictional community printing business moving posters, flyers and booklets from email-and-spreadsheet tracking into a shared request portal.</p>
        </div>
      </div>

      <div class="xc-metrics" aria-label="Project scope">
        <div><strong>05</strong><span>Workflows</span></div>
        <div><strong>02</strong><span>User roles</span></div>
        <div><strong>03</strong><span>Data entities</span></div>
        <div><strong>04</strong><span>Statuses</span></div>
      </div>

      <div class="xc-sec">Who uses the portal?</div>
      <div class="xc-about-grid">
        <section class="xc-info-tile">
          <span class="xc-tile-icon" aria-hidden="true">◉</span>
          <h4>Customer</h4>
          <p>Submit a print request and see only their own requests and history.</p>
        </section>
        <section class="xc-info-tile">
          <span class="xc-tile-icon" aria-hidden="true">⚙</span>
          <h4>Coordinator</h4>
          <p>See every request, assign staff, advance progress and review exceptions.</p>
        </section>
      </div>

      <div class="xc-sec">The production journey</div>
      <div class="xc-flow" aria-label="Four sequential request statuses">
        <span>Submitted</span><b aria-hidden="true">›</b>
        <span>Assigned</span><b aria-hidden="true">›</b>
        <span>In Progress</span><b aria-hidden="true">›</b>
        <span>Completed</span>
      </div>
      <p class="xc-about-note">Rejection and archiving are separate audited decisions, not extra production statuses. Completed records remain viewable.</p>

      <div class="xc-sec">Project and scope</div>
      <div class="xc-fact-list">
        <div><span>Assessment</span><strong>BACT7602 · Assessment 2 · T1 Web App Modernisation</strong></div>
        <div><span>Print formats</span><strong>Posters · Flyers · Booklets</strong></div>
        <div><span>Priorities</span><strong>Low · Normal · High</strong></div>
        <div><span>Data model</span><strong>User · PrintRequest · StatusHistory</strong></div>
      </div>
      <div class="xc-notice">
        <strong>Academic demonstration</strong>
        <p>All accounts and records are synthetic. Payments, artwork uploads, quotations, stock and printer integration are out of scope. The current Cloudflare demo is not proof of NZ-only data residency or completed Azure managed-identity deployment.</p>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
  Inject DOM - [To inject the overlay trigger, backdrop and 
  modal elements into the page.]
══════════════════════════════════════════════════════ */
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.setAttribute('aria-label', 'Open site information and credits');
  trigger.id = 'xc-trigger';
  const tip = document.createElement('div');
  tip.id = 'xc-tip';
  tip.textContent = 'Portal guide & credits';
  trigger.innerHTML = `<img src="${CONFIG.badge.image}" alt="XyberCore" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><span class="xc-fallback">XC</span>`;
  document.body.appendChild(trigger);
  document.body.appendChild(tip);

  const backdrop = document.createElement('div');
  backdrop.id = 'xc-backdrop';
  backdrop.innerHTML = `
  <div id="xc-modal" role="dialog" aria-modal="true" aria-label="Portal information and credits">
    <div class="xc-mhead">
      <div class="xc-mhead-bg"></div>
      <div class="xc-mhead-inner">
        <div class="xc-head-ring">
          <img src="${CONFIG.badge.image}" alt="XyberCore" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
          <div class="xc-hfb">XC</div>
        </div>
        <div class="xc-head-text">
          <div class="xc-head-name">${CONFIG.badge.label}</div>
          <div class="xc-head-sub">Wellington Community Printing Portal · Team project</div>
          <div class="xc-head-pills">
            <span class="xc-head-pill ver">${CONFIG.badge.version}</span>
            <span class="xc-head-pill live">Student demo</span>
          </div>
        </div>
        <button type="button" class="xc-mbtn-close" id="xc-close" aria-label="Close portal information">✕</button>
      </div>
      <div class="xc-mhead-border"></div>
    </div>

    <div class="xc-mtabs" role="tablist" aria-label="Portal information sections">
      <button type="button" role="tab" aria-selected="true" aria-controls="xc-pane-features" id="xc-tab-features" class="xc-mtab active" data-tab="features">Features</button>
      <button type="button" role="tab" aria-selected="false" aria-controls="xc-pane-credits" id="xc-tab-credits" class="xc-mtab" data-tab="credits">Credits</button>
      <button type="button" role="tab" aria-selected="false" aria-controls="xc-pane-developers" id="xc-tab-developers" class="xc-mtab" data-tab="developers">Team</button>
      <button type="button" role="tab" aria-selected="false" aria-controls="xc-pane-about" id="xc-tab-about" class="xc-mtab" data-tab="about">About</button>
     
    </div>

    <div class="xc-mpane active" id="xc-pane-features" role="tabpanel" aria-labelledby="xc-tab-features"><div class="xc-mscroll">${buildFeatures()}</div></div>
    <div class="xc-mpane"        id="xc-pane-credits" role="tabpanel" aria-labelledby="xc-tab-credits"><div class="xc-mscroll">${buildCredits()}</div></div>
    <div class="xc-mpane"        id="xc-pane-developers" role="tabpanel" aria-labelledby="xc-tab-developers"><div class="xc-mscroll">${buildDevelopers()}</div></div>
    <div class="xc-mpane"        id="xc-pane-about" role="tabpanel" aria-labelledby="xc-tab-about"><div class="xc-mscroll">${buildAbout()}</div></div>
    
    <div class="xc-mfoot">
      <span class="xc-mfoot-sig">A <strong>BACT7602 student team</strong> project</span>
      <div class="xc-mstatus"><div class="xc-sdot"></div>Synthetic data</div>
    </div>
  </div>`;
  document.body.appendChild(backdrop);

  // ── Developer socials modal ──
  const socialModal = document.createElement('div');
  socialModal.id = 'xc-social-modal';

  socialModal.innerHTML = `
  <div class="xc-social-box"
       role="dialog"
       aria-modal="true"
       aria-labelledby="xc-social-title"
       aria-describedby="xc-social-subtitle">

    <div class="xc-social-head">
      <div class="xc-social-avatar" id="xc-social-avatar"
           aria-hidden="true">XC</div>

      <div class="xc-social-heading">
        <div class="xc-social-title" id="xc-social-title">
          Developer Contact Hub
        </div>
        <div class="xc-social-subtitle" id="xc-social-subtitle">
          Contact details and online profiles
        </div>
      </div>

      <button type="button"
              class="xc-social-close"
              aria-label="Close contact modal">✕</button>
    </div>

    <div class="xc-social-body" id="xc-social-content"></div>

    <div class="xc-social-footer">
      XYBER CORE · DEVELOPER DIRECTORY
    </div>
  </div>
`;

  document.body.appendChild(socialModal);

  const socialTitle = socialModal.querySelector('#xc-social-title');
  const socialSubtitle = socialModal.querySelector('#xc-social-subtitle');
  const socialAvatar = socialModal.querySelector('#xc-social-avatar');
  const socialContent = socialModal.querySelector('#xc-social-content');

  let previouslyFocusedElement = null;

  function closeSocialModal() {
    socialModal.classList.remove('open');

    if (previouslyFocusedElement?.isConnected) {
      previouslyFocusedElement.focus();
    }
  }

  socialModal.querySelector('.xc-social-close').addEventListener('click', closeSocialModal);

  socialModal.addEventListener('click', (event) => {
    if (event.target === socialModal) {
      closeSocialModal();
    }
  });

  function createSocialSection(title, icon, entries) {
    if (!entries.length) return null;

    const section = document.createElement('section');
    section.className = 'xc-social-section';

    const heading = document.createElement('div');
    heading.className = 'xc-social-section-title';
    heading.textContent = `${icon}  ${title}`;
    section.appendChild(heading);

    entries.forEach((entry) => {
      let safeUrl;

      try {
        safeUrl = new URL(entry.url);
      } catch {
        return;
      }

      if (!['https:', 'http:', 'mailto:'].includes(safeUrl.protocol)) {
        return;
      }

      const link = document.createElement('a');
      link.className = 'xc-social-link';
      link.href = safeUrl.href;

      if (safeUrl.protocol === 'https:') {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      const symbol = document.createElement('span');
      symbol.className = 'xc-social-icon';
      symbol.setAttribute('aria-hidden', 'true');
      symbol.textContent = entry.icon || '↗';

      const copy = document.createElement('span');
      copy.className = 'xc-social-link-copy';

      const name = document.createElement('span');
      name.className = 'xc-social-name';
      name.textContent = entry.name || 'Website';

      const username = document.createElement('span');
      username.className = 'xc-social-user';
      username.textContent = entry.username || entry.url;

      const arrow = document.createElement('span');
      arrow.className = 'xc-social-external';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';

      copy.append(name, username);
      link.append(symbol, copy, arrow);
      section.appendChild(link);
    });

    // Don't display a heading if all supplied links were invalid.
    if (!section.querySelector('.xc-social-link')) {
      return null;
    }

    return section;
  }

  backdrop.addEventListener('click', (event) => {
    const button = event.target.closest('.xc-dev-social-btn');
    if (!button || !backdrop.contains(button)) return;

    let developerName;

    try {
      developerName = decodeURIComponent(button.dataset.developer || '');
    } catch {
      return;
    }

    const developer = CONFIG.developers
      .filter((group) => group.section === 'Developers')
      .flatMap((group) => group.items)
      .find((person) => person.name === developerName);

    if (!developer) return;

    previouslyFocusedElement = button;

    socialTitle.textContent = developer.name;
    socialSubtitle.textContent = 'Contact details and online profiles';
    socialAvatar.textContent = developer.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    socialContent.replaceChildren();

    // Support either a single email address or multiple email entries.
    const emailEntries = (Array.isArray(developer.emails) ? developer.emails : developer.email ? [{ address: developer.email }] : [])
      .map((email) => {
        const address = typeof email === 'string' ? email : email.address;

        if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
          return null;
        }

        return {
          name: typeof email === 'object' && email.label ? email.label : 'Email',
          username: address,
          url: `mailto:${address}`,
          icon: '@',
        };
      })
      .filter(Boolean);

    // Websites/domains can be supplied as full URLs or domain names.
    const websiteEntries = (developer.websites || [])
      .map((website) => {
        const rawUrl = typeof website === 'string' ? website : website.url;

        if (!rawUrl) return null;

        let url = rawUrl.trim();

        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }

        return {
          name: typeof website === 'object' && website.name ? website.name : 'Website',
          username: typeof website === 'object' && website.domain ? website.domain : rawUrl,
          url,
          icon: '⌘',
        };
      })
      .filter(Boolean);

    // Preserve your existing socials configuration.
    const socialEntries = (developer.socials || []).map((social) => ({
      name: social.name || 'Social profile',
      username: social.username || '',
      url: social.url,
      icon: social.icon || '↗',
    }));

    const sections = [createSocialSection('Email', '@', emailEntries), createSocialSection('Websites & Domains', '⌘', websiteEntries), createSocialSection('Social Media', '↗', socialEntries)].filter(Boolean);

    if (sections.length) {
      socialContent.append(...sections);
    } else {
      const empty = document.createElement('p');
      empty.className = 'xc-social-empty';
      empty.textContent = 'No contact details have been added for this developer yet.';
      socialContent.appendChild(empty);
    }

    socialModal.classList.add('open');

    socialModal.querySelector('.xc-social-close').focus();
  });

  // Close the contact modal with Escape.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && socialModal.classList.contains('open')) {
      closeSocialModal();
    }
  });

  let isOpen = false;
  let previousOverflow = '';
  const open = () => {
    previousOverflow = document.body.style.overflow;
    isOpen = true;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    backdrop.querySelector('#xc-close')?.focus();
  };
  const close = () => {
    isOpen = false;
    backdrop.classList.remove('open');
    document.body.style.overflow = previousOverflow;
    trigger.focus();
  };

  trigger.addEventListener('click', () => (isOpen ? close() : open()));
  document.getElementById('xc-close').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', (e) => {
    // Escape should dismiss the nested contact dialog before dismissing the credits overlay.
    if (e.key === 'Escape' && isOpen && !socialModal.classList.contains('open')) close();
  });

  const tabs = [...backdrop.querySelectorAll('.xc-mtab')];
  function activateTab(tab, moveFocus = false) {
    const targetPane = `xc-pane-${tab.dataset.tab}`;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    backdrop.querySelectorAll('.xc-mpane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === targetPane);
    });
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });
}
