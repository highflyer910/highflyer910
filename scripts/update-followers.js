const fs = require("fs");
const path = require("path");
const { COLORS, FONT, escapeXml, estimateWidth } = require("./theme");

const API_KEY = process.env.DEVTO_API_KEY;

const PREVIEW_COUNT = process.env.FOLLOWERS_COUNT;
const OUT_FILE = path.join(__dirname, "..", "assets", "devto-followers.svg");
const PAGE_SIZE = 1000;

async function countFollowers() {
  let total = 0;
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://dev.to/api/followers/users?per_page=${PAGE_SIZE}&page=${page}`,
      {
        headers: {
          "api-key": API_KEY,
          Accept: "application/vnd.forem.api-v1+json",
          "User-Agent": "github-readme-devto-stats",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`DEV API answered ${res.status} ${res.statusText}. Check the DEVTO_API_KEY secret.`);
    }
    const followers = await res.json();
    if (!Array.isArray(followers)) throw new Error("Unexpected answer from the DEV API.");
    total += followers.length;
    if (followers.length < PAGE_SIZE) return total;
  }
}

function drawPill(count) {
  const value = Number(count).toLocaleString("en-US");
  const label = "DEV FOLLOWERS";
  const height = 36;
  const labelWidth = estimateWidth(label, 12) + 36;
  const valueWidth = estimateWidth(value, 15) + 28;
  const width = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="DEV followers: ${escapeXml(value)}">
  <title>DEV followers: ${escapeXml(value)}</title>
  <clipPath id="pill"><rect width="${width}" height="${height}" rx="${height / 2}"/></clipPath>
  <g clip-path="url(#pill)">
    <rect width="${labelWidth}" height="${height}" fill="${COLORS.bg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${COLORS.accent}"/>
  </g>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${height / 2 - 0.5}" fill="none" stroke="${COLORS.border}"/>
  <text x="${labelWidth / 2 + 4}" y="${height / 2 + 4.5}" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" letter-spacing="1" fill="${COLORS.text}">${label}</text>
  <text x="${labelWidth + valueWidth / 2 - 3}" y="${height / 2 + 5.5}" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="800" fill="${COLORS.onAccent}">${escapeXml(value)}</text>
</svg>
`;
}

async function main() {
  if (!API_KEY && !PREVIEW_COUNT) throw new Error("Set DEVTO_API_KEY (or FOLLOWERS_COUNT for a preview).");
  const count = PREVIEW_COUNT ? Number(PREVIEW_COUNT) : await countFollowers();
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, drawPill(count));
  console.log(`Follower pill written: ${count}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
