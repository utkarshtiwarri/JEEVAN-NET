// One-off: insert the auth-form styles at the end of the SIGN-IN PAGE block,
// before its first media query (styles.css is CRLF, so anchor on one line).
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/styles.css";
const ANCHOR = "@media (max-width: 1120px) {";

const CSS = `/* ---- Sign in / create account tabs, signup grid, notices ---- */

.signin-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border-radius: 11px;
  background: #f1f6f8;
}

.signin-tab {
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4d6573;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.signin-tab:hover {
  color: #0f766e;
}

.signin-tab.is-active {
  background: #ffffff;
  color: #0b192b;
  box-shadow: 0 1px 3px rgba(11, 25, 43, 0.12);
}

.signin-notice {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid #cfe6dd;
  border-radius: 8px;
  background: #f2fbf7;
  color: #17614c;
  font-size: 11.5px;
  line-height: 1.55;
}

.signin-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.signin-input-plain {
  padding-left: 13px;
}

.signin-select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #64798a 50%),
    linear-gradient(135deg, #64798a 50%, transparent 50%);
  background-position: calc(100% - 17px) 20px, calc(100% - 12px) 20px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  cursor: pointer;
}

.signin-switch {
  margin: 14px 0 0;
  text-align: center;
  color: #5c7587;
  font-size: 11.5px;
}

.signin-link {
  padding: 0;
  border: none;
  background: none;
  color: #0f766e;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.signin-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.signin-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 14px;
  color: #64798a;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.9px;
  text-transform: uppercase;
}

.signin-divider::before,
.signin-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e6eef2;
}

.signin-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 10px 0 0;
  color: #17614c;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.signin-tab:focus-visible,
.signin-link:focus-visible,
.signin-select:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}

`;

const text = readFileSync(FILE, "utf8");
const lines = text.split(/\r?\n/);
const idx = lines.findIndex((line) => line.trim() === ANCHOR);
if (idx < 0) throw new Error("anchor not found");

const block = CSS.replace(/\r?\n/g, "\r\n").replace(/\r\n$/, "");
const out = [...lines.slice(0, idx), ...block.split("\r\n"), "", ...lines.slice(idx)];
writeFileSync(FILE, out.join("\r\n"));
console.log(`inserted ${block.split("\r\n").length} lines before line ${idx + 1}`);
