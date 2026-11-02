import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'products.json');
const OUTPUT_DIR = path.join(ROOT, 'ui', 'public');
const OUTPUT_INDEX = path.join(OUTPUT_DIR, 'products.json');
const OUTPUT_DETAILS_DIR = path.join(OUTPUT_DIR, 'products-details');
const CHUNK_SIZE = 200;

function parseNutrientValue(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).trim().replace(/^</, '');
  const match = cleaned.match(/[\d.]+/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

function parseDietaryTags(dietary) {
  if (!dietary) return [];
  const tags = [];
  const lower = dietary.toLowerCase();
  if (lower.includes('vegan')) tags.push('Vegan');
  if (lower.includes('vegetarian')) tags.push('Vegetarian');
  if (lower.includes('halaal') || lower.includes('halal')) tags.push('Halaal');
  if (lower.includes('kosher')) tags.push('Kosher');
  return tags;
}

function buildNutrients(per100g) {
  if (!per100g) return {};
  const nutrients = {};
  for (const [key, entry] of Object.entries(per100g)) {
    nutrients[key] = parseNutrientValue(entry.value);
  }
  return nutrients;
}

function buildDetail(product) {
  return {
    description: product.description ?? null,
    descriptionHtml: product.descriptionHtml ?? null,
    ingredients: product.ingredients ?? null,
    allergens: product.allergens ?? null,
    dietary: product.dietary ?? null,
    nutrition: product.nutrition ?? null,
  };
}

async function main() {
  console.log(`Reading ${INPUT}...`);
  const raw = await readFile(INPUT, 'utf8');
  const data = JSON.parse(raw);
  const products = data.products ?? [];

  const slimProducts = [];
  const chunks = new Map();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const chunk = Math.floor(i / CHUNK_SIZE);

    slimProducts.push({
      id: product.id,
      title: product.title,
      price: product.price ?? null,
      url: product.url,
      brand: product.brand ?? null,
      dietaryTags: parseDietaryTags(product.dietary),
      ingredientsPreview: product.ingredients
        ? product.ingredients.slice(0, 200)
        : null,
      chunk,
      hasNutrition: Boolean(product.nutrition),
      nutrients: buildNutrients(product.nutrition?.per100g),
    });

    if (!chunks.has(chunk)) {
      chunks.set(chunk, {});
    }
    chunks.get(chunk)[product.id] = buildDetail(product);
  }

  await rm(OUTPUT_DETAILS_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DETAILS_DIR, { recursive: true });

  const indexPayload = {
    scrapedAt: data.scrapedAt ?? null,
    inputFile: data.inputFile ?? null,
    totalProducts: slimProducts.length,
    failed: data.failed ?? 0,
    chunkSize: CHUNK_SIZE,
    chunkCount: chunks.size,
    products: slimProducts,
  };

  await writeFile(OUTPUT_INDEX, JSON.stringify(indexPayload));
  console.log(`Wrote ${OUTPUT_INDEX} (${slimProducts.length} products)`);

  for (const [chunkId, chunkData] of chunks) {
    const chunkPath = path.join(OUTPUT_DETAILS_DIR, `chunk-${chunkId}.json`);
    await writeFile(chunkPath, JSON.stringify(chunkData));
    console.log(`Wrote ${chunkPath} (${Object.keys(chunkData).length} products)`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
