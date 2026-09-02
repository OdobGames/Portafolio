/*
 * i18n.js — English strings, keyed to the data-i18n attributes in index.html.
 *
 * Spanish is not stored here: it already lives in the markup, which keeps the
 * page meaningful without JavaScript and gives crawlers real content. main.js
 * captures those strings on load and restores them when the visitor switches
 * back to ES.
 */
window.I18N = {
  en: {
    /* ------------------------------------------------------ accessibility */
    'a11y.skip': 'Skip to content',
    'a11y.home': 'Oscar Ordoñez — home',
    'a11y.lang': 'Site language',
    'a11y.menu': 'Open menu',
    'a11y.footer': 'Footer links',
    'a11y.top': 'Back to top',
    'a11y.motion': 'Pause the animations',

    /* ---------------------------------------------------------- navigation */
    'nav.work': 'Work',
    'nav.more': 'Other work',
    'nav.skills': 'Skills',
    'nav.contact': 'Contact',
    'nav.cta': "Let's talk",

    /* --------------------------------------------------------------- hero */
    'hero.badge': 'Open to analytics, data, AI and engineering roles — Bogotá and remote',
    'hero.kicker': 'Data governance · Data science · AI engineering',
    'hero.title1': 'I govern data at',
    'hero.title2': 'enterprise scale',
    'hero.title3': 'and build what runs on top of it.',
    'hero.lede': "I'm Oscar Ordoñez, a Computer Science graduate of Universidad Nacional de Colombia. Today I govern the data lifecycle across Claro Colombia's ecosystem; before that I built BBVA's acquiring-unit profitability model on AWS and an end-to-end AI agent at Softgic. Off the clock I write voxel engines and network protocols that run inside a browser tab.",
    'hero.cta1': 'See my experience',
    'hero.cta2': 'Download CV (PDF)',
    'hero.cta3': 'github.com/OdobGames',
    'hero.scroll': 'Start with the experience',

    'fact.1.n': 'Claro · BBVA',
    'fact.1.t': 'Data governance in telco, profitability and BI in banking',
    'fact.2.n': 'Databricks · AWS',
    'fact.2.t': 'Unity Catalog, Delta Lake, SageMaker, Athena, PySpark',
    'fact.3.n': 'UNAL · 2025',
    'fact.3.t': 'B.S. Computer Science, Universidad Nacional de Colombia',
    'fact.4.n': 'English C1',
    'fact.4.t': 'Bogotá, UTC−5: the same working day as the US east coast',

    /* ----------------------------------------------------- flagship work */
    'work.eyebrow': 'Selected work',
    'work.title': 'Two hard things, both live and playable',
    'work.intro': 'Outside the data work I build real-time systems. Both of these run in the browser with nothing to install and open right now: not course exercises, but complete systems I had to design end to end.',
    'work.live': 'Live',
    'work.live2': 'Live',

    'work.webcraft.scope': 'Built end to end, on my own',
    'work.carritos.scope': 'Built end to end, on my own',
    'work.webcraft.hook': 'A Minecraft client that runs in the browser and connects to Java Edition servers.',
    'work.webcraft.body': "My own implementation — not a port and not a wrapper around an existing client. Open a tab, connect to a real Minecraft Java server, and the world appears: no installer, no launcher, no Java runtime.",
    'work.webcraft.c1t': 'Speaking the protocol, byte by byte',
    'work.webcraft.c1b': 'A Java Edition server expects its own binary format: handshake, connection states, compression, and hundreds of packets that have to be serialized exactly the way it asks for them.',
    'work.webcraft.c2t': 'A voxel world, frame by frame',
    'work.webcraft.c2b': 'Chunks arrive compressed. They have to be decoded, turned into geometry and drawn without blocking the thread that keeps the interface alive.',
    'work.webcraft.c3t': 'Networking from inside a sandbox',
    'work.webcraft.c3b': 'Browsers do not open raw TCP sockets. Reaching a server designed for desktop clients means solving transport without breaking the semantics of the protocol.',
    'work.webcraft.c4t': 'State that cannot drift',
    'work.webcraft.c4b': 'Entities, blocks and inventory change on every server tick. The client has to reflect that truth and recover when it falls out of sync.',
    'work.webcraft.cta': 'Open WebCraft',
    'work.webcraft.canvas': 'Animation of a voxel island loading column by column, evoking chunks arriving from a server',
    'work.webcraft.note': 'Rendered on this page by a small isometric engine I wrote: a world streaming in chunk by chunk. It is not a screenshot of WebCraft — open the link to see the real thing.',

    'work.carritos.hook': 'A voxel kart racer with online multiplayer, in the spirit of Mario Kart.',
    'work.carritos.body': 'Real-time races against other people, inside a browser tab. Everyone sees the same race even though each player is on a different connection.',
    'work.carritos.c1t': 'Everyone in the same race',
    'work.carritos.c1b': 'Several players share one world that has to agree frame by frame, even when packets arrive late or out of order.',
    'work.carritos.c2t': 'Latency you can feel through the wheel',
    'work.carritos.c2b': 'Controls that respond demand prediction on the client and correction when the authoritative version lands — without the correction feeling like a yank.',
    'work.carritos.c3t': 'Physics that feels good',
    'work.carritos.c3b': 'Drift, acceleration and collisions have to feel good and look the same to everyone at once, and those two goals pull in opposite directions.',
    'work.carritos.c4t': 'Rooms and the shape of a match',
    'work.carritos.c4b': 'Join, start, finish, go again. Someone has to decide who gets in, who dropped, and what happens to the race when a player disconnects.',
    'work.carritos.cta': 'Play Carritos',
    'work.carritos.canvas': 'Animation of voxel karts running a lap around an isometric circuit',
    'work.carritos.note': 'An animated scene drawn on this page by the same isometric engine. It is not a screenshot of Carritos — the real game is one click away.',

    'midcta.text': 'Curious how either one is put together? Write to me and I will walk you through it.',
    'midcta.cta': "Let's talk",

    /* ------------------------------------------------------------- more */
    'more.eyebrow': 'Other work',
    'more.title': 'Production, shipped games, and the fundamentals',
    'more.intro': 'Writing an engine is one thing. Keeping something alive months later, on a machine nobody is watching, is another.',

    'more.dian.kind': 'Python · Automation · Ops',
    'more.dian.body': "Watches Colombia's DIAN appointment page with headless Chromium and emails an alert the moment a slot opens. It runs in three different places — a PC, GitHub Actions, or a systemd-managed VM — keeps its credentials out of the source in environment variables, installs under its own system user, and cleans up after itself so it can stay switched on for months.",
    'more.dian.link': 'View the repository',

    'more.play.kind': 'Unity · C# · Google Play',
    'more.play.title': 'OdobGames on Google Play',
    'more.play.body': 'The studio I shipped three games under: Heart Tale, an endless Undertale-style battle; Mordecai Infinite Runner, with online scoreboards; and 3D Cube Parkour, a voxel parkour game with global rankings. Every title has a public listing on the store.',
    'more.play.storesLabel': 'Games on Google Play',
    'more.play.link': 'Visit the studio',

    'more.retro.kind': 'Web · Front-end',
    'more.retro.body': 'A site for playing retro classics for free, published on GitHub Pages. An exercise in making something load fast, explain itself, and work on any screen.',
    'more.retro.link': 'Open the arcade',

    'more.tank.kind': 'Game · Gameplay',
    'more.tank.body': 'A survival tank game. From the stretch where I was learning to separate the game loop from everything else — and it shows in what came after.',
    'more.tank.link': 'View the repository',

    'more.cs.kind': 'UNAL · Computer Science',
    'more.cs.title': 'Fundamentals: AI, crypto and data',
    'more.cs.body': 'The undergraduate repositories: artificial intelligence projects, digit recognition with machine learning, cryptography, and databases. This is the theory underneath everything else on this page.',
    'more.cs.link': 'Browse the repositories',

    /* ----------------------------------------------------------- skills */
    'skills.eyebrow': 'Skills',
    'skills.title': 'The toolkit, by area',
    'skills.intro': 'Every group points back at something above: a job where I used it, or a project that proves it. If I have not used it on something real, it is not on the list.',
    'skills.g1t': 'Data governance',
    'skills.g1b': 'The data lifecycle inside a large ecosystem: catalogue, quality, metadata, lineage, and the policies that keep all of it standing.',
    'skills.g2t': 'Cloud and big data',
    'skills.g2b': 'Distributed processing and analytical storage over volumes that do not fit on one machine.',
    'skills.g3t': 'Data science and AI',
    'skills.g3b': 'Models that carry business decisions, and LLMs put to work on concrete tasks rather than demos.',
    'skills.g4t': 'SQL, ETL and modelling',
    'skills.g4b': 'The part almost nobody sees and everything else depends on: moving the data, cleaning it, and leaving it queryable.',
    'skills.g5t': 'Business intelligence',
    'skills.g5b': 'Dashboards someone actually decides on, showing the KPIs that matter rather than the ones that are easy to plot.',
    'skills.g6t': 'Software and real-time engineering',
    'skills.g6b': 'The other side: voxel engines, binary protocols and published games. The renderer on this page is mine, written without libraries.',



    /* -------------------------------------------------------- experience */
    'nav.exp': 'Experience',
    'exp.eyebrow': 'Professional experience',
    'exp.title': 'Data, AI and decisions inside large operations',
    'exp.intro': 'Telco, banking and AI consulting. Underneath, all three were the same job: make data that is large, messy and scattered good enough to decide on.',
    'exp.now': 'now',
    'exp.now2': 'now',

    'exp.1t': 'Data Governance Engineer',
    'exp.1w': 'Grupo CINTE — on assignment at Claro Colombia · Bogotá',
    'exp.1b': 'Governance across the data lifecycle on a multi-platform <i>data warehouse</i>: traceability, quality and standardisation of information assets. I build the Python tooling that audits how the data inventory is used and finds redundant objects, and apply LLMs with statistical sampling to catalogue, classify and enrich metadata at scale. I defined the usage, access and incident policies for the analytical environments on Databricks.',

    'exp.2t': 'Artificial Intelligence Developer (contract)',
    'exp.2w': 'Softgic · Colombia',
    'exp.2b': 'Built an end-to-end AI agent, wiring LLMs into automation flows to solve real business cases. Designed and orchestrated the n8n workflows connecting APIs, data sources and AI services, with heavy SQL behind the agent\u2019s behaviour.',

    'exp.3t': 'Data Analyst Specialist · Business Intelligence',
    'exp.3w': 'BBVA Colombia · Client Solutions · Bogotá',
    'exp.3b': 'Designed and implemented the acquiring unit\u2019s profitability (P&amp;L) model on AWS — SageMaker, Athena, S3 — over large volumes of transactional data. Built the ETL/ELT <i>pipelines</i> in PySpark and advanced SQL, the KPI dashboards in MicroStrategy and Apps Script, and predictive models in Python supporting financial and commercial decisions.',

    'exp.4t': 'Software, AI and game developer',
    'exp.4w': 'OdobGames · own studio',
    'exp.4b': 'Mobile development in Unity (C#) and prototyping in Unreal Engine (UEFN), owning the full cycle through to store publication. Internal automation with n8n and API integration, plus data-driven work to improve the studio\u2019s products.',

    'exp.5t': 'B.S. Computer Science',
    'exp.5w': 'Universidad Nacional de Colombia · Bogotá',
    'exp.5b': 'Algorithms, artificial intelligence, machine learning, cryptography and databases. It is the foundation under both the data work and the projects below.',

    'exp.cv': 'Would you rather have the full document?',
    'exp.cvlink': 'Download the CV as PDF',

    /* -------------------------------------------------------- data tags */
    'tag.dg': 'Data Governance',
    'tag.catalog': 'Data Catalog',
    'tag.dq': 'Data Quality',
    'tag.meta': 'Metadata Management',
    'tag.lineage': 'Data Lineage',
    'tag.dwh': 'Data Warehouse',
    'tag.predictive': 'Predictive modelling',
    'tag.prompt': 'Prompt engineering',
    'tag.agents': 'AI agents',
    'tag.sqladv': 'Advanced SQL',
    'tag.datamodel': 'Data modelling',
    'tag.queryopt': 'Query optimisation',
    'tag.distributed': 'Distributed processing',
    'tag.dataviz': 'Data visualisation',
    'tag.dash': 'Executive dashboards',

    /* ---------------------------------------------------------- contact */
    'contact.eyebrow': 'Contact',
    'contact.title': 'Looking for someone who understands the data and can build?',
    'contact.body': 'I am open to data analyst, data engineering, data governance, data science and AI engineering roles — and to software engineering. In Bogotá, hybrid or remote. English C1, working day in UTC−5.',
    'contact.cv': 'Download CV',
    'contact.mail': 'Send me an email',
    'contact.github': 'github.com/OdobGames',
    'contact.copied': 'Copied!',
    'contact.note': 'GitHub works too. I reply to everything that comes in.',


    /* -------------------------------------------------------- tech tags */
    'tag.binary': "Binary protocols",
    'tag.cfpages': "Cloudflare Pages",
    'tag.js': "JavaScript",
    'tag.mcproto': "Minecraft Java protocol",
    'tag.ml': "Machine learning",
    'tag.netprog': "Network programming",
    'tag.physics': "Game physics",
    'tag.rtmp': "Real-time multiplayer",
    'tag.statesync': "State synchronization",
    'tag.voxelgfx': "Voxel graphics",
    'tag.voxelrender': "Voxel rendering",

    /* ----------------------------------------------------------- footer */
    'footer.left': '© 2026 Oscar Ordoñez — Colombia · Hand-written static site, no framework',
    'footer.source': 'Source of this site',
    'footer.mail': 'Email',
    'footer.legal': 'Minecraft is a trademark of Mojang Studios and Mario Kart of Nintendo. The projects on this page are not affiliated with or endorsed by either company. · Last updated: September 2026.'
  }
};
