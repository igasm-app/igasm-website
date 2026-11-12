// igasm.in/learn: the cited content hub (MASTER-PLAN 6.9, research M section 6 #14), GENERATED.
//
// Single source of truth: every card on these pages is read from the app repo's own cited files,
// features/learn/cycleGuide.ts (the cycle guide) and features/learn/cards.ts (things worth knowing), so the
// website can never say something the app does not, or drift from it. Run after either file changes:
//
//   node scripts/build-learn.mjs            (app repo expected at ../igasm; override with IGASM_APP=<path>)
//
// The output under public/learn/ is committed (a static site needs no app checkout to build).
// The build FAILS on the health-claim firewall (the same banned words the app's tests ban), on any em or
// en dash, and on a non-https source. Clinician review is pending: every page says so and carries
// noindex until a named reviewer and review date exist (research M #14: YMYL pages need a named reviewer).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');
const APP = resolve(SITE, process.env.IGASM_APP ?? '../igasm');
const guide = await import(pathToFileURL(join(APP, 'features/learn/cycleGuide.ts')).href);
const learn = await import(pathToFileURL(join(APP, 'features/learn/cards.ts')).href);
const { GUIDE_CARDS, GROUP_TITLE, PREGNANCY_LINE, GUIDE_FOOTER } = guide;
const { LEARN_CARDS } = learn;

const UPDATED = '4 November 2026';
const REVIEW =
  'Written by the igasm team from the studies and health services cited on this page. Not yet reviewed by a clinician: a named reviewer and a review date will appear here before this page is listed in search.';

