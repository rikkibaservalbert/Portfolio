import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import postcss from "postcss";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => readFileSync(path.join(root, name), "utf8");
const html = read("index.html");
const script = read("script.js");
const stylesheet = postcss.parse(read("style.css"), { from: "style.css" });
const { document } = new JSDOM(html).window;

new vm.Script(script, { filename: "script.js" });
document.querySelectorAll("script:not([src])").forEach((element) => {
  new vm.Script(element.textContent, { filename: "index.html bootstrap" });
});

const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
assert.equal(new Set(ids).size, ids.length, "Element IDs must be unique");

let localLinks = 0;
for (const element of document.querySelectorAll("[src], [href]")) {
  for (const attribute of ["src", "href"]) {
    const target = element.getAttribute(attribute);
    if (!target || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(target)) continue;
    if (target.startsWith("#")) {
      assert(ids.includes(target.slice(1)), `Missing anchor: ${target}`);
    } else {
      const file = decodeURIComponent(target.split(/[?#]/)[0]);
      assert(existsSync(path.join(root, file)), `Missing file: ${file}`);
      localLinks++;
    }
  }
}

const declaredVariables = new Set();
stylesheet.walkDecls(/^--/, (declaration) => declaredVariables.add(declaration.prop));
for (const match of html.matchAll(/--([\w-]+)\s*:/g)) declaredVariables.add(`--${match[1]}`);
stylesheet.walkDecls((declaration) => {
  for (const match of declaration.value.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
    assert(declaredVariables.has(match[1]), `Undefined CSS variable: ${match[1]}`);
  }
});

assert.equal(document.querySelectorAll(".gallery-project-card").length, 3);
assert.equal(document.querySelectorAll(".design-item").length, 30);
assert.equal(document.querySelectorAll("#typed-role").length, 1);
assert.equal(document.querySelectorAll('a[href="files/RIKKI_VALBERT_BASER-CV.pdf"]').length, 2);

console.log(
  `Source checks passed: JavaScript, CSS, unique IDs, ${localLinks} local files, anchors, and portfolio content.`,
);
