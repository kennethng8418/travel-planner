// MapLibre GL v6 runs map rendering in a Web Worker loaded from a separate module file,
// which the Next.js bundler can't discover on its own. Copy the worker (and the shared
// chunk it imports) into public/ so DayMap can point MapLibre at it via setWorkerUrl().
// Runs on `npm install` (postinstall) so the copies always match the installed version.

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre");

mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(from, file), join(to, file));
}
console.log("Copied MapLibre worker to public/maplibre/");
