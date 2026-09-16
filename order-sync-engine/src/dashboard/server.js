import http from 'node:http';
import url from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { getLiveMetrics, getISTDateString } from '../cli/live-roas.js';
import { MetaAdsClient } from '../meta/client.js';
import { HistoricalAnalyticsManager } from '../meta/history.js';
import { adSpendStore } from '../meta/spend-store.js';
import { config } from '../config.js';

const PORT = process.env.PORT || 4040;
const historyMgr = new HistoricalAnalyticsManager();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mahekh - Real-Time ROAS & Profit Cockpit</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --m-bg-dark: #090a0f;
      --m-card-bg: #12141c;
      --m-card-border: rgba(223, 186, 115, 0.18);
      --m-gold: #dfba73;
      --m-gold-grad: linear-gradient(135deg, #f8ecc8 0%, #dfba73 50%, #b38238 100%);
      --m-text-main: #f3f4f6;
      --m-text-muted: #94a3b8;
      --m-green: #10b981;
      --m-green-bg: rgba(16, 185, 129, 0.12);
      --m-red: #ef4444;
      --m-red-bg: rgba(239, 68, 68, 0.12);
      --m-blue: #3b82f6;
      --m-blue-bg: rgba(59, 130, 246, 0.12);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--m-bg-dark);
      color: var(--m-text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* 3D VAULT LOCK SCREEN */
    .vault-lock-screen {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: radial-gradient(circle at 50% 30%, #151824 0%, #08090d 100%);
      z-index: 999999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px;
      perspective: 1200px;
      transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .vault-lock-screen.unlocked {
      opacity: 0;
      transform: scale(1.08) translateZ(100px);
      pointer-events: none;
    }

    .vault-card {
      background: linear-gradient(180deg, rgba(25, 29, 41, 0.92) 0%, rgba(14, 16, 24, 0.97) 100%);
      border: 1px solid rgba(223, 186, 115, 0.28);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(223, 186, 115, 0.12);
      border-radius: 28px;
      padding: 38px 34px;
      max-width: 420px; width: 100%;
      text-align: center;
      position: relative;
      transform-style: preserve-3d;
      backdrop-filter: blur(20px);
      transition: transform 0.2s ease;
    }

    .vault-3d-tumbler {
      width: 96px; height: 96px;
      margin: 0 auto 20px auto;
      position: relative;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #fceecb 0%, #d4aa55 45%, #7a581a 100%);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), inset 0 4px 8px rgba(255, 255, 255, 0.6), inset 0 -6px 12px rgba(0, 0, 0, 0.7);
      display: flex; align-items: center; justify-content: center;
      transform-style: preserve-3d;
      transition: transform 0.5s ease;
    }

    .vault-3d-inner-rim {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: #11131a;
      border: 3px solid #dfba73;
      display: flex; align-items: center; justify-content: center;
      box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.9);
    }

    .vault-lock-icon {
      width: 28px; height: 28px;
      color: var(--m-gold);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .vault-brand-tag {
      font-family: 'Outfit', sans-serif;
      font-size: 13px; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--m-gold); margin-bottom: 6px;
    }

    .vault-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px;
    }

    .vault-subtitle {
      font-size: 13px; color: var(--m-text-muted); margin-bottom: 24px;
    }

    .pin-dots-row {
      display: flex; justify-content: center; gap: 14px; margin-bottom: 26px;
    }

    .pin-dot {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #1c202d;
      border: 1.5px solid rgba(223, 186, 115, 0.3);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pin-dot.filled {
      background: var(--m-gold-grad);
      border-color: #f7e8c4;
      box-shadow: 0 0 14px rgba(223, 186, 115, 0.7);
      transform: scale(1.15);
    }

    .keypad-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }

    .key-btn {
      height: 60px;
      background: linear-gradient(180deg, #222634 0%, #171a24 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: 3px solid rgba(0, 0, 0, 0.5);
      border-radius: 16px;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
      cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: all 0.1s ease;
      user-select: none;
    }

    .key-btn:active {
      transform: translateY(2px);
      border-bottom-width: 1px;
      background: #2c3244;
    }

    .key-btn .letters {
      font-size: 9px;
      font-weight: 600;
      color: var(--m-text-muted);
      letter-spacing: 0.1em;
      margin-top: 1px;
    }

    .key-btn.action-key {
      background: #141720;
      color: var(--m-gold);
      font-size: 16px;
    }

    /* MAIN COCKPIT DASHBOARD */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px 60px 24px;
    }

    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--m-gold-grad);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #000;
      box-shadow: 0 4px 20px rgba(223, 186, 115, 0.3);
    }
    .brand-title h1 { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; margin: 0; }
    .brand-title p { font-size: 13px; color: var(--m-text-muted); display: flex; align-items: center; gap: 8px; margin: 4px 0 0 0; }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--m-green);
      box-shadow: 0 0 10px var(--m-green); animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.15); } }

    .dash-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
    .preset-pills {
      display: flex; background: #191d26; padding: 4px; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .preset-btn {
      background: none; border: none; padding: 8px 14px; color: var(--m-text-muted);
      font-size: 13px; font-weight: 600; border-radius: 7px; cursor: pointer; transition: all 0.2s ease;
    }
    .preset-btn.active {
      background: var(--m-gold-grad); color: #0b0d11; box-shadow: 0 2px 10px rgba(223, 186, 115, 0.25);
    }
    .custom-date-box {
      display: flex; align-items: center; gap: 8px; background: #191d26;
      border: 1px solid rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 10px;
    }
    .custom-date-box label { font-size: 11px; color: var(--m-text-muted); font-weight: 600; text-transform: uppercase; }
    .custom-date-box input[type="date"] {
      background: transparent; border: none; color: #fff; font-size: 13px; font-weight: 600; outline: none; color-scheme: dark;
    }
    .btn-action {
      background: #191d26; border: 1px solid rgba(255, 255, 255, 0.1); color: var(--m-text-main);
      padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
    }
    .btn-action:hover { background: #222733; border-color: var(--m-gold); }

    /* STATUS PILLS */
    .status-badge {
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;
    }
    .status-badge.connected { background: rgba(16, 185, 129, 0.15); color: var(--m-green); border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-badge.manual { background: rgba(223, 186, 115, 0.15); color: var(--m-gold); border: 1px solid rgba(223, 186, 115, 0.3); }
    .status-badge.error { background: rgba(239, 68, 68, 0.15); color: var(--m-red); border: 1px solid rgba(239, 68, 68, 0.3); }

    .btn-edit-spend {
      background: rgba(223, 186, 115, 0.15); border: 1px solid rgba(223, 186, 115, 0.4);
      color: var(--m-gold); font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 6px;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-edit-spend:hover { background: var(--m-gold); color: #0b0d11; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 28px; }
    .stat-card {
      background: var(--m-card-bg); border: 1px solid var(--m-card-border); border-radius: 16px;
      padding: 22px 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .stat-card:hover { transform: translateY(-2px); border-color: rgba(223, 186, 115, 0.35); }
    .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .stat-label { font-size: 13px; font-weight: 600; color: var(--m-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
    .stat-tag.gst { background: rgba(223, 186, 115, 0.15); color: var(--m-gold); }
    .stat-tag.success { background: var(--m-green-bg); color: var(--m-green); }
    .stat-value { font-family: 'Outfit', sans-serif; font-size: 34px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .stat-value.gold { background: var(--m-gold-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-value.green { color: var(--m-green); }
    .stat-subtext { font-size: 12.5px; color: var(--m-text-muted); display: flex; align-items: center; gap: 6px; }

    .calculator-panel {
      background: linear-gradient(180deg, #161922 0%, #11131a 100%);
      border: 1px solid rgba(223, 186, 115, 0.25); border-radius: 18px;
      padding: 24px 28px; margin-bottom: 32px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
    }
    .calc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .calc-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: var(--m-gold); display: flex; align-items: center; gap: 10px; }
    .calc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: center; }
    .input-box label { display: block; font-size: 12px; color: var(--m-text-muted); margin-bottom: 6px; font-weight: 600; }
    .input-box input {
      width: 100%; background: #0d0f15; border: 1px solid rgba(255, 255, 255, 0.12); color: #fff;
      padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none;
    }
    .profit-output-card {
      background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px;
      padding: 16px 20px; text-align: right;
    }
    .profit-output-card.loss { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
    .profit-output-label { font-size: 12px; color: var(--m-text-muted); font-weight: 600; }
    .profit-output-val { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: var(--m-green); }
    .profit-output-val.loss { color: var(--m-red); }

    .history-section {
      background: var(--m-card-bg); border: 1px solid var(--m-card-border); border-radius: 18px;
      padding: 24px; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
    .history-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--m-gold); }
    .history-badge { background: rgba(223, 186, 115, 0.15); color: var(--m-gold); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
    .summary-banner {
      display: flex; gap: 20px; background: #0d0f15; padding: 12px 18px; border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06); margin-bottom: 18px; flex-wrap: wrap;
    }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 11px; color: var(--m-text-muted); font-weight: 600; text-transform: uppercase; }
    .summary-val { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }

    .dashboard-split { display: grid; grid-template-columns: 3fr 2fr; gap: 24px; }
    @media (max-width: 1024px) { .dashboard-split { grid-template-columns: 1fr; } }
    .panel { background: var(--m-card-bg); border: 1px solid var(--m-card-border); border-radius: 16px; padding: 22px; }
    .panel-title { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }

    .custom-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .custom-table th {
      text-align: left; padding: 10px 12px; color: var(--m-text-muted); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600; font-size: 12px; text-transform: uppercase;
    }
    .custom-table td { padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: var(--m-text-main); }
    .custom-table tr.clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .custom-table tr.clickable-row:hover { background: rgba(223, 186, 115, 0.08); }

    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .badge-active { background: var(--m-green-bg); color: var(--m-green); }
    .badge-paused { background: rgba(255, 255, 255, 0.08); color: var(--m-text-muted); }
    .badge-cod { background: rgba(223, 186, 115, 0.15); color: var(--m-gold); }
    .badge-prepaid { background: var(--m-blue-bg); color: var(--m-blue); }
    .badge-cancelled { background: rgba(239, 68, 68, 0.18); color: var(--m-red); }
    .truncate { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* EDIT SPEND MODAL */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(8px);
      z-index: 99999; display: none; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: #141722; border: 1px solid rgba(223, 186, 115, 0.35); border-radius: 24px;
      max-width: 440px; width: 100%; padding: 28px; box-shadow: 0 30px 70px rgba(0,0,0,0.85);
    }
    .modal-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .modal-sub { font-size: 13px; color: var(--m-text-muted); margin-bottom: 20px; line-height: 1.5; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--m-text-muted); margin-bottom: 6px; }
    .form-group input {
      width: 100%; background: #0b0d11; border: 1px solid rgba(255, 255, 255, 0.12); color: #fff;
      padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none;
    }
    .form-group input:focus { border-color: var(--m-gold); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
    .btn-save-spend {
      background: var(--m-gold-grad); border: none; color: #000; font-weight: 700;
      padding: 10px 20px; border-radius: 10px; cursor: pointer;
    }
    .btn-cancel {
      background: #1f2430; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff;
      padding: 10px 16px; border-radius: 10px; cursor: pointer;
    }
  </style>
</head>
<body>

  <!-- 3D VAULT LOCK SCREEN -->
  <div class="vault-lock-screen" id="vaultLockScreen">
    <div class="vault-card" id="vaultCard">
      <div class="vault-3d-tumbler" id="vaultTumbler">
        <div class="vault-3d-inner-rim">
          <svg class="vault-lock-icon" id="vaultLockIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      </div>

      <div class="vault-brand-tag">MAHEKH PRIVATE SUITE</div>
      <h2 class="vault-title">Executive ROAS Cockpit</h2>
      <p class="vault-subtitle">Enter 4-digit security passcode to unlock live financials</p>

      <div class="pin-dots-row">
        <div class="pin-dot" id="dot0"></div>
        <div class="pin-dot" id="dot1"></div>
        <div class="pin-dot" id="dot2"></div>
        <div class="pin-dot" id="dot3"></div>
      </div>

      <div class="keypad-grid">
        <button class="key-btn" onclick="enterPin('1')">1</button>
        <button class="key-btn" onclick="enterPin('2')">2<span class="letters">ABC</span></button>
        <button class="key-btn" onclick="enterPin('3')">3<span class="letters">DEF</span></button>
        <button class="key-btn" onclick="enterPin('4')">4<span class="letters">GHI</span></button>
        <button class="key-btn" onclick="enterPin('5')">5<span class="letters">JKL</span></button>
        <button class="key-btn" onclick="enterPin('6')">6<span class="letters">MNO</span></button>
        <button class="key-btn" onclick="enterPin('7')">7<span class="letters">PQRS</span></button>
        <button class="key-btn" onclick="enterPin('8')">8<span class="letters">TUV</span></button>
        <button class="key-btn" onclick="enterPin('9')">9<span class="letters">WXYZ</span></button>
        <button class="key-btn action-key" onclick="clearPin()">C</button>
        <button class="key-btn" onclick="enterPin('0')">0</button>
        <button class="key-btn action-key" onclick="backspacePin()">⌫</button>
      </div>
    </div>
  </div>

  <!-- EDIT SPEND MODAL -->
  <div class="modal-backdrop" id="spendModal">
    <div class="modal-box">
      <h3 class="modal-title">Edit / Set Meta Ad Spend</h3>
      <p class="modal-sub">Directly enter ad spend for this date to compute real-time blended ROAS, CPO, and profit margin instantly.</p>
      
      <div class="form-group">
        <label>Target Date (IST)</label>
        <input type="date" id="modalSpendTargetDate" color-scheme="dark">
      </div>

      <div class="form-group">
        <label>Base Meta Spend (before GST) ₹</label>
        <input type="number" id="modalBaseSpend" placeholder="e.g. 2500" step="0.01" oninput="onBaseSpendInput(this.value)">
      </div>

      <div class="form-group">
        <label>Total Ad Spend (w/ 18% GST) ₹</label>
        <input type="number" id="modalSpendWithGst" placeholder="e.g. 2950" step="0.01" oninput="onSpendWithGstInput(this.value)">
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeSpendModal()">Cancel</button>
        <button class="btn-save-spend" id="btnSaveSpend" onclick="saveAdSpend()">Save Spend</button>
      </div>
    </div>
  </div>

  <!-- MAIN COCKPIT DASHBOARD -->
  <div class="container">
    <header class="dash-header">
      <div class="brand-group">
        <div class="brand-logo">M</div>
        <div class="brand-title">
          <h1>MAHEKH LUXURY PERFUMES</h1>
          <p>
            <span class="live-dot"></span> Live Sync: Shopify Store (Asia/Kolkata)
            <span class="status-badge connected" style="margin-left: 8px;">Shopify: Connected</span>
            <span class="status-badge manual" id="metaHeaderBadge">Meta: Checking...</span>
          </p>
        </div>
      </div>

      <div class="dash-controls">
        <div class="preset-pills">
          <button class="preset-btn active" onclick="loadData('today', this)">Today</button>
          <button class="preset-btn" onclick="loadData('yesterday', this)">Yesterday</button>
          <button class="preset-btn" onclick="loadData('last_7d', this)">Last 7 Days</button>
        </div>

        <div class="custom-date-box">
          <label>Pick Date:</label>
          <input type="date" id="customDateInput" onchange="onCustomDateChange(this.value)">
        </div>

        <button class="btn-action" id="refreshBtn" onclick="refreshCurrent()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh Live
        </button>

        <button class="btn-action" onclick="lockSession()" title="Lock Screen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Lock
        </button>
      </div>
    </header>

    <!-- Top Key Metrics Cards -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Spend (w/ 18% GST)</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="stat-tag gst" id="metaCardBadge">Meta + GST</span>
            <button class="btn-edit-spend" onclick="openSpendModal()" title="Edit or Enter Ad Spend">✏️ Edit Spend</button>
          </div>
        </div>
        <div class="stat-value gold" id="spendWithGst">₹0</div>
        <div class="stat-subtext">
          <span>Base Ad Spend: <b id="baseSpend" style="color:#fff;">₹0</b></span> • <span>GST: <b id="gstAmount" style="color:#fff;">₹0</b></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Shopify Revenue</span>
          <span class="stat-tag success">Verified Live</span>
        </div>
        <div class="stat-value green" id="shopifyRevenue">₹0</div>
        <div class="stat-subtext">
          <span>COD: <b id="codRev" style="color:#fff;">₹0</b></span> • <span>Prepaid: <b id="prepRev" style="color:#fff;">₹0</b></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Real Blended ROAS</span>
          <span class="stat-tag" id="roasBadge" style="background: rgba(16, 185, 129, 0.15); color: var(--m-green);">Gross</span>
        </div>
        <div class="stat-value" id="blendedRoas">0.00x</div>
        <div class="stat-subtext">Revenue ÷ Total Ad Spend with GST</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Orders & CPO</span>
          <span class="stat-tag" style="background: rgba(59, 130, 246, 0.15); color: var(--m-blue);">Shipments</span>
        </div>
        <div class="stat-value" id="ordersCount">0 Orders</div>
        <div class="stat-subtext">
          Cost Per Order: <b id="costPerOrder" style="color:#fff;">₹0</b> • AOV: <b id="aovVal" style="color:#fff;">₹0</b>
        </div>
      </div>
    </section>

    <!-- Profitability Calculator -->
    <section class="calculator-panel">
      <div class="calc-header">
        <div class="calc-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M12 15h0M17 15h0M7 11h0M12 11h0M17 11h0M7 7h10"/></svg>
          In-Hand Net Profit Estimator (Live Calculator)
        </div>
        <span style="font-size: 12px; color: var(--m-text-muted);">Adjust values below to compute instant net profit</span>
      </div>

      <div class="calc-grid">
        <div class="input-box">
          <label>Product Cost (COGS) / Bottle (₹)</label>
          <input type="number" id="cogsInput" value="180" oninput="recalcProfit()">
        </div>

        <div class="input-box">
          <label>Avg Shipping Cost / Shipment (₹)</label>
          <input type="number" id="shippingInput" value="95" oninput="recalcProfit()">
        </div>

        <div class="input-box">
          <label>Estimated RTO Rate (%)</label>
          <input type="number" id="rtoInput" value="18" oninput="recalcProfit()">
        </div>

        <div class="profit-output-card" id="profitBox">
          <div class="profit-output-label">ESTIMATED NET PROFIT</div>
          <div class="profit-output-val" id="netProfitVal">₹0</div>
          <div style="font-size: 11px; color: var(--m-text-muted); margin-top: 4px;" id="netMarginPercent">Net Margin: 0%</div>
        </div>
      </div>
    </section>

    <!-- 30-Day Historical Matrix -->
    <section class="history-section">
      <div class="history-header">
        <div class="history-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          30-Day Performance & ROAS Matrix
        </div>
        <span class="history-badge">Daily Breakdown</span>
      </div>

      <div class="summary-banner">
        <div class="summary-item">
          <span class="summary-label">30-Day Ad Spend (w/ GST)</span>
          <span class="summary-val" id="sum30Spend" style="color: var(--m-gold);">₹0</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">30-Day Shopify Sales</span>
          <span class="summary-val" id="sum30Sales" style="color: var(--m-green);">₹0</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">30-Day Total Orders</span>
          <span class="summary-val" id="sum30Orders">0</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">30-Day Overall ROAS</span>
          <span class="summary-val" id="sum30Roas">0.00x</span>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date (IST)</th>
              <th>Meta Spend (w/ GST)</th>
              <th>Shopify Orders</th>
              <th>Shopify Sales</th>
              <th>Real ROAS</th>
              <th>Cost / Order (CPO)</th>
              <th>AOV</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="historyBody">
            <tr><td colspan="8" style="text-align:center; color: var(--m-text-muted); padding: 20px;">Loading historical data...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Lower Split: Campaigns vs Orders -->
    <div class="dashboard-split">
      <div class="panel">
        <div class="panel-title">
          <span>Campaigns Breakdown</span>
          <span style="font-size: 12px; font-weight: 500; color: var(--m-text-muted);" id="campCount">0 Campaigns</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Daily Budget</th>
                <th>Spend (w/ GST)</th>
                <th>Purchases</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody id="campaignsBody">
              <tr><td colspan="6" style="text-align: center; color: var(--m-text-muted);">Loading campaigns...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">
          <span id="ordersPanelTitle">Verified Orders</span>
          <span style="font-size: 12px; font-weight: 500; color: var(--m-gold);" id="orderStatusCount">Live Feed</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>City</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody id="ordersBody">
              <tr><td colspan="5" style="text-align: center; color: var(--m-text-muted);">Loading orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    const TARGET_PIN = '1409';
    let enteredPin = '';
    let currentPreset = 'today';
    let currentActiveDate = '';
    let globalData = null;
    let globalHistory = [];

    let lastPinActionTime = 0;
    let lastEnteredDigit = '';

    // 3D Vault PIN
    function enterPin(digit, evt) {
      if (evt) {
        if (evt.cancelable) evt.preventDefault();
        evt.stopPropagation();
      }
      const now = Date.now();
      if (now - lastPinActionTime < 140) return;
      if (digit === lastEnteredDigit && (now - lastPinActionTime < 240)) return;
      lastPinActionTime = now;
      lastEnteredDigit = digit;

      if (enteredPin.length < 4) {
        enteredPin += String(digit);
        updateDots();
        const tumbler = document.getElementById('vaultTumbler');
        if (tumbler) {
          const rot = enteredPin.length * 35;
          tumbler.style.transform = 'rotate(' + rot + 'deg) translateZ(10px)';
        }

        if (enteredPin.length === 4) {
          setTimeout(verifyPin, 180);
        }
      }
    }

    function backspacePin() {
      if (enteredPin.length > 0) {
        enteredPin = enteredPin.slice(0, -1);
        updateDots();
      }
    }

    function clearPin() {
      enteredPin = '';
      updateDots();
      const tumbler = document.getElementById('vaultTumbler');
      if (tumbler) tumbler.style.transform = 'rotate(0deg)';
    }

    function updateDots() {
      for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('dot' + i);
        if (!dot) continue;
        if (i < enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      }
    }

    function verifyPin() {
      const card = document.getElementById('vaultCard');
      const lockScreen = document.getElementById('vaultLockScreen');
      const lockIcon = document.getElementById('vaultLockIcon');

      if (enteredPin === TARGET_PIN) {
        lockIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
        document.getElementById('vaultTumbler').style.transform = 'rotate(360deg) scale(1.15)';
        
        sessionStorage.setItem('mahekh_cockpit_unlocked', 'true');
        setTimeout(() => {
          lockScreen.classList.add('unlocked');
          loadData('today');
          loadHistory30Days();
        }, 300);
      } else {
        card.classList.add('shake');
        setTimeout(() => {
          card.classList.remove('shake');
          clearPin();
        }, 500);
      }
    }

    function lockSession() {
      sessionStorage.removeItem('mahekh_cockpit_unlocked');
      clearPin();
      document.getElementById('vaultLockIcon').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
      document.getElementById('vaultLockScreen').classList.remove('unlocked');
    }

    if (sessionStorage.getItem('mahekh_cockpit_unlocked') === 'true') {
      document.getElementById('vaultLockScreen').classList.add('unlocked');
      loadData('today');
      loadHistory30Days();
    }

    document.addEventListener('keydown', function(e) {
      if (document.getElementById('vaultLockScreen').classList.contains('unlocked')) return;
      if (e.key >= '0' && e.key <= '9') {
        enterPin(e.key);
      } else if (e.key === 'Backspace') {
        backspacePin();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        clearPin();
      }
    });

    // Data Fetching
    async function loadData(preset, btnElem) {
      currentPreset = preset;
      if (btnElem) {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
        document.getElementById('customDateInput').value = '';
      }

      const refreshBtn = document.getElementById('refreshBtn');
      refreshBtn.style.opacity = '0.5';

      try {
        const [resMetrics, resCamps] = await Promise.all([
          fetch('/api/metrics?preset=' + preset).then(r => r.json()),
          fetch('/api/campaigns?preset=' + preset).then(r => r.json()).catch(() => ({ campaigns: [] }))
        ]);

        if (resMetrics && !resMetrics.error) {
          globalData = resMetrics;
          currentActiveDate = resMetrics.dateIST;
          renderMetrics(resMetrics);
          renderCampaigns(resCamps?.campaigns || resCamps || []);
          recalcProfit();
          document.getElementById('ordersPanelTitle').innerText = 'Verified Orders (' + (resMetrics.dateIST || preset) + ')';
        } else {
          console.error('Metrics API error:', resMetrics?.error);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        refreshBtn.style.opacity = '1';
      }
    }

    async function loadHistory30Days() {
      try {
        const res = await fetch('/api/history-30d');
        const data = await res.json();
        if (Array.isArray(data)) {
          globalHistory = data;
          renderHistoryTable(data);
        }
      } catch (e) {
        console.error('History fetch error:', e);
      }
    }

    function renderHistoryTable(items) {
      const tbody = document.getElementById('historyBody');
      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--m-text-muted);">No historical records found.</td></tr>';
        return;
      }

      let totalSpend = 0;
      let totalSales = 0;
      let totalOrders = 0;

      tbody.innerHTML = items.map(d => {
        const spendWithGST = d.meta?.spendWithGST || 0;
        const totalRevenue = d.shopify?.totalRevenue || 0;
        const ordersCount = d.shopify?.ordersCount || 0;
        const codOrders = d.shopify?.codOrders || 0;

        totalSpend += spendWithGST;
        totalSales += totalRevenue;
        totalOrders += ordersCount;

        let roasColor = 'var(--m-red)';
        if (d.blendedRoas >= 3.0) roasColor = 'var(--m-green)';
        else if (d.blendedRoas >= 2.0) roasColor = 'var(--m-gold)';

        return \`
          <tr class="clickable-row" onclick="onCustomDateChange('\${d.date}')" title="Click to inspect \${d.date}">
            <td><b>\${d.date}</b></td>
            <td><b>₹\${Math.round(spendWithGST).toLocaleString('en-IN')}</b> <span style="font-size:11px; color:var(--m-text-muted);">(base: ₹\${Math.round(d.meta?.baseSpend || 0)})</span></td>
            <td><b>\${ordersCount}</b> <span style="font-size:11px; color:var(--m-text-muted);">(\${codOrders} COD)</span></td>
            <td style="color:var(--m-green); font-weight:700;">₹\${Math.round(totalRevenue).toLocaleString('en-IN')}</td>
            <td style="color:\${roasColor}; font-weight:800;">\${d.blendedRoas > 0 ? d.blendedRoas.toFixed(2) + 'x' : '-'}</td>
            <td>₹\${Math.round(d.cpo || 0)}</td>
            <td>₹\${Math.round(d.aov || 0)}</td>
            <td>
              <button onclick="event.stopPropagation(); openSpendModalForDate('\${d.date}', \${d.meta?.baseSpend || 0}, \${spendWithGST})" class="btn-edit-spend">✏️ Edit Spend</button>
            </td>
          </tr>
        \`;
      }).join('');

      document.getElementById('sum30Spend').innerText = '₹' + Math.round(totalSpend).toLocaleString('en-IN');
      document.getElementById('sum30Sales').innerText = '₹' + Math.round(totalSales).toLocaleString('en-IN');
      document.getElementById('sum30Orders').innerText = totalOrders.toLocaleString('en-IN');
      const overallRoas = totalSpend > 0 ? (totalSales / totalSpend).toFixed(2) : '0.00';
      document.getElementById('sum30Roas').innerText = overallRoas + 'x';
    }

    function onCustomDateChange(dateStr) {
      if (!dateStr) return;
      document.getElementById('customDateInput').value = dateStr;
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

      loadData(dateStr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function refreshCurrent() {
      loadData(currentPreset);
      loadHistory30Days();
    }

    function renderMetrics(data) {
      if (!data) return;

      const meta = data.meta || {};
      const shopify = data.shopify || {};
      const blended = data.blended || {};

      document.getElementById('spendWithGst').innerText = '₹' + Math.round(meta.spendWithGST || 0).toLocaleString('en-IN');
      document.getElementById('baseSpend').innerText = '₹' + Math.round(meta.baseSpend || 0).toLocaleString('en-IN');
      document.getElementById('gstAmount').innerText = '₹' + Math.round(meta.gstAmount || 0).toLocaleString('en-IN');

      document.getElementById('shopifyRevenue').innerText = '₹' + Math.round(shopify.totalSales || 0).toLocaleString('en-IN');
      document.getElementById('codRev').innerText = '₹' + Math.round(shopify.codSales || 0).toLocaleString('en-IN');
      document.getElementById('prepRev').innerText = '₹' + Math.round(shopify.prepaidSales || 0).toLocaleString('en-IN');

      const roasElem = document.getElementById('blendedRoas');
      roasElem.innerText = (blended.grossRoas || 0) + 'x';
      if (blended.grossRoas >= 3.0) roasElem.style.color = 'var(--m-green)';
      else if (blended.grossRoas >= 2.0) roasElem.style.color = 'var(--m-gold)';
      else roasElem.style.color = 'var(--m-red)';

      document.getElementById('ordersCount').innerText = (shopify.totalOrders || 0) + ' Orders';
      document.getElementById('costPerOrder').innerText = '₹' + Math.round(blended.costPerOrder || 0).toLocaleString('en-IN');
      document.getElementById('aovVal').innerText = '₹' + Math.round(shopify.aov || 0).toLocaleString('en-IN');

      // Update Status Badges
      const headerBadge = document.getElementById('metaHeaderBadge');
      const cardBadge = document.getElementById('metaCardBadge');
      if (meta.isLive) {
        headerBadge.innerText = 'Meta: Live Connected';
        headerBadge.className = 'status-badge connected';
        cardBadge.innerText = 'Meta Live';
      } else if (meta.isManual) {
        headerBadge.innerText = 'Meta: Stored Spend';
        headerBadge.className = 'status-badge manual';
        cardBadge.innerText = 'Stored Spend';
      } else if (meta.status === 'error') {
        headerBadge.innerText = 'Meta: Restrained (Code 200)';
        headerBadge.className = 'status-badge error';
        cardBadge.innerText = 'Restrained (Code 200)';
      } else {
        headerBadge.innerText = 'Meta: Ready';
        headerBadge.className = 'status-badge manual';
        cardBadge.innerText = 'Meta + GST';
      }

      const ordersBody = document.getElementById('ordersBody');
      if (!shopify.orders || shopify.orders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--m-text-muted);">No orders found for this period</td></tr>';
      } else {
        ordersBody.innerHTML = shopify.orders.map(o => \`
          <tr>
            <td><b>\${o.name}</b></td>
            <td><div class="truncate">\${o.customerName}</div></td>
            <td><span style="color:var(--m-text-muted)">\${o.city || 'India'}</span></td>
            <td>
              <span class="badge \${o.is_cancelled ? 'badge-cancelled' : (o.payment_mode === 'COD' ? 'badge-cod' : 'badge-prepaid')}">
                \${o.is_cancelled ? 'CANCELLED' : o.payment_mode}
              </span>
            </td>
            <td><b>₹\${Math.round(o.total_price)}</b></td>
          </tr>
        \`).join('');
      }
    }

    function renderCampaigns(campaigns) {
      const campBody = document.getElementById('campaignsBody');
      const activeOrSpent = (campaigns || []).filter(c => (c.spendWithGST || 0) > 0 || c.effective_status === 'ACTIVE');
      document.getElementById('campCount').innerText = activeOrSpent.length + ' Active/Running';

      if (activeOrSpent.length === 0) {
        campBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--m-text-muted); padding: 18px;">No active campaigns reported or Meta token restricted.</td></tr>';
        return;
      }

      campBody.innerHTML = activeOrSpent.map(c => \`
        <tr>
          <td><div class="truncate" title="\${c.name}"><b>\${c.name}</b></div></td>
          <td><span class="badge \${c.effective_status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}">\${c.effective_status}</span></td>
          <td>\${c.daily_budget ? '₹' + c.daily_budget : 'CBO/AdSet'}</td>
          <td><b>₹\${Math.round(c.spendWithGST || 0)}</b></td>
          <td>\${c.purchases || 0}</td>
          <td><b>\${(c.metaRoas || 0).toFixed(2)}x</b></td>
        </tr>
      \`).join('');
    }

    function recalcProfit() {
      if (!globalData) return;

      const cogs = parseFloat(document.getElementById('cogsInput').value || 0);
      const shipping = parseFloat(document.getElementById('shippingInput').value || 0);
      const rtoPercent = parseFloat(document.getElementById('rtoInput').value || 0) / 100;

      const totalSales = globalData.shopify?.totalSales || 0;
      const orders = globalData.shopify?.totalOrders || 0;
      const spendWithGST = globalData.meta?.spendWithGST || 0;

      const deliveredOrders = orders * (1 - rtoPercent);
      const effectiveSales = totalSales * (1 - rtoPercent);

      const totalCogs = deliveredOrders * cogs;
      const totalShipping = orders * shipping;
      const rtoReverseCost = (orders * rtoPercent) * (shipping * 0.7);

      const totalCosts = spendWithGST + totalCogs + totalShipping + rtoReverseCost;
      const netProfit = effectiveSales - totalCosts;

      const profitElem = document.getElementById('netProfitVal');
      const marginElem = document.getElementById('netMarginPercent');
      const profitBox = document.getElementById('profitBox');

      profitElem.innerText = (netProfit >= 0 ? '+' : '') + '₹' + Math.round(netProfit).toLocaleString('en-IN');
      const margin = effectiveSales > 0 ? ((netProfit / effectiveSales) * 100).toFixed(1) : 0;
      marginElem.innerText = 'Net Margin: ' + margin + '% (Est. Delivered: ' + deliveredOrders.toFixed(1) + ' orders)';

      if (netProfit >= 0) {
        profitElem.className = 'profit-output-val';
        profitBox.className = 'profit-output-card';
      } else {
        profitElem.className = 'profit-output-val loss';
        profitBox.className = 'profit-output-card loss';
      }
    }

    // SPEND MODAL LOGIC
    function openSpendModal() {
      const targetDate = currentActiveDate || globalData?.dateIST || new Date().toISOString().slice(0, 10);
      const currentBase = globalData?.meta?.baseSpend || 0;
      const currentWithGst = globalData?.meta?.spendWithGST || 0;
      openSpendModalForDate(targetDate, currentBase, currentWithGst);
    }

    function openSpendModalForDate(dateStr, baseSpend, spendWithGst) {
      document.getElementById('modalSpendTargetDate').value = dateStr;
      document.getElementById('modalBaseSpend').value = baseSpend ? Math.round(baseSpend) : '';
      document.getElementById('modalSpendWithGst').value = spendWithGst ? Math.round(spendWithGst) : '';
      document.getElementById('spendModal').classList.add('open');
    }

    function closeSpendModal() {
      document.getElementById('spendModal').classList.remove('open');
    }

    function onBaseSpendInput(val) {
      const base = parseFloat(val);
      if (!isNaN(base) && base > 0) {
        document.getElementById('modalSpendWithGst').value = Math.round(base * 1.18);
      } else {
        document.getElementById('modalSpendWithGst').value = '';
      }
    }

    function onSpendWithGstInput(val) {
      const withGst = parseFloat(val);
      if (!isNaN(withGst) && withGst > 0) {
        document.getElementById('modalBaseSpend').value = Math.round(withGst / 1.18);
      } else {
        document.getElementById('modalBaseSpend').value = '';
      }
    }

    async function saveAdSpend() {
      const date = document.getElementById('modalSpendTargetDate').value;
      const baseSpend = parseFloat(document.getElementById('modalBaseSpend').value || 0);
      const spendWithGST = parseFloat(document.getElementById('modalSpendWithGst').value || 0);

      if (!date) {
        alert('Please select a date.');
        return;
      }

      const saveBtn = document.getElementById('btnSaveSpend');
      saveBtn.innerText = 'Saving...';
      saveBtn.disabled = true;

      try {
        const res = await fetch('/api/spend/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, baseSpend, spendWithGST })
        });
        const data = await res.json();
        if (data.success) {
          closeSpendModal();
          // Reload current and history
          await Promise.all([loadData(currentPreset), loadHistory30Days()]);
        } else {
          alert('Failed to save spend: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Save error: ' + err.message);
      } finally {
        saveBtn.innerText = 'Save Spend';
        saveBtn.disabled = false;
      }
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
    return;
  }

  if (parsedUrl.pathname === '/api/metrics') {
    const preset = parsedUrl.query.preset || 'today';
    try {
      const data = await getLiveMetrics(preset);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (parsedUrl.pathname === '/api/history-30d') {
    try {
      const history = await historyMgr.getDailyHistory30Days();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(history));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (parsedUrl.pathname === '/api/campaigns') {
    const preset = parsedUrl.query.preset || 'today';
    try {
      const meta = new MetaAdsClient();
      const camps = await meta.getCampaigns(preset);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(camps));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, campaigns: [] }));
    }
    return;
  }

  if (parsedUrl.pathname === '/api/spend/update' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { date, baseSpend, spendWithGST } = body;
      if (!date) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Date is required' }));
        return;
      }
      const saved = adSpendStore.setSpend(date, { baseSpend, spendWithGST, isManual: true });
      // Refresh recent cache
      await historyMgr.getDailyHistory30Days();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, saved }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (parsedUrl.pathname === '/api/meta/token' && req.method === 'POST') {
    try {
      const { accessToken } = await parseBody(req);
      if (!accessToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'accessToken is required' }));
        return;
      }
      process.env.META_ACCESS_TOKEN = accessToken;
      const envPath = path.join(config.rootDir, '.env');
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf8');
        if (content.includes('META_ACCESS_TOKEN=')) {
          content = content.replace(/META_ACCESS_TOKEN=.*/g, `META_ACCESS_TOKEN=${accessToken}`);
        } else {
          content += `\nMETA_ACCESS_TOKEN=${accessToken}\n`;
        }
        fs.writeFileSync(envPath, content, 'utf8');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Meta access token updated.' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  MAHEKH LIVE ROAS & EXPENSE COCKPIT STARTED! `);
  console.log(`  Open in browser: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
