import { cp, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";
const staticEntries = [
  "assets",
  "js",
  "about.html",
  "app.js",
  "contact.html",
  "features.html",
  "index.html",
  "privacy.html",
  "robots.txt",
  "styles.css",
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  staticEntries.map((entry) =>
    cp(entry, `${outputDir}/${entry}`, {
      recursive: true,
    }),
  ),
);
