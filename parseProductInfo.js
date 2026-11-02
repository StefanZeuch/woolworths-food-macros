function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseNutrition(multiAttributes) {
  const items = (multiAttributes || []).filter((a) => a.type === "NUTRITIONAL");
  if (!items.length) return null;

  const rows = items.map((item) => ({
    label: item.text,
    per100g: item.element1 ?? null,
    perServing: item.element2 ?? null,
    unit: item.element3 ?? null,
    rdiPercent: item.element4 ?? null,
  }));

  const per100g = {};
  for (const row of rows) {
    if (!row.label || row.label.toLowerCase().includes("average values")) continue;
    const key = row.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    per100g[key] = {
      value: row.per100g,
      unit: row.unit,
    };
  }

  return { rows, per100g };
}

function parseAttributeText(multiAttributes, type) {
  const items = (multiAttributes || []).filter((a) => a.type === type);
  if (!items.length) return null;

  const texts = items
    .map((item) => item.element1 || item.text)
    .filter(Boolean);

  return texts.length === 1 ? texts[0] : texts.join(" ");
}

function extractPrice(productPrices, productId) {
  if (!productPrices || !productId) return null;

  const skuPrices = productPrices[productId];
  if (!skuPrices) return null;

  for (const plist of Object.values(skuPrices)) {
    const skuEntry = plist?.skuPrices?.[productId];
    if (skuEntry?.SalePrice != null && skuEntry.SalePrice !== "") {
      return Number(skuEntry.SalePrice);
    }
    if (plist?.priceMin != null) {
      return Number(plist.priceMin);
    }
  }

  return null;
}

export function parseProductInfo(productInfo, productPrices, url) {
  if (!productInfo || !productInfo.productId) {
    throw new Error("Missing productInfo or productId");
  }

  const productId = String(productInfo.productId);
  const multiAttributes = productInfo.multiAttributes || [];
  const textualAttributes = productInfo.textualAttributes || {};

  return {
    id: productId,
    url: url || productInfo.productURL || productInfo.canonicalURL || null,
    title: productInfo.displayName || productInfo.description || null,
    price: extractPrice(productPrices, productId),
    description: stripHtml(productInfo.longDescription || ""),
    descriptionHtml: productInfo.longDescription || null,
    ingredients: textualAttributes.INGREDIENTS || null,
    allergens: parseAttributeText(multiAttributes, "ALLERGENS"),
    dietary: parseAttributeText(multiAttributes, "DIETARY"),
    nutrition: parseNutrition(multiAttributes),
    brand: (productInfo.productAttributes || [])
      .filter((a) => a.attributeDisplayName === "Brands")
      .map((a) => a.attributeValue)
      .join(", ") || null,
    productType: productInfo.productType || null,
  };
}
