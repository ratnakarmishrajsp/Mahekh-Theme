import fs from 'node:fs';
import path from 'node:path';
import { productsMetadata } from './product-metadata.js';
import {
  buildAttarSingleHtml,
  buildComboPackHtml,
  buildEdpHtml,
  buildCarPerfumeHtml,
} from './description-builder.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const outputDir = path.join(workspaceRoot, 'descriptions');

console.log(`Generating HTML descriptions for all ${productsMetadata.length} pending products...`);

let successCount = 0;

for (const item of productsMetadata) {
  let html = '';
  if (item.type === 'edp') {
    html = buildEdpHtml(item);
  } else if (item.type === 'car') {
    html = buildCarPerfumeHtml(item);
  } else if (item.type === 'combo') {
    html = buildComboPackHtml(item);
  } else {
    html = buildAttarSingleHtml(item);
  }

  if (!html || html.length < 5000) {
    console.error(`[ERROR] Generated HTML is too small for ID ${item.id} (${item.handle})`);
    continue;
  }

  const filePath = path.join(outputDir, `${item.handle}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
  successCount++;
  console.log(`[${successCount}/${productsMetadata.length}] Generated ${item.handle}.html (${html.length} bytes)`);
}

console.log(`\nSuccessfully created ${successCount} HTML description files in ${outputDir}!\n`);
