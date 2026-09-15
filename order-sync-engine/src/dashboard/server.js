import http from 'node:http';
import url from 'node:url';
import { getLiveMetrics } from '../cli/live-roas.js';
import { MetaAdsClient } from '../meta/client.js';

const PORT = process.env.PORT || 4040;

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
      --bg-dark: #0b0d11;
      --card-bg: #14171f;
      --card-border: rgba(212, 175, 55, 0.15);
      --card-hover: rgba(212, 175, 55, 0.25);
      --gold: #dfba73;
      --gold-gradient: linear-gradient(135deg, #f3e7c4 0%, #dfba73 50%, #b88a44 100%);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.12);
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.12);
      --blue: #3b82f6;
      --blue-bg: rgba(59, 130, 246, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 24px 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 28px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      background: var(--gold-gradient);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 20px;
      color: #0b0d11;
      box-shadow: 0 4px 20px rgba(223, 186, 115, 0.3);
    }

    .brand-title h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-title p {
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.15); }
    }

    /* Controls */
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .preset-pills {
      display: flex;
      background: #191d26;
      padding: 4px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .preset-btn {
      background: none;
      border: none;
      padding: 8px 16px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .preset-btn.active {
      background: var(--gold-gradient);
      color: #0b0d11;
      box-shadow: 0 2px 10px rgba(223, 186, 115, 0.25);
    }

    .btn-refresh {
      background: #191d26;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-main);
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-refresh:hover {
      background: #222733;
      border-color: var(--gold);
    }

    /* Main Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: var(--card-hover);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .stat-tag.gst {
      background: rgba(223, 186, 115, 0.15);
      color: var(--gold);
    }

    .stat-tag.success {
      background: var(--green-bg);
      color: var(--green);
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }

    .stat-value.gold {
      background: var(--gold-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-value.green {
      color: var(--green);
    }

    .stat-subtext {
      font-size: 12.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Profitability Calculator Section */
    .calculator-panel {
      background: linear-gradient(180deg, #161922 0%, #11131a 100%);
      border: 1px solid rgba(223, 186, 115, 0.25);
      border-radius: 18px;
      padding: 24px 28px;
      margin-bottom: 32px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
    }

    .calc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .calc-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--gold);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .calc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      align-items: center;
    }

    .input-box label {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 6px;
      font-weight: 600;
    }

    .input-box input {
      width: 100%;
      background: #0d0f15;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      outline: none;
      transition: border-color 0.2s;
    }

    .input-box input:focus {
      border-color: var(--gold);
    }

    .profit-output-card {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 14px;
      padding: 16px 20px;
      text-align: right;
    }

    .profit-output-card.loss {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.3);
    }

    .profit-output-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .profit-output-val {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: var(--green);
    }

    .profit-output-val.loss {
      color: var(--red);
    }

    /* Layout Columns */
    .dashboard-split {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
    }

    .panel-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Table Styles */
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .custom-table th {
      text-align: left;
      padding: 10px 12px;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }

    .custom-table td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-active {
      background: var(--green-bg);
      color: var(--green);
    }

    .badge-paused {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }

    .badge-cod {
      background: rgba(223, 186, 115, 0.15);
      color: var(--gold);
    }

    .badge-prepaid {
      background: var(--blue-bg);
      color: var(--blue);
    }

    .truncate {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand-group">
        <div class="brand-logo">M</div>
        <div class="brand-title">
          <h1>MAHEKH LUXURY PERFUMES</h1>
          <p><span class="live-dot"></span> Live Sync: Meta Ads Manager + Shopify Store</p>
        </div>
      </div>

      <div class="controls">
        <div class="preset-pills">
          <button class="preset-btn active" onclick="loadData('today', this)">Today</button>
          <button class="preset-btn" onclick="loadData('yesterday', this)">Yesterday</button>
          <button class="preset-btn" onclick="loadData('last_7d', this)">Last 7 Days</button>
        </div>

        <button class="btn-refresh" id="refreshBtn" onclick="refreshCurrent()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh Live
        </button>
      </div>
    </header>

    <!-- Top Key Metrics Cards -->
    <section class="stats-grid">
      <!-- Card 1: Total Ad Spend (w/ GST) -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Spend (w/ 18% GST)</span>
          <span class="stat-tag gst">Meta + GST</span>
        </div>
        <div class="stat-value gold" id="spendWithGst">₹0</div>
        <div class="stat-subtext">
          <span>Base Ad Spend: <b id="baseSpend" style="color:#fff;">₹0</b></span> • <span>GST: <b id="gstAmount" style="color:#fff;">₹0</b></span>
        </div>
      </div>

      <!-- Card 2: Shopify Revenue -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Shopify Revenue</span>
          <span class="stat-tag success">Verified</span>
        </div>
        <div class="stat-value green" id="shopifyRevenue">₹0</div>
        <div class="stat-subtext">
          <span>COD: <b id="codRev" style="color:#fff;">₹0</b></span> • <span>Prepaid: <b id="prepRev" style="color:#fff;">₹0</b></span>
        </div>
      </div>

      <!-- Card 3: Real Blended ROAS -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Real Blended ROAS</span>
          <span class="stat-tag" id="roasBadge" style="background: rgba(16, 185, 129, 0.15); color: var(--green);">Gross</span>
        </div>
        <div class="stat-value" id="blendedRoas">0.00x</div>
        <div class="stat-subtext">
          Revenue ÷ Total Ad Spend with GST
        </div>
      </div>

      <!-- Card 4: Orders & Cost Per Order -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Orders & CPO</span>
          <span class="stat-tag" style="background: rgba(59, 130, 246, 0.15); color: var(--blue);">Shipments</span>
        </div>
        <div class="stat-value" id="ordersCount">0</div>
        <div class="stat-subtext">
          Cost Per Order: <b id="costPerOrder" style="color:#fff;">₹0</b> • AOV: <b id="aovVal" style="color:#fff;">₹0</b>
        </div>
      </div>
    </section>

    <!-- Profitability & In-Hand Cashflow Calculator -->
    <section class="calculator-panel">
      <div class="calc-header">
        <div class="calc-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M12 15h0M17 15h0M7 11h0M12 11h0M17 11h0M7 7h10"/></svg>
          In-Hand Net Profit Estimator (Live Calculator)
        </div>
        <span style="font-size: 12px; color: var(--text-muted);">Adjust values below to compute instant net profit</span>
      </div>

      <div class="calc-grid">
        <div class="input-box">
          <label>Product Cost (COGS) / Bottle (₹)</label>
          <input type="number" id="cogsInput" value="180" oninput="recalcProfit()">
        </div>

        <div class="input-box">
          <label>Shipping Cost / Order (₹)</label>
          <input type="number" id="shippingInput" value="70" oninput="recalcProfit()">
        </div>

        <div class="input-box">
          <label>Expected RTO Rate (%)</label>
          <input type="number" id="rtoInput" value="20" oninput="recalcProfit()">
        </div>

        <div class="profit-output-card" id="profitBox">
          <div class="profit-output-label">ESTIMATED NET PROFIT</div>
          <div class="profit-output-val" id="netProfitVal">₹0</div>
          <div style="font-size: 11.5px; color: var(--text-muted);" id="netMarginPercent">Margin: 0%</div>
        </div>
      </div>
    </section>

    <!-- Lower Split: Campaigns Breakdown vs Today's Live Orders -->
    <div class="dashboard-split">
      <!-- Active Campaigns Table -->
      <div class="panel">
        <div class="panel-title">
          <span>Meta Campaigns Breakdown</span>
          <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);" id="campCount">0 Campaigns</span>
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
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading campaigns...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Live Shopify Orders Feed -->
      <div class="panel">
        <div class="panel-title">
          <span>Today's Verified Orders</span>
          <span style="font-size: 12px; font-weight: 500; color: var(--gold);" id="orderStatusCount">Live Stream</span>
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
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentPreset = 'today';
    let globalData = null;

    async function loadData(preset, btnElem) {
      currentPreset = preset;
      if (btnElem) {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
      }

      const refreshBtn = document.getElementById('refreshBtn');
      refreshBtn.style.opacity = '0.5';

      try {
        const [resMetrics, resCamps] = await Promise.all([
          fetch('/api/metrics?preset=' + preset).then(r => r.json()),
          fetch('/api/campaigns?preset=' + preset).then(r => r.json())
        ]);

        globalData = resMetrics;
        renderMetrics(resMetrics);
        renderCampaigns(resCamps);
        recalcProfit();
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        refreshBtn.style.opacity = '1';
      }
    }

    function refreshCurrent() {
      loadData(currentPreset);
    }

    function renderMetrics(data) {
      document.getElementById('spendWithGst').innerText = '₹' + Math.round(data.meta.spendWithGST).toLocaleString('en-IN');
      document.getElementById('baseSpend').innerText = '₹' + Math.round(data.meta.baseSpend).toLocaleString('en-IN');
      document.getElementById('gstAmount').innerText = '₹' + Math.round(data.meta.gstAmount).toLocaleString('en-IN');

      document.getElementById('shopifyRevenue').innerText = '₹' + Math.round(data.shopify.totalSales).toLocaleString('en-IN');
      document.getElementById('codRev').innerText = '₹' + Math.round(data.shopify.codSales).toLocaleString('en-IN');
      document.getElementById('prepRev').innerText = '₹' + Math.round(data.shopify.prepaidSales).toLocaleString('en-IN');

      const roasElem = document.getElementById('blendedRoas');
      roasElem.innerText = data.blended.grossRoas + 'x';
      if (data.blended.grossRoas >= 3.0) {
        roasElem.style.color = 'var(--green)';
      } else if (data.blended.grossRoas >= 2.0) {
        roasElem.style.color = 'var(--gold)';
      } else {
        roasElem.style.color = 'var(--red)';
      }

      document.getElementById('ordersCount').innerText = data.shopify.totalOrders + ' Orders';
      document.getElementById('costPerOrder').innerText = '₹' + Math.round(data.blended.costPerOrder).toLocaleString('en-IN');
      document.getElementById('aovVal').innerText = '₹' + Math.round(data.shopify.aov).toLocaleString('en-IN');

      // Orders Feed
      const ordersBody = document.getElementById('ordersBody');
      if (data.shopify.orders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No orders in this period</td></tr>';
      } else {
        ordersBody.innerHTML = data.shopify.orders.map(o => \`
          <tr>
            <td><b>\${o.name}</b></td>
            <td><div class="truncate">\${o.customerName}</div></td>
            <td><span style="color:var(--text-muted)">\${o.city || 'India'}</span></td>
            <td><span class="badge \${o.payment_mode === 'COD' ? 'badge-cod' : 'badge-prepaid'}">\${o.payment_mode}</span></td>
            <td><b>₹\${Math.round(o.total_price)}</b></td>
          </tr>
        \`).join('');
      }
    }

    function renderCampaigns(campaigns) {
      const campBody = document.getElementById('campaignsBody');
      const activeOrSpent = campaigns.filter(c => c.spendWithGST > 0 || c.effective_status === 'ACTIVE');
      document.getElementById('campCount').innerText = activeOrSpent.length + ' Active/Running';

      if (activeOrSpent.length === 0) {
        campBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No active campaigns found.</td></tr>';
        return;
      }

      campBody.innerHTML = activeOrSpent.map(c => \`
        <tr>
          <td><div class="truncate" title="\${c.name}"><b>\${c.name}</b></div></td>
          <td><span class="badge \${c.effective_status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}">\${c.effective_status}</span></td>
          <td>\${c.daily_budget ? '₹' + c.daily_budget : 'CBO/AdSet'}</td>
          <td><b>₹\${Math.round(c.spendWithGST)}</b></td>
          <td>\${c.purchases}</td>
          <td><b>\${c.metaRoas.toFixed(2)}x</b></td>
        </tr>
      \`).join('');
    }

    function recalcProfit() {
      if (!globalData) return;

      const cogs = parseFloat(document.getElementById('cogsInput').value || 0);
      const shipping = parseFloat(document.getElementById('shippingInput').value || 0);
      const rtoPercent = parseFloat(document.getElementById('rtoInput').value || 0) / 100;

      const totalSales = globalData.shopify.totalSales;
      const orders = globalData.shopify.totalOrders;
      const spendWithGST = globalData.meta.spendWithGST;

      // Estimated delivered orders
      const deliveredOrders = orders * (1 - rtoPercent);
      const effectiveSales = totalSales * (1 - rtoPercent);

      // Costs
      const totalCogs = deliveredOrders * cogs;
      const totalShipping = orders * shipping; // Shipping charged on all dispatched
      const rtoReverseCost = (orders * rtoPercent) * (shipping * 0.7); // Reverse shipment cost

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

    // Auto-load on page load
    loadData('today');

    // Auto-refresh every 2 minutes
    setInterval(() => {
      loadData(currentPreset);
    }, 120000);
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Dashboard HTML Page
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
    return;
  }

  // API Endpoint: Live Metrics
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

  // API Endpoint: Campaigns
  if (parsedUrl.pathname === '/api/campaigns') {
    const preset = parsedUrl.query.preset || 'today';
    try {
      const meta = new MetaAdsClient();
      const camps = await meta.getCampaigns(preset);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(camps));
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
