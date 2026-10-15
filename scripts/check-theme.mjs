import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/theme.css", import.meta.url), "utf8");
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)];
const declarations = (body) => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]));
const root = declarations(blocks[0][2]);
const dark = declarations(blocks[1][2]);
const shared = declarations(blocks[2][2]);

function color(value, tokens) {
  if (value.startsWith("var(")) {
    const [, key, fallback] = value.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
    return color(tokens[key] ?? fallback, tokens);
  }
  if (value.startsWith("color-mix(")) {
    const [, first, percentage, second] = value.match(/^color-mix\(in srgb, (var\(--[\w-]+\)) (\d+)%, (var\(--[\w-]+\))\)$/);
    const weight = Number(percentage) / 100;
    const a = color(first, tokens);
    return color(second, tokens).map((channel, index) => channel * (1 - weight) + a[index] * weight);
  }
  assert.match(value, /^#(?:[\da-f]{3}|[\da-f]{6})$/i);
  const hex = value.length === 4 ? value.slice(1).split("").map((channel) => channel + channel).join("") : value.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function luminance(channels) {
  return channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

let checks = 0;
for (const [theme, overrides] of [["light", {}], ["dark", dark]]) {
  const tokens = { ...root, ...overrides, ...shared };
  const pairs = [
    ["--foreground", "--background"],
    ...["--foreground", "--secondary-foreground", "--muted-foreground"].flatMap((text) => ["--surface", "--surface-secondary", "--background"].map((surface) => [text, surface])),
    ["--primary-foreground", "--primary"],
    ["--primary-hover-foreground", "--primary-hover"],
    ["--destructive-foreground", "--error-foreground"],
    ...["success", "warning", "error", "information"].map((status) => [`--${status}-foreground`, `--${status}-background`]),
    ...["confirmed", "contract", "pending", "lead", "completed", "cancelled"].map((status) => [`--status-${status}`, `color-mix(in srgb, var(--status-${status}) 10%, var(--surface))`]),
    ["--input-border", "--input", 3],
    ["--focus", "--surface", 3],
    ["--focus", "--background", 3],
  ];
  for (const [foreground, background, minimum = 4.5] of pairs) {
    const a = luminance(color(tokens[foreground], tokens));
    const b = luminance(color(tokens[background] ?? background, tokens));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(ratio >= minimum, `${theme}: ${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    checks++;
  }
}
process.stdout.write(`${checks} theme contrast checks passed.\n`);
