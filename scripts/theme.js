const COLORS = {
  bg: "#0d1630",
  panel: "#17234a",
  border: "#2b3d73",
  accent: "#2B4CA9",
  text: "#f1f4fb",
  muted: "#9aa8c7",
  onAccent: "#ffffff",
};

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const estimateWidth = (text, fontSize) => Math.ceil(String(text).length * fontSize * 0.64);

module.exports = { COLORS, FONT, escapeXml, estimateWidth };
