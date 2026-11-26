// One-off: delete top-level CSS rules whose every class is unreferenced.
// Rules inside @media / @keyframes / @supports are left alone, and any rule
// that still mentions one live class is kept.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.jsx?$/.test(full) ? [full] : [];
  });

// ---- which classes are referenced anywhere in src ------------------------
const used = new Set();
for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g)) {
    const raw = m[1] || m[2] || m[3] || "";
    for (const token of raw.split(/[\s${}?:]+/)) {
      if (/^[a-z][a-z0-9-]*$/.test(token)) used.add(token);
    }
  }
  for (const m of text.matchAll(/"([a-z][a-z0-9-]*)"/g)) used.add(m[1]);
}

const cssPath = join("src", "styles.css");
let css = readFileSync(cssPath, "utf8");

// ---- walk top-level blocks ----------------------------------------------
let out = "";
let i = 0;
let removed = 0;
let removedChars = 0;

while (i < css.length) {
  const braceAt = css.indexOf("{", i);
  if (braceAt === -1) {
    out += css.slice(i);
    break;
  }

  const selector = css.slice(i, braceAt);
  const selectorTrim = selector.trim();
  const isAtRule = selectorTrim.startsWith("@");

  // find the matching close brace
  let depth = 0;
  let j = braceAt;
  while (j < css.length) {
    if (css[j] === "{") depth += 1;
    else if (css[j] === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
    j += 1;
  }
  const block = css.slice(i, j + 1);

  const classes = [...selectorTrim.matchAll(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)].map((m) => m[1]);
  const allDead = classes.length > 0 && classes.every((name) => !used.has(name));

  if (!isAtRule && allDead) {
    removed += 1;
    removedChars += block.length;
  } else {
    out += block;
  }
  i = j + 1;
}

// collapse the blank gaps left behind
out = out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n");
writeFileSync(cssPath, out, "utf8");

console.log(`removed ${removed} dead rules (~${Math.round(removedChars / 1024)} KB)`);
console.log(`styles.css ${Math.round(css.length / 1024)} KB -> ${Math.round(out.length / 1024)} KB`);
