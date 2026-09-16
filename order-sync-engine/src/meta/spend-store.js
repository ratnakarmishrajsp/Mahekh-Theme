import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const SPEND_STORE_FILE = path.join(config.dataDir, 'ad-spend-store.json');

export class AdSpendStore {
  constructor() {
    this.filePath = SPEND_STORE_FILE;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (err) {
      console.warn('[AdSpendStore] Error reading store:', err.message);
    }

    // Default seeded from known historical cache if available
    const initial = {};
    try {
      const cachePath = path.join(config.dataDir, 'history-30d-cache.json');
      if (fs.existsSync(cachePath)) {
        const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        for (const item of cache.data || []) {
          if (item.date && item.meta) {
            initial[item.date] = {
              date: item.date,
              baseSpend: item.meta.baseSpend || 0,
              gstAmount: item.meta.gstAmount || 0,
              spendWithGST: item.meta.spendWithGST || 0,
              impressions: item.meta.impressions || 0,
              clicks: item.meta.clicks || 0,
              metaPurchases: item.meta.metaPurchases || 0,
              isManual: false,
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // Ignore initial seed error
    }

    this.save(initial);
    return initial;
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      this.data = data;
    } catch (err) {
      console.error('[AdSpendStore] Failed to save store:', err.message);
    }
  }

  getSpend(dateStr) {
    return this.data[dateStr] || null;
  }

  setSpend(dateStr, { baseSpend, spendWithGST, impressions = 0, clicks = 0, metaPurchases = 0, isManual = true }) {
    let finalBase = parseFloat(baseSpend || 0);
    let finalWithGst = parseFloat(spendWithGST || 0);

    if (finalBase > 0 && (!finalWithGst || finalWithGst === 0)) {
      finalWithGst = Math.round(finalBase * 1.18 * 100) / 100;
    } else if (finalWithGst > 0 && (!finalBase || finalBase === 0)) {
      finalBase = Math.round((finalWithGst / 1.18) * 100) / 100;
    }

    const gstAmount = Math.round((finalWithGst - finalBase) * 100) / 100;

    this.data[dateStr] = {
      date: dateStr,
      baseSpend: finalBase,
      gstAmount,
      spendWithGST: finalWithGst,
      impressions,
      clicks,
      metaPurchases,
      isManual,
      lastUpdated: new Date().toISOString(),
    };

    this.save();
    return this.data[dateStr];
  }

  getAllSpends() {
    return this.data;
  }
}

export const adSpendStore = new AdSpendStore();
