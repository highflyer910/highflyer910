const fs = require("fs");
const path = require("path");
const { COLORS, FONT, escapeXml } = require("./theme");

const USERNAME = process.env.DEVTO_USERNAME || "highflyer910";

const LOCAL_HTML = process.env.PROFILE_HTML;
const OUT_FILE = path.join(__dirname, "..", "assets", "devto-badges.svg");
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; github-readme-devto-stats)" };

const ICON = 60;
const GAP = 16;
const PER_ROW = 8;
const PAD = 28;
const HEADER = 60;

const decodeHtml = (text) =>
  text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

function findBadges(html) {
  const badges = [];
  const seen = new Set();
  const badgeTag = /<[a-z]+\b[^>]*\bjs-profile-badge\b[^>]*>/g;

  for (const match of html.matchAll(badgeTag)) {
    const title = match[0].match(/\btitle="([^"]*)"/);
    const after = html.slice(match.index + match[0].length, match.index + match[0].length + 800);
    const img = after.match(/<img\b[^>]*\bsrc="([^"]+)"/);
    if (!title || !img) continue;

    const name = decodeHtml(title[1]);
    if (seen.has(name)) continue;
    seen.add(name);
    const src = decodeHtml(img[1]).replace(/width=\d+/, "width=96");
    badges.push({ name, src });
  }
  return badges;
}

async function toDataUri(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Could not download badge image (${res.status}): ${url}`);
  const type = res.headers.get("content-type") || "image/png";
  return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

function drawCard(badges) {
  const rows = Math.ceil(badges.length / PER_ROW);
  const width = PAD * 2 + PER_ROW * ICON + (PER_ROW - 1) * GAP;
  const height = HEADER + rows * ICON + (rows - 1) * GAP + PAD;

  const cells = badges
    .map((badge, i) => {
      const row = Math.floor(i / PER_ROW);
      const inThisRow = row === rows - 1 ? badges.length - row * PER_ROW : PER_ROW;
      const centering = ((PER_ROW - inThisRow) * (ICON + GAP)) / 2;
      const x = PAD + centering + (i % PER_ROW) * (ICON + GAP);
      const y = HEADER + row * (ICON + GAP);
      return `  <g>
    <title>${escapeXml(badge.name)}</title>
    <circle cx="${x + ICON / 2}" cy="${y + ICON / 2}" r="${ICON / 2 + 4}" fill="${COLORS.panel}"/>
    <image href="${badge.dataUri}" x="${x}" y="${y}" width="${ICON}" height="${ICON}"/>
  </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${badges.length} DEV badges">
  <title>${badges.length} DEV badges earned by ${escapeXml(USERNAME)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
  <rect x="${PAD}" y="22" width="4" height="18" rx="2" fill="${COLORS.accent}"/>
  <text x="${PAD + 14}" y="37" font-family="${FONT}" font-size="16" font-weight="800" letter-spacing="1.5" fill="${COLORS.text}">DEV BADGES</text>
  <text x="${width - PAD}" y="37" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${COLORS.muted}">${badges.length} earned</text>
${cells}
</svg>
`;
}

async function main() {
  let html;
  if (LOCAL_HTML) {
    html = fs.readFileSync(LOCAL_HTML, "utf8");
  } else {
    const res = await fetch(`https://dev.to/${USERNAME}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`DEV profile page answered ${res.status} ${res.statusText}.`);
    html = await res.text();
  }

  const badges = findBadges(html);
  if (badges.length === 0) throw new Error("No badges found on the profile page. Old card left as it is.");

  for (const badge of badges) badge.dataUri = await toDataUri(badge.src);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, drawCard(badges));
  console.log(`Badge card written: ${badges.length} badges`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
