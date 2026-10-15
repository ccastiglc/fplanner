import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

let accent = "#EA580C";
let session = { user: { organizationId: "test-organization" } };
let organizationExists = true;
let query;
const dependencies = {
  "@/auth": { auth: async () => session },
  "@/lib/prisma": { prisma: { organization: { findUnique: async (input) => {
    query = input;
    return organizationExists ? { settings: { brandAccentColor: accent } } : null;
  } } } },
};
const source = readFileSync(new URL("../src/app/api/brand-theme/route.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const compiled = { exports: {} };
runInNewContext(code, { module: compiled, exports: compiled.exports, Response, require: (name) => {
  assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
  return dependencies[name];
} });

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

let checks = 0;
async function palette() {
  const response = await compiled.exports.GET();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("content-type"), "text/css; charset=utf-8");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const css = await response.text();
  const colors = Object.fromEntries([...css.matchAll(/--organization-([\w-]+):(#[\da-f]{6})/gi)].map(([, name, value]) => [name, value]));
  assert.equal(Object.keys(colors).length, 6);
  assert.ok(!/--(?:status|error|warning|success|information)(?:-|:)/.test(css));
  for (const state of ["accent", "accent-hover", "accent-dark-hover"]) {
    const background = luminance(colors[state]);
    const foreground = luminance(colors[`${state}-foreground`]);
    const contrast = (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
    assert.ok(contrast >= 4.5, `${accent} ${state}: ${contrast.toFixed(2)}:1`);
    checks++;
  }
  return colors;
}

for (const red of [0, 64, 128, 192, 255]) for (const green of [0, 64, 128, 192, 255]) for (const blue of [0, 64, 128, 192, 255]) {
  accent = `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  await palette();
  assert.equal(query.where.id, "test-organization");
}
for (const invalid of ["#fff", "invalid", "#ffffff;}body{display:none}"]) {
  accent = invalid;
  assert.equal((await palette()).accent, "#FF6B00");
}
session = null;
organizationExists = false;
assert.equal((await palette()).accent, "#FF6B00");
assert.equal(query.where.slug, "fredo-productions");
process.stdout.write(`${checks} brand action contrast checks passed; organization scoping, private caching, invalid-color fallback, and status isolation verified.\n`);
