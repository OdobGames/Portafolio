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
    'nav.path': 'Path',
    'nav.contact': 'Contact',
    'nav.cta': "Let's talk",

    /* --------------------------------------------------------------- hero */
    'hero.badge': 'Open to software engineering roles — Colombia and remote',
    'hero.kicker': 'Software engineering · Computer Science',
    'hero.title1': 'I build',
    'hero.title2': 'real-time systems',
    'hero.title3': 'that run inside a browser tab.',
    'hero.lede': "I'm Oscar Ordoñez, a Computer Science student at Universidad Nacional de Colombia and the founder of OdobGames. My work sits where graphics, networking and systems meet: a Minecraft client that runs in the browser, a voxel kart racer with online multiplayer, and automation built to run for months without anyone touching it.",
    'hero.cta1': 'See the work',
    'hero.cta2': 'Try WebCraft now',
    'hero.cta3': 'github.com/OdobGames',
    'hero.scroll': 'Start with the work',

    'fact.1.n': '2 live projects',
    'fact.1.t': 'Playable 3D applications you can open right now',
    'fact.2.n': '3 published games',
    'fact.2.t': 'On Google Play, under the OdobGames label',
    'fact.3.n': 'UNAL',
    'fact.3.t': 'Computer Science, Universidad Nacional de Colombia',
    'fact.4.n': 'Colombia',
    'fact.4.t': 'UTC−5: the same working day as the US east coast',

    /* ----------------------------------------------------- flagship work */
    'work.eyebrow': 'Selected work',
    'work.title': 'Two hard things, both live and playable',
    'work.intro': 'Both run in the browser with nothing to install, and you can open either one right now. These are not course exercises — they are complete systems I had to design end to end.',
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

    'more.play.kind': 'Android · Google Play',
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
    'skills.title': 'What I can do, and where it shows',
    'skills.intro': "Every group points at something concrete on this page. If I haven't built it, it isn't listed.",
    'skills.g1t': 'Graphics and real time',
    'skills.g1b': 'Voxel rendering, isometric projection, animation loops and frame budgets. The engine drawing the scenes on this page is mine, with no libraries.',
    'skills.g2t': 'Networking and protocols',
    'skills.g2b': 'Binary formats, connection state, and live synchronization across clients — the heart of both WebCraft and Carritos.',
    'skills.g3t': 'The web platform',
    'skills.g3b': 'Modern JavaScript without leaning on a framework, real accessibility, performance, and continuous deployment to the edge.',
    'skills.g4t': 'Automation and operations',
    'skills.g4b': 'Services that install themselves, keep their secrets out of the source, and survive months without maintenance. Monitor DIAN is the full example.',
    'skills.g5t': 'Computer science fundamentals',
    'skills.g5b': 'Algorithms and data structures, artificial intelligence, machine learning, cryptography and databases, from the degree at Universidad Nacional.',
    'skills.g6t': 'Game development',
    'skills.g6b': 'From prototype to storefront: mechanics design, publishing on Google Play, and all the unglamorous work in between.',

    /* ------------------------------------------------------------- path */
    'path.eyebrow': 'Path',
    'path.title': 'How I got here',
    'path.1w': 'Now',
    'path.1t': 'Real-time systems in the browser',
    'path.1b': 'WebCraft and Carritos: a Minecraft client for the web and a multiplayer kart racer. Both are online, and both forced me to learn things no course covers.',
    'path.2w': 'Alongside',
    'path.2t': 'Automation that runs itself',
    'path.2b': 'Monitor DIAN taught me the difference between a script that works on my machine and a service that holds up for months on somebody else’s.',
    'path.3w': 'Undergraduate',
    'path.3t': 'Computer Science, Universidad Nacional de Colombia',
    'path.3b': 'Algorithms, artificial intelligence, machine learning, cryptography and databases — the theory that keeps the projects above from being trial and error.',
    'path.4w': 'From the start',
    'path.4t': 'OdobGames, indie studio',
    'path.4b': 'I founded the studio and published three games on Google Play. That is where I learned that finishing and shipping is a separate skill from programming.',

    /* ---------------------------------------------------------- contact */
    'contact.eyebrow': 'Contact',
    'contact.title': 'Looking for someone who finishes what they start?',
    'contact.body': 'I am open to software engineering roles, on-site in Colombia or remote. If something here caught your attention, the best first move is to open one of the projects and tell me what you would like to see inside it.',
    'contact.mail': 'Send me an email',
    'contact.github': 'github.com/OdobGames',
    'contact.copied': 'Copied!',
    'contact.note': 'GitHub works too. I reply to everything that comes in.',


    /* -------------------------------------------------------- tech tags */
    'tag.ai': "AI",
    'tag.algos': "Algorithms",
    'tag.android': "Android",
    'tag.binary': "Binary protocols",
    'tag.canvas': "Canvas 2D",
    'tag.cfpages': "Cloudflare Pages",
    'tag.clientserver': "Client/server",
    'tag.crypto': "Cryptography",
    'tag.css': "Modern CSS",
    'tag.gamedesign': "Game design",
    'tag.gameloop': "Game loop",
    'tag.gha': "GitHub Actions",
    'tag.ghpages': "GitHub Pages",
    'tag.html': "Semantic HTML",
    'tag.js': "JavaScript",
    'tag.linux': "Linux",
    'tag.mcproto': "Minecraft Java protocol",
    'tag.iso': "Isometric projection",
    'tag.gplay': "Google Play",
    'tag.ml': "Machine learning",
    'tag.netprog': "Network programming",
    'tag.physics': "Game physics",
    'tag.playwright': "Playwright",
    'tag.profiling': "Profiling",
    'tag.python': "Python",
    'tag.rtmp': "Real-time multiplayer",
    'tag.shipping': "Store publishing",
    'tag.smtp': "SMTP",
    'tag.sql': "SQL",
    'tag.statesync': "State synchronization",
    'tag.systemd': "systemd",
    'tag.voxelgfx': "Voxel graphics",
    'tag.voxelrender': "Voxel rendering",
    'tag.wcag': "WCAG",
    'tag.ws': "WebSockets",

    /* ----------------------------------------------------------- footer */
    'footer.left': '© 2026 Oscar Ordoñez — Colombia · Hand-written static site, no framework',
    'footer.source': 'Source of this site',
    'footer.mail': 'Email',
    'footer.legal': 'Minecraft is a trademark of Mojang Studios and Mario Kart of Nintendo. The projects on this page are not affiliated with or endorsed by either company. · Last updated: September 2026.'
  }
};
