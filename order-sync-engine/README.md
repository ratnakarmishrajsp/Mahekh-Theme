# 🚀 Shopify & Shiprocket Order Intelligence Engine

Standalone, lightweight, and high-performance order synchronization, logistics tracking, and RTO analytics engine. Directly integrates **Shopify Admin API** and **Shiprocket API (v2)** without any external CRM dependency.

---

## ⚡ Quick Start

### 1. Configure Credentials
Copy `.env.example` to `.env` inside `order-sync-engine`:
```bash
cp .env.example .env
```
Fill in:
```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-07

SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your_password
```

### 2. Run Full Synchronization & Intelligence Dashboard
```bash
node src/index.js
# Or using npm
npm start
```
This will:
- Fetch all Shopify orders (Unfulfilled, Fulfilled, Cancelled, Archived) with rate-limit protection.
- Authenticate and fetch Shiprocket shipments, live tracking, and NDR alerts.
- Cross-reference Shopify Order # ⟷ Shiprocket AWB.
- Print an **Executive Dashboard** with Gross Revenue, COD vs Prepaid breakdown, Delivery Success Rate %, and RTO Rate %.
- Automatically export an audit report to `exports/orders-audit-[timestamp].csv` and `exports/orders-intelligence-[timestamp].json`.

---

## 🔍 Instant Order Inspector (CLI)

Look up any order instantly by **Phone Number**, **Shopify Order #**, or **Shiprocket AWB**:

```bash
# By Phone Number
node src/cli/inspect.js --phone 9876543210

# By Shopify Order Number
node src/cli/inspect.js --order 1001

# By Shiprocket AWB
node src/cli/inspect.js --awb 141123456789

# Smart auto-detect (pass any value directly):
node src/cli/inspect.js 9876543210
```

---

## 📁 Architecture Overview

```text
order-sync-engine/
├── .env.example              # Environment variables template
├── .env                      # Local secret credentials (git-ignored)
├── package.json              # Project scripts and configuration
├── exports/                  # Automated CSV / JSON audit reports
├── data/                     # Cached token and synchronized state
└── src/
    ├── config.js             # Environment & configuration manager
    ├── index.js              # Master sync runner & executive dashboard
    ├── shopify/
    │   ├── client.js         # Rate-limited REST API client with cursor pagination
    │   └── orders.js         # Order extraction, customer parsing, and financial metrics
    ├── shiprocket/
    │   ├── auth.js           # JWT Bearer token generation & local caching
    │   ├── client.js         # Shiprocket HTTP client
    │   └── tracking.js       # Live tracking, NDR reports, and courier benchmarks
    ├── intelligence/
    │   └── cross-reference.js# Order matching & RTO / Delivery Success rate calculation
    └── cli/
        ├── inspect.js        # Instant single-order inspector CLI
        └── export.js         # CSV & JSON audit exporter
```
