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
    'a11y.theme': 'Dark mode',

    /* ---------------------------------------------------------- navigation */
    'nav.work': 'Work',
    'nav.games': 'Games',
    'nav.skills': 'Skills',
    'nav.contact': 'Contact',
    'nav.cta': "Let's talk",

    /* --------------------------------------------------------------- hero */
    'hero.badge': 'Open to analytics, data, AI and engineering roles — Bogotá and remote',
    'hero.role': 'Data Governance Engineer · Data Scientist · AI Engineer',
    'hero.title1': 'Trustworthy data at',
    'hero.title2': 'enterprise scale',
    'hero.title3': 'and AI that puts it to work.',
    'hero.lede': "I'm Oscar Ordoñez, a Computer Science graduate of Universidad Nacional de Colombia. Today I govern the data lifecycle at Claro Colombia; before that I built BBVA's acquiring-unit profitability model on AWS and an end-to-end AI agent at Softgic. Off the clock I publish games that run in the browser.",
    'hero.cta1': 'See my experience',
    'hero.cta2': 'Download CV (PDF)',
    'hero.cta3': 'github.com/OdobGames',

    'fact.1.n': 'Claro · BBVA',
    'fact.1.t': 'Data governance in telco, profitability and BI in banking',
    'fact.2.n': 'Databricks · AWS',
    'fact.2.t': 'Unity Catalog, Delta Lake, SageMaker, Athena, PySpark',
    'fact.3.n': 'UNAL · 2025',
    'fact.3.t': 'B.S. Computer Science, Universidad Nacional de Colombia',
    'fact.4.n': 'English C1',
    'fact.4.t': 'Bogotá, UTC−5: the same working day as the US east coast',
    'hero.card.title': 'At a glance',
    'hero.card.cta': 'See the games I publish',

    /* ----------------------------------------------------- flagship work */
    'work.eyebrow': 'Selected work',
    'work.title': 'Four complete games, online and playable',
    'work.intro': 'Outside the data work I build real-time systems. All four run in the browser with nothing to install: not course exercises, but complete systems I designed end to end.',
    'work.challenges': 'Engineering challenges',
    'work.webcraft.alt': 'WebCraft screenshot: the client main menu in the browser',
    'work.carritos.alt': 'Carritos screenshot: the kart game main menu',
    'work.papel.alt': 'Frente de Papel screenshot: a cut-paper arena',
    'work.backrooms.alt': 'Backrooms Wanderer screenshot: a yellow corridor in first person',
    'work.live': 'Live',
    'work.live2': 'Live',
    'work.live3': 'Live',
    'work.live4': 'Live',

    'work.webcraft.scope': 'Built end to end, on my own',
    'work.carritos.scope': 'Built end to end, on my own',
    'work.papel.scope': 'Built end to end, on my own',
    'work.backrooms.scope': 'Built end to end, on my own',
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

    'work.papel.hook': 'A multiplayer first-person shooter where the entire world is cut out of paper.',
    'work.papel.body': 'Online matches inside a browser tab. The level, the cover and the players all have a cut-cardboard finish, and that is not only an art decision: a world made of flat shapes is a world that loads in seconds and runs on any laptop.',
    'work.papel.c1t': 'First person, at eye level',
    'work.papel.c1b': 'A first-person camera forgives nothing: the pointer is locked, the view has to answer in the same frame the mouse moves, and any hitch is felt immediately.',
    'work.papel.c2t': 'A shot always happens in the past',
    'work.papel.c2b': "Every player sees the world delayed by their own connection. For a hit to be fair you have to rebuild where everything was at the instant the trigger was pulled, not where it is when the packet lands.",
    'work.papel.c3t': 'Moving everyone, many times a second',
    'work.papel.c3b': 'Each player\u2019s position, orientation and state travel constantly. You have to cut down what goes on the wire and interpolate what never arrives, so other people move smoothly instead of in jumps.',
    'work.papel.c4t': 'Making the paper hold up',
    'work.papel.c4b': 'The cardboard finish is built from geometry, silhouettes and flat light rather than heavy textures: here the art direction is also the performance budget.',
    'work.papel.cta': 'Play Frente de Papel',

    'work.backrooms.hook': 'A first-person survival roguelike through yellow corridors that never end.',
    'work.backrooms.body': 'Levels generate themselves and are never the same twice. You enter through a browser tab, go as far as your resources hold out, and when the run ends the next attempt starts somewhere nobody has seen before.',
    'work.backrooms.c1t': 'A space that never ends',
    'work.backrooms.c1b': 'Procedural generation has to produce places you can actually walk through: no sealed rooms, no routes that lead nowhere. Chance decides the shape, but something has to guarantee a path always exists.',
    'work.backrooms.c2t': 'An endless level does not fit in memory',
    'work.backrooms.c2b': 'If the world never ends, it cannot exist all at once. It has to be built and torn down around the player as they walk, and the seam can never show.',
    'work.backrooms.c3t': 'Fear is built out of very little',
    'work.backrooms.c3b': 'The tension comes from light, sound and pacing, not from detail. In a place where everything looks like everything else, the hard part is that the player never knows whether they have already been here.',
    'work.backrooms.c4t': 'A run you can lose',
    'work.backrooms.c4b': 'A roguelike needs consequences: resources that run out, a death that costs something, and a different world when you start again. Without those, walking corridors is just walking corridors.',
    'work.backrooms.cta': 'Enter Backrooms Wanderer',

    'midcta.text': 'Want to see everything I have published, including my Google Play apps?',
    'midcta.cta': 'Open the games hub',
    'hub.eyebrow': 'Projects hub',
    'hub.fallback': 'Direct links:',
    'hub.title': 'Games and apps I have published',
    'hub.intro': 'Everything playable runs in the browser with nothing to install. Android apps are on Google Play, and whatever is still being built shows up as coming soon.',
    'hub.back': 'Back to the portfolio',
    'hub.legal': 'Minecraft is a registered trademark of Mojang Studios and Mario Kart of Nintendo. No project on this page is affiliated with or endorsed by those companies.',

    /* ------------------------------------------------------------- more */






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

    'exp.4t': 'Intern · Profitability',
    'exp.4w': 'BBVA Colombia · Client Solutions · Bogotá',
    'exp.4b': 'Professional internship in the profitability area. I automated the team\u2019s recurring operational tasks, replacing procedures that until then were carried out by hand with automated routines, and supported the retail banking operation within the unit.',

    'exp.5t': 'Software, AI and game developer',
    'exp.5w': 'OdobGames · own studio',
    'exp.5b': 'Mobile development in Unity (C#) and prototyping in Unreal Engine (UEFN), owning the full cycle through to store publication. Internal automation with n8n and API integration, plus data-driven work to improve the studio\u2019s products.',

    'exp.6t': 'B.S. Computer Science',
    'exp.6w': 'Universidad Nacional de Colombia · Bogotá',
    'exp.6b': 'Algorithms, artificial intelligence, machine learning, cryptography and databases. It is the foundation under both the data work and the projects below.',

    'exp.cv': 'Would you rather have the full document?',
    'exp.cvlink': 'Download the CV as PDF',

    /* The three download buttons follow the language through this one key:
       the <a> tags carry data-i18n-attr="href:cv.file", so switching to EN
       rewrites their href and switching back restores the Spanish original. */
    'cv.file': 'assets/cv/CV-Oscar-Ordonez-EN.pdf',

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
    'contact.linkedin': 'LinkedIn',
    'contact.copied': 'Copied!',
    'contact.note': 'LinkedIn and GitHub work too. I reply to everything that comes in.',


    /* -------------------------------------------------------- tech tags */
    'tag.autoproc': "Process automation",
    'tag.binary': "Binary protocols",
    'tag.cfpages': "Cloudflare Pages",
    'tag.fpv': "First-person",
    'tag.lagcomp': "Lag compensation",
    'tag.procgen': "Procedural generation",
    'tag.retail': "Retail banking",
    'tag.roguelike': "Roguelike design",
    'tag.web3d': "3D in the browser",
    'tag.js': "JavaScript",
    'tag.mcproto': "Minecraft Java protocol",
    'tag.ml': "Machine learning",
    'tag.netprog': "Network programming",
    'tag.opsupport': "Operations support",
    'tag.physics': "Game physics",
    'tag.rtmp': "Real-time multiplayer",
    'tag.statesync': "State synchronization",
    'tag.voxelgfx': "Voxel graphics",
    'tag.voxelrender': "Voxel rendering",

    /* ----------------------------------------------------------- footer */
    'footer.left': '© 2026 Oscar Ordoñez — Colombia · Hand-written static site, no framework',
    'footer.source': 'Source of this site',
    'footer.mail': 'Email',
    'footer.legal': 'Minecraft is a trademark of Mojang Studios and Mario Kart of Nintendo. The projects on this page are not affiliated with or endorsed by either company. · Last updated: October 2026.',
    'footer.games': 'Games and projects',
  }
};
