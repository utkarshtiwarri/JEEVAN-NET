// One-off audit: list CSS classes that no module references, so dead rules can
// be removed deliberately instead of guessed at.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.jsx?$/.test(full) ? [full] : [];
  });

const used = new Set();
for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g)) {
    const raw = m[1] || m[2] || m[3] || "";
    for (const token of raw.split(/[\s${}?:]+/)) {
      if (/^[a-z][a-z0-9-]*$/.test(token)) used.add(token);
    }
  }
  // classes composed in ternaries, e.g. risk-"high"
  for (const m of text.matchAll(/"([a-z][a-z0-9-]*)"/g)) used.add(m[1]);
}

const css = readFileSync(join("src", "styles.css"), "utf8");
const defined = [...new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)].map((m) => m[1]))].sort();

const dead = defined.filter((name) => !used.has(name));
console.log(`CSS classes defined: ${defined.length}`);
console.log(`never referenced:    ${dead.length}`);
console.log(dead.join("\n"));
