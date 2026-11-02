#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { parseProductInfo } from "./parseProductInfo.js";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : fallback;
}

const inputFile = getArg("--input", "urls.json");
const outputFile = getArg("--output", "products.json");
const partialFile = outputFile.replace(/\.json$/, ".partial.json");
const failedFile = "failed.json";
const limit = args.includes("--limit")
  ? parseInt(getArg("--limit", "0"), 10)
  : Infinity;
const delayMs = parseInt(getArg("--delay", "1000"), 10);
const resume = args.includes("--resume");
const checkpointEvery = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadUrls() {
  const raw = await readFile(inputFile, "utf8");
  const data = JSON.parse(raw);
  return data.urls || [];
}

async function loadExistingProducts() {
  const filesToTry = resume ? [outputFile, partialFile] : [];
  const products = new Map();
  const failed = [];

  for (const file of filesToTry) {
    try {
      const raw = await readFile(file, "utf8");
      const data = JSON.parse(raw);
      for (const product of data.products || []) {
        if (product?.id) products.set(product.id, product);
      }
    } catch {
      // file may not exist yet
    }
  }

  if (resume) {
    try {
      const raw = await readFile(failedFile, "utf8");
      const data = JSON.parse(raw);
      failed.push(...(data.failed || []));
    } catch {
      // no failed file yet
    }
  }

  return { products, failed };
}

async function saveOutput(products, failed, inputLabel) {
  const productList = [...products.values()];
  const payload = {
    scrapedAt: new Date().toISOString(),
    inputFile: inputLabel,
    totalProducts: productList.length,
    failed: failed.length,
    products: productList,
  };

  await writeFile(outputFile, JSON.stringify(payload, null, 2));
  await writeFile(
    failedFile,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        failed,
      },
      null,
      2
    )
  );
}

async function savePartial(products, failed, inputLabel) {
  const productList = [...products.values()];
  await writeFile(
    partialFile,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        inputFile: inputLabel,
        totalProducts: productList.length,
        failed: failed.length,
        products: productList,
      },
      null,
      2
    )
  );
  await writeFile(
    failedFile,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        failed,
      },
      null,
      2
    )
  );
}

async function scrapeProduct(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.waitForFunction(
    () =>
      window.__INITIAL_STATE__?.pdp?.productInfo?.productId &&
      window.__INITIAL_STATE__?.pdp?.productInfoInProgress === false,
    { timeout: 30000 }
  );

  const raw = await page.evaluate(() => ({
    productInfo: window.__INITIAL_STATE__.pdp.productInfo,
    productPrices: window.__INITIAL_STATE__.pdp.productPrices,
  }));

  return parseProductInfo(raw.productInfo, raw.productPrices, url);
}

async function main() {
  const urls = await loadUrls();
  const { products, failed } = await loadExistingProducts();
  const failedIds = new Set(failed.map((f) => f.id));

  const pending = urls
    .filter((entry) => !products.has(entry.id))
    .slice(0, limit);

  console.log(
    `Loaded ${urls.length} URLs from ${inputFile}. ` +
      `${products.size} already scraped. ` +
      `Processing ${pending.length} remaining.`
  );

  if (!pending.length) {
    await saveOutput(products, failed, inputFile);
    console.log(`Nothing to do. Output already has ${products.size} products.`);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-ZA",
  });
  const page = await context.newPage();

  let processed = 0;

  try {
    for (const entry of pending) {
      processed++;
      process.stdout.write(
        `\r  [${processed}/${pending.length}] ${entry.name.slice(0, 50).padEnd(50)}`
      );

      try {
        const product = await scrapeProduct(page, entry.url);
        products.set(product.id, product);
        failedIds.delete(entry.id);
      } catch (err) {
        const failure = {
          id: entry.id,
          url: entry.url,
          name: entry.name,
          error: err.message,
          failedAt: new Date().toISOString(),
        };
        if (!failedIds.has(entry.id)) {
          failed.push(failure);
          failedIds.add(entry.id);
        }
      }

      if (processed % checkpointEvery === 0) {
        await savePartial(products, failed, inputFile);
      }

      await sleep(delayMs);
    }
  } finally {
    await browser.close();
  }

  console.log();
  await saveOutput(products, failed, inputFile);
  console.log(
    `Done: ${products.size} products -> ${outputFile}, ${failed.length} failures -> ${failedFile}`
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