// The firewall (scripts/cycleGuide.test.ts in the app repo). The one standing pregnancy line is the only
// place these words may appear, and it is left out of the check on purpose.
const BANNED =
  /\b(fertile|fertility|ovulation day|safe days?|low-risk days?|can'?t get pregnant|pregnan\w*|conceiv\w*|conception|contracept\w*|endometriosis|pmdd|diagnos\w*|you will feel|cures?|guarantee\w*|always works)\b/i;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const EVIDENCE = { strong: 'Strong evidence', moderate: 'Moderate evidence', mixed: 'Mixed evidence' };

/** Cycle-guide groups as pages, in the order a cycle runs, then the sets for other bodies. */
const GROUPS = [
  { group: 'menstrual', slug: 'your-period', lede: 'Comfort, protection and pain during a period, and when pain is worth raising with a clinician.' },
  { group: 'follicular', slug: 'after-your-period', lede: 'The days after a period, when many people notice desire building, and plenty notice no change at all.' },
  { group: 'ovulatory', slug: 'mid-cycle', lede: 'Mid-cycle desire on average, why it is only ever an estimate, and the one-sided twinge some people feel.' },
  { group: 'luteal', slug: 'before-your-period', lede: 'The days before a period: a common dip in desire, lighter sleep, tender breasts and mood that repeats.' },
  { group: 'any', slug: 'any-day', lede: 'What holds on every day of the month, for every body: responsive desire, pain, pleasure, lube and drinks.' },
  { group: 'hormonal', slug: 'hormonal-methods', lede: 'On the pill, patch, ring, implant, injection or a hormonal IUD: why cycle labels stop fitting, and what to watch.' },
  { group: 'perimenopause', slug: 'changing-rhythm', lede: 'Perimenopause and a changing rhythm: dryness, desire, and bleeding that deserves a check.' },
];
const CYCLE_GROUPS = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal']);

const STYLE = `
  :root { --bg: #140c0d; --fg: #fbead8; --muted: rgba(251,234,216,0.72); --subtle: rgba(251,234,216,0.5); --line: rgba(255,240,226,0.12); --amber: #e8985e; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; background: var(--bg); }
  body { margin: 0; background: radial-gradient(1200px 600px at 50% -10%, #3a1712 0%, var(--bg) 60%) fixed; color: var(--fg); font: 17px/1.6 Inter, system-ui, -apple-system, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 56px 20px 96px; }
  a { color: var(--amber); }
  .back { font-size: 15px; text-decoration: none; }
  h1 { font: 400 52px/1.05 "Instrument Serif", Georgia, serif; margin: 28px 0 8px; letter-spacing: -0.01em; }
  h2 { font: 400 30px/1.15 "Instrument Serif", Georgia, serif; margin: 48px 0 8px; }
  h3 { font-weight: 500; font-size: 17px; margin: 0 0 4px; color: var(--fg); }
  h2.card-h { font: 500 17px/1.6 Inter, system-ui, -apple-system, sans-serif; margin: 0 0 4px; color: var(--fg); letter-spacing: normal; }
  p, li { color: var(--muted); }
  ul { padding-left: 20px; }
  .meta { color: var(--subtle); font-size: 15px; }
  .review { color: var(--subtle); font-size: 14px; border: 1px solid var(--line); border-radius: 14px; padding: 10px 14px; margin-top: 20px; }
  .card { border: 1px solid var(--line); border-radius: 18px; padding: 18px 22px; margin-top: 16px; background: rgba(255,244,232,0.03); }
  .card p { margin: 0 0 10px; }
  .src { font-size: 14px; color: var(--subtle); margin: 0; }
  .dot { display: inline-block; width: 6px; height: 6px; border-radius: 3px; background: var(--amber); margin-right: 3px; vertical-align: middle; }
  .dot.off { background: rgba(232,152,94,0.25); }
  .doors { list-style: none; padding: 0; margin: 16px 0 0; }
  .doors li { border-top: 1px solid var(--line); padding: 14px 0; }
  .doors li:first-child { border-top: 0; }
  .doors a { font-weight: 500; text-decoration: none; font-size: 18px; }
  .doors span { display: block; color: var(--muted); font-size: 15px; margin-top: 2px; }
  .note { border-left: 2px solid var(--amber); padding-left: 14px; color: var(--muted); }
  footer { margin-top: 64px; color: var(--subtle); font-size: 14px; }
  label { display: block; font-size: 15px; color: var(--muted); margin: 10px 0 4px; }
  input[type=date] { font: inherit; color: var(--fg); background: rgba(255,244,232,0.06); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; width: 100%; max-width: 260px; color-scheme: dark; }
  button { font: 500 16px/1 Inter, system-ui, sans-serif; color: #1a1416; background: var(--amber); border: 0; border-radius: 999px; padding: 12px 20px; margin-top: 16px; cursor: pointer; }
  button.ghost { background: transparent; color: var(--amber); border: 1px solid var(--line); }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 16px; }
  td, th { text-align: left; padding: 8px 4px; border-top: 1px solid var(--line); color: var(--muted); font-weight: 400; }
  th { color: var(--subtle); font-size: 14px; }
  .check { list-style: none; padding: 0; }
  .check li { padding: 10px 0 10px 34px; position: relative; border-top: 1px solid var(--line); }
  .check li::before { content: ""; position: absolute; left: 0; top: 13px; width: 18px; height: 18px; border: 1.5px solid var(--amber); border-radius: 5px; }
  .write { display: block; border-bottom: 1px solid var(--line); height: 28px; }
  @media (max-width: 480px) { h1 { font-size: 42px; } }
  @media print {
    body { background: #fff; color: #000; font-size: 13px; }
    main { padding: 0; max-width: none; }
    p, li, td, th, .meta, .review, .src, footer { color: #222; }
    a { color: #000; }
    .back, .noprint, footer { display: none; }
    .card { border-color: #bbb; }
    .check li::before { border-color: #000; }
    .write { border-color: #999; }
  }`;

function page({ title, description, body, path }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} - igasm</title>
<meta name="description" content="${esc(description)}" />
<!-- Out of search until a named clinician reviews it (scripts/build-learn.mjs). -->
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="https://igasm.in${path}" />
<meta name="theme-color" content="#140c0d" />
<meta name="color-scheme" content="dark" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
<style>${STYLE}
</style>
</head>
<body>
<main>
${body}
  <footer>&copy; 2026 igasm. <a href="/learn/">Learn</a> &middot; <a href="/patterns/">How igasm decides a pattern is real</a> &middot; <a href="/desire/">How does your desire work?</a> &middot; <a href="/privacy/">Privacy</a> &middot; <a href="/terms/">Terms</a> &middot; <a href="/support/">Support</a></footer>
</main>
</body>
</html>
`;
}

const dots = (e) => {
  const n = { strong: 3, moderate: 2, mixed: 1 }[e];
  return [0, 1, 2].map((i) => `<span class="dot${i < n ? '' : ' off'}"></span>`).join('');
};

function card(c) {
  const ev = c.evidence ? `${dots(c.evidence)} ${EVIDENCE[c.evidence]} &middot; ` : '';
  return `  <article class="card" id="${esc(c.id)}">
    <h2 class="card-h">${esc(c.title)}</h2>
    <p>${esc(c.body)}</p>
    <p class="src">${ev}Source: <a href="${esc(c.url)}" rel="noopener">${esc(c.source)}</a></p>
  </article>`;
}

const header = (title, lede) => `  <a class="back" href="/learn/">&larr; Learn</a>
  <h1>${esc(title)}</h1>
  <p class="meta">igasm, by Venex Labs. Last updated ${UPDATED}.</p>
  <p>${esc(lede)}</p>
  <p class="review">${esc(REVIEW)}</p>`;

const closing = (cycle) => `
${cycle ? `  <p class="note">${esc(PREGNANCY_LINE)}</p>\n` : ''}  <p class="note">${esc(GUIDE_FOOTER)} igasm is a private journal, not medical care. For anything about your health, ask a clinician.</p>`;

const pages = []; // { path, html, checkText }

// The topic pages.
for (const g of GROUPS) {
  const cards = GUIDE_CARDS.filter((c) => c.group === g.group);
  if (!cards.length) throw new Error(`no cards for ${g.group}`);
  const title = GROUP_TITLE[g.group];
  const cycle = CYCLE_GROUPS.has(g.group);
  const phaseNote = cycle
    ? '\n  <p>Phases are estimated from period dates, and only about 13% of real cycles run 28 days (Bull et al. 2019), so read this as gentle context for how you feel, never as a schedule.</p>'
    : '';
  const body = `${header(title, g.lede)}${phaseNote}
${cards.map(card).join('\n')}
${closing(cycle)}`;
  pages.push({
    path: `/learn/${g.slug}/`,
    html: page({ title, description: g.lede, body, path: `/learn/${g.slug}/` }),
    checkText: [title, g.lede, ...cards.map((c) => `${c.title} ${c.body}`)].join(' '),
    urls: cards.map((c) => c.url),
  });
}

// Things worth knowing.
{
  const lede = 'Six well-described findings about desire and cycles, each with its source. They describe people in general, never you in particular.';
  const body = `${header('Things worth knowing', lede)}
${LEARN_CARDS.map(card).join('\n')}
${closing(false)}`;
  pages.push({
    path: '/learn/worth-knowing/',
    html: page({ title: 'Things worth knowing', description: lede, body, path: '/learn/worth-knowing/' }),
    checkText: [lede, ...LEARN_CARDS.map((c) => `${c.title} ${c.body}`)].join(' '),
    urls: LEARN_CARDS.map((c) => c.url),
  });
}

// Tool: before your appointment (printable).
{
  const lede = 'A one-page checklist to fill in before you talk to a clinician about sex, pain or your cycle. Print it, or save it as a PDF, and take it with you.';
  const items = [
    'What is happening, in your own words.',
    'When it started, and whether it came on slowly or suddenly.',
    'How often it happens, and whether it is getting better, worse or staying the same.',
    'If there is pain: where it is, what it feels like, and whether it comes during sex, after, or at other times.',
    'Whether it follows your cycle: the dates of your last few periods help (the cycle length tool below works them out).',
    'Any bleeding that is new for you, such as after sex or between periods.',
    'Medicines you take, and any hormonal method or IUD, with when you started or changed it.',
    'What makes it easier, and what makes it harder.',
    'How it affects your life, your relationship, your sleep or your mood.',
    'What you would most like to come away with: an explanation, a test, a referral, or options.',
  ];
  const body = `  <a class="back" href="/learn/">&larr; Learn</a>
  <h1>Before your appointment</h1>
  <p class="meta">igasm, by Venex Labs. Last updated ${UPDATED}.</p>
  <p>${esc(lede)}</p>
  <p class="review noprint">${esc(REVIEW)}</p>
  <p>Sexual and cycle concerns are common and clinicians hear about them every day. In a large national survey, about 1 in 13 sexually active people with a vagina reported painful sex lasting months (<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5638059/" rel="noopener">Mitchell et al. 2017</a>). Notes made over time are useful: for symptoms that return before periods, a daily record over two cycles is what clinicians use (<a href="https://doi.org/10.1016/j.jad.2024.01.066" rel="noopener">Reilly et al. 2024</a>), and guidance for period pain asks clinicians to listen to a person's own account of their symptoms (<a href="https://www.nice.org.uk/guidance/ng73" rel="noopener">NICE NG73</a>).</p>
  <h2>Write down</h2>
  <ul class="check">
${items.map((i) => `    <li>${esc(i)}<span class="write"></span></li>`).join('\n')}
  </ul>
  <h2>Questions you might ask</h2>
  <ul class="check">
    <li>What could be causing this, and what would help tell those apart?<span class="write"></span></li>
    <li>Is there anything I can try at home in the meantime?<span class="write"></span></li>
    <li>Should I see someone else, such as a gynaecologist, a sexual health clinic or a pelvic health physiotherapist?<span class="write"></span></li>
    <li>When should I come back if it does not get better?<span class="write"></span></li>
  </ul>
  <button class="noprint" onclick="window.print()">Print or save as PDF</button>
  <p class="note">You can bring a partner, a friend or a written list, and you can ask for a different clinician if you would be more comfortable. ${esc(GUIDE_FOOTER)}</p>`;
  pages.push({
    path: '/learn/before-your-appointment/',
    html: page({ title: 'Before your appointment', description: lede, body, path: '/learn/before-your-appointment/' }),
    checkText: [lede, ...items].join(' '),
    urls: [],
  });
}

// Tool: cycle length, worked out in the browser. Nothing is sent, nothing is stored, and nothing is predicted.
{
  const lede = 'Enter the first day of your last few periods and see how long each cycle ran. It works out the past only; it predicts nothing.';
  const body = `  <a class="back" href="/learn/">&larr; Learn</a>
  <h1>Your cycle length</h1>
  <p class="meta">igasm, by Venex Labs. Last updated ${UPDATED}.</p>
  <p>${esc(lede)} It runs entirely on this page: the dates never leave your device and are gone when you close it.</p>
  <p class="review">${esc(REVIEW)}</p>
  <form id="f" onsubmit="return false">
    <div id="rows"></div>
    <button type="button" class="ghost" id="more">Add another date</button>
  </form>
  <div id="out" aria-live="polite"></div>
  <h2>Reading it</h2>
  <p>Only about 13% of tracked cycles run exactly 28 days, and the average across more than 600,000 cycles was about 29 (<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" rel="noopener">Bull et al. 2019</a>). For adults, the international gynaecology federation describes cycles of 24 to 38 days as within the usual range, with the shortest and longest usually within 7 to 9 days of each other (<a href="https://doi.org/10.1002/ijgo.12666" rel="noopener">FIGO, Munro et al. 2018</a>). These are descriptions of people in general, not a test. If your cycles often fall outside them, change a lot, or something else worries you, it is worth mentioning to a clinician; the <a href="/learn/before-your-appointment/">appointment checklist</a> can help.</p>
  <p class="note">${esc(PREGNANCY_LINE)}</p>
  <p class="note">${esc(GUIDE_FOOTER)}</p>
<script>
(function () {
  var rows = document.getElementById('rows'), out = document.getElementById('out');
  function add() {
    var n = rows.children.length + 1, d = document.createElement('div');
    d.innerHTML = '<label for="d' + n + '">Period ' + n + ' started on</label><input type="date" id="d' + n + '" />';
    rows.appendChild(d); d.querySelector('input').addEventListener('change', calc);
  }
  function calc() {
    var ds = Array.prototype.map.call(rows.querySelectorAll('input'), function (i) { return i.value; })
      .filter(Boolean).map(function (v) { return Date.parse(v + 'T12:00:00Z'); }).sort(function (a, b) { return a - b; });
    var len = [];
    for (var i = 1; i < ds.length; i++) { var g = Math.round((ds[i] - ds[i - 1]) / 864e5); if (g > 0) len.push(g); }
    if (!len.length) { out.innerHTML = '<p>Add at least two start dates to see a cycle length.</p>'; return; }
    var lo = Math.min.apply(null, len), hi = Math.max.apply(null, len);
    var avg = Math.round(len.reduce(function (a, b) { return a + b; }, 0) / len.length * 10) / 10;
    var t = '<table><tr><th>Cycle</th><th>Length</th></tr>';
    len.forEach(function (l, i) { t += '<tr><td>' + (i + 1) + '</td><td>' + l + ' days</td></tr>'; });
    t += '</table>';
    var sum = len.length === 1 ? 'One cycle of ' + len[0] + ' days.'
      : len.length + ' cycles. Average ' + avg + ' days; shortest ' + lo + ', longest ' + hi + ' (' + (hi - lo) + ' days apart).';
    out.innerHTML = '<h2>Your cycles</h2><p>' + sum + '</p>' + t;
  }
  for (var k = 0; k < 4; k++) add();
  document.getElementById('more').addEventListener('click', function () { if (rows.children.length < 13) add(); });
  calc();
})();
</script>`;
  pages.push({
    path: '/learn/cycle-length/',
    html: page({ title: 'Your cycle length', description: lede, body, path: '/learn/cycle-length/' }),
    checkText: lede,
    urls: [],
  });
}

// The hub.
{
  const lede = 'Short, cited answers about intimacy, desire and comfort through the cycle and beyond. Every card names how strong its evidence is and links its source.';
  const doors = GROUPS.map((g) => ({ href: `/learn/${g.slug}/`, title: GROUP_TITLE[g.group], sub: g.lede }));
  doors.push({ href: '/learn/worth-knowing/', title: 'Things worth knowing', sub: 'Six well-described findings about desire and cycles.' });
  const tools = [
    { href: '/learn/before-your-appointment/', title: 'Before your appointment', sub: 'A printable checklist for talking to a clinician about sex, pain or your cycle.' },
    { href: '/learn/cycle-length/', title: 'Your cycle length', sub: 'Work out past cycle lengths from start dates, on this page only.' },
    { href: '/desire/', title: 'How does your desire work?', sub: 'Three questions, answered in your browser, nothing stored.' },
    { href: '/patterns/', title: 'How igasm decides a pattern is real', sub: 'The thresholds, and the false-alarm budget, in plain words.' },
  ];
  const list = (xs) => `  <ul class="doors">
${xs.map((d) => `    <li><a href="${d.href}">${esc(d.title)}</a><span>${esc(d.sub)}</span></li>`).join('\n')}
  </ul>`;
  const body = `  <a class="back" href="/">&larr; igasm</a>
  <h1>Learn</h1>
  <p class="meta">igasm, by Venex Labs. Last updated ${UPDATED}.</p>
  <p>${esc(lede)} These are the same cards the igasm app shows, word for word.</p>
  <p class="review">${esc(REVIEW)}</p>
  <h2>Through the cycle, and beyond it</h2>
${list(doors)}
  <h2>Tools</h2>
${list(tools)}
  <h2>How these are written</h2>
  <ul>
    <li>Each card is short, says what the evidence is (strong, moderate or mixed) and links the study or health service behind it.</li>
    <li>Cards describe people in general and invite you to notice your own experience. Nothing here names a condition, predicts anything, or is a reason to start or stop any treatment.</li>
  </ul>
${closing(true)}`;
  pages.push({
    path: '/learn/',
    html: page({ title: 'Learn', description: lede, body, path: '/learn/' }),
    checkText: [lede, ...doors.map((d) => `${d.title} ${d.sub}`), ...tools.map((d) => `${d.title} ${d.sub}`)].join(' '),
    urls: [],
  });
}

// The gates, then write.
// The whole visible page is checked, not only the cards; the one standing pregnancy line is the sole exception.
const visible = (html) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<head>[\s\S]*?<\/head>/g, ' ')
    .replace(/<[^>]+>/g, ' ').split(esc(PREGNANCY_LINE)).join(' ').replace(/&[a-z]+;/g, ' ');
for (const p of pages) {
  const m = `${p.checkText} ${visible(p.html)}`.match(BANNED);
  if (m) throw new Error(`firewall: "${m[0]}" on ${p.path}`);
  if (/[\u2013\u2014]/.test(p.html)) throw new Error(`em or en dash on ${p.path}`);
  for (const u of p.urls) if (!/^https:\/\//.test(u)) throw new Error(`non-https source ${u} on ${p.path}`);
}
for (const p of pages) {
  const file = join(SITE, 'public', p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, p.html);
}
console.log(`learn: ${pages.length} pages, ${GUIDE_CARDS.length + LEARN_CARDS.length} cited cards, firewall clean`);
