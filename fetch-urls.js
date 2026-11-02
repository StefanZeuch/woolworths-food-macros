#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  CNSTRC_BASE,
  CNSTRC_KEY,
  FOOD_ROOT_GROUP,
  SITE_BASE,
  PAGE_SIZE,
  DEFAULT_DELAY_MS,
} from "./config.js";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : fallback;
}

const outputFile = getArg("--output", "urls.json");
const delayMs = parseInt(getArg("--delay", String(DEFAULT_DELAY_MS)), 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeResult(result) {
  const data = result.data || {};
  const relUrl = data.url || "";
  const id =
    data.id ||
    relUrl.match(/A-(\d+)/)?.[1] ||
    result.variation_id ||
    "";

  return {
    id: String(id),
    name: result.value || data.description || "",
    url: relUrl.startsWith("http") ? relUrl : `${SITE_BASE}/${relUrl}`,
  };
}

async function fetchPage(page) {
  const url =
    `${CNSTRC_BASE}/browse/group_id/${FOOD_ROOT_GROUP}` +
    `?key=${CNSTRC_KEY}&page=${page}&num_results_per_page=${PAGE_SIZE}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching page ${page}`);
  }
  return res.json();
}

async function main() {
  const productMap = new Map();
  let page = 1;
  let total = Infinity;

  console.log("Fetching food product URLs from Constructor.io...");

  while (productMap.size < total) {
    const data = await fetchPage(page);
    const response = data.response || {};
    total = response.total_num_results ?? 0;
    const results = response.results || [];

    if (!results.length) break;

    for (const result of results) {
      const product = normalizeResult(result);
      if (product.id) productMap.set(product.id, product);
    }

    process.stdout.write(
      `\r  Page ${page}: ${productMap.size}/${total} unique products`
    );
    page++;
    await sleep(delayMs);
  }

  console.log();

  const output = {
    scrapedAt: new Date().toISOString(),
    source: "constructor.io",
    department: "food",
    totalUrls: productMap.size,
    urls: [...productMap.values()],
  };

  await writeFile(outputFile, JSON.stringify(output, null, 2));
  console.log(`Done: ${output.totalUrls} URLs -> ${outputFile}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
