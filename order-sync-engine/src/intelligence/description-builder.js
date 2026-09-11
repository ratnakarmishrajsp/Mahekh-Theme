import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const outputDir = path.join(workspaceRoot, 'descriptions');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// -------------------------------------------------------------
// HTML GENERATOR TEMPLATES (Mobile Full-Bleed Edge-to-Edge)
// -------------------------------------------------------------

function buildAttarSingleHtml(item) {
  const pId = item.id;
  const theme = item.theme || {
    bgBase: '#090a0e',
    bgCard: '#11131a',
    borderColor: '#222533',
    gold: '#d4af37',
    goldLight: '#fae8a4',
    accentGlow: 'rgba(212, 175, 55, 0.4)'
  };

  return `<div class="mh-attar-${pId}-wrapper">
  <!-- Google Fonts Import -->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    .mh-attar-${pId}-wrapper {
      --gold: ${theme.gold};
      --gold-light: ${theme.goldLight};
      --bg-base: ${theme.bgBase};
      --bg-card: ${theme.bgCard};
      --border-color: ${theme.borderColor};
      --text-main: #f5f5f7;
      --text-muted: #9c9ca8;
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

      background-color: var(--bg-base);
      color: var(--text-main);
      padding: 3rem 1.5rem;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1.5rem 0;
      box-sizing: border-box;
      line-height: 1.8;
      font-family: var(--font-body);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), inset 0 0 0 1px var(--border-color);
    }

    .mh-attar-${pId}-wrapper *,
    .mh-attar-${pId}-wrapper *::before,
    .mh-attar-${pId}-wrapper *::after {
      box-sizing: inherit;
    }

    /* FULL WIDTH MOBILE BREAKOUT: Zero margin gaps on mobile phones */
    @media (max-width: 768px) {
      .mh-attar-${pId}-wrapper {
        margin-left: -1.5rem !important;
        margin-right: -1.5rem !important;
        width: calc(100% + 3rem) !important;
        max-width: calc(100% + 3rem) !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        padding: 2.2rem 1.15rem !important;
        box-shadow: none !important;
      }
    }

    @keyframes mhAttarGlow_${pId} {
      0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); border-color: var(--gold); }
      50% { box-shadow: 0 0 26px var(--gold-light); border-color: #fff; }
    }

    .mh-top-bar-${pId} {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(212,175,55,0.08) 100%);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      text-align: center;
      margin-bottom: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      animation: mhAttarGlow_${pId} 3.5s infinite ease-in-out;
      width: 100%;
    }

    .mh-top-tag-${pId} {
      background: linear-gradient(90deg, #ffd700, #ffae19, #ffd700);
      color: #000;
      font-weight: 800;
      font-size: 0.85rem;
      text-transform: uppercase;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .mh-top-title-${pId} {
      font-weight: 700;
      font-size: 1.05rem;
      color: #fff;
      letter-spacing: 0.04em;
    }

    .mh-hero-${pId} {
      text-align: center;
      margin-bottom: 3rem;
      padding: 0 0.5rem;
    }

    .mh-badge-${pId} {
      display: inline-block;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 0.95rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      margin-bottom: 0.85rem;
    }

    .mh-title-${pId} {
      font-family: var(--font-heading);
      font-size: clamp(2.1rem, 6vw, 3.4rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 1.2rem;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .mh-title-${pId} span {
      background: linear-gradient(135deg, #fff 0%, var(--gold-light) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mh-subtitle-${pId} {
      font-size: clamp(1.05rem, 3vw, 1.25rem);
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 1.8rem;
      font-weight: 400;
      line-height: 1.7;
    }

    .mh-badges-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 2.8rem;
      width: 100%;
    }

    .mh-badge-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem 0.85rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .mh-badge-card-${pId}:hover {
      border-color: var(--gold);
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(212, 175, 55, 0.25);
    }

    .mh-badge-icon-${pId} {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .mh-badge-text-${pId} {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mh-story-${pId} {
      background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.4) 100%);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--gold);
      border-radius: 14px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-story-heading-${pId} {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      color: var(--gold-light);
      margin: 0 0 1rem;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mh-story-p-${pId} {
      color: #dedee6;
      font-size: 1.08rem;
      margin: 0 0 1.2rem;
      line-height: 1.8;
    }

    .mh-story-p-${pId}:last-child {
      margin-bottom: 0;
    }

    .mh-pyramid-section-${pId} {
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-section-title-${pId} {
      text-align: center;
      font-family: var(--font-heading);
      font-size: clamp(1.8rem, 4.5vw, 2.4rem);
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .mh-section-desc-${pId} {
      text-align: center;
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 2.2rem;
    }

    .mh-notes-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      width: 100%;
    }

    .mh-note-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.85rem 1.35rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .mh-note-card-${pId}::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    .mh-note-tier-${pId} {
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--gold);
      margin-bottom: 0.6rem;
      display: block;
    }

    .mh-note-name-${pId} {
      font-family: var(--font-heading);
      font-size: 1.45rem;
      color: #fff;
      margin: 0 0 0.75rem;
    }

    .mh-note-desc-${pId} {
      color: #b0b0bc;
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.65;
    }

    /* Comparison Box */
    .mh-comparison-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
      overflow-x: auto;
    }

    .mh-table-${pId} {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 1.5rem;
      font-size: 0.95rem;
    }

    .mh-table-${pId} th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--gold-light);
      padding: 1.1rem 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 2px solid var(--gold);
    }

    .mh-table-${pId} td {
      padding: 1.05rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #e2e2e8;
    }

    .mh-table-${pId} tr:hover td {
      background: rgba(212, 175, 55, 0.04);
    }

    .mh-table-${pId} td.highlight {
      color: var(--gold-light);
      font-weight: 700;
    }

    .mh-table-${pId} td.dim {
      color: #7b7b8a;
    }

    /* Features Grid */
    .mh-features-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-features-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 22px;
      margin-top: 1.8rem;
    }

    .mh-feature-item-${pId} {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .mh-feature-check-${pId} {
      color: var(--gold);
      font-size: 1.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .mh-feature-text-${pId} h4 {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      color: #fff;
      font-weight: 700;
    }

    .mh-feature-text-${pId} p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Application Ritual Guide */
    .mh-how-to-${pId} {
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.3) 100%);
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-steps-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 18px;
      margin-top: 1.8rem;
    }

    .mh-step-${pId} {
      text-align: center;
      padding: 1.5rem 1.15rem;
      background: rgba(255, 255, 255, 0.025);
      border-radius: 14px;
      border: 1px dashed rgba(212, 175, 55, 0.35);
    }

    .mh-step-num-${pId} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--gold);
      color: #000;
      font-weight: 800;
      font-size: 1.1rem;
      margin-bottom: 0.85rem;
    }

    .mh-step-${pId} h5 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #fff;
    }

    .mh-step-${pId} p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Occasion Strip */
    .mh-occasions-${pId} {
      background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.3) 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-occ-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 1.5rem;
    }

    .mh-occ-item-${pId} {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 12px;
      padding: 1.15rem 1rem;
      text-align: center;
    }

    .mh-occ-icon-${pId} {
      font-size: 1.7rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .mh-occ-title-${pId} {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .mh-occ-sub-${pId} {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Guarantee & Trust Strip */
    .mh-guarantee-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
      border: 2px solid var(--gold);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      text-align: center;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .mh-guarantee-${pId} h3 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      color: var(--gold-light);
      margin: 0 0 0.6rem;
    }

    .mh-guarantee-${pId} p {
      color: #e2e2e8;
      font-size: 1.05rem;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.7;
    }

    @media (max-width: 600px) {
      .mh-top-bar-${pId} {
        flex-direction: column;
        gap: 8px;
        padding: 0.9rem 1rem;
      }
      .mh-top-title-${pId} {
        font-size: 0.95rem;
      }
      .mh-badges-grid-${pId} {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .mh-badge-card-${pId} {
        padding: 1rem 0.6rem;
      }
      .mh-notes-grid-${pId},
      .mh-steps-${pId},
      .mh-occ-grid-${pId} {
        grid-template-columns: 1fr;
      }
      .mh-story-${pId},
      .mh-comparison-${pId},
      .mh-features-${pId},
      .mh-how-to-${pId},
      .mh-occasions-${pId},
      .mh-guarantee-${pId} {
        padding: 1.75rem 1.2rem;
      }
    }
  </style>

  <!-- Top Announcement Bar -->
  <div class="mh-top-bar-${pId}">
    <span class="mh-top-tag-${pId}">${item.topTag || '👑 Royal Heritage'}</span>
    <span class="mh-top-title-${pId}">${item.topBarTitle || '100% Pure Concentrated Perfume Oil | Alcohol-Free'}</span>
  </div>

  <!-- Hero Section -->
  <div class="mh-hero-${pId}">
    <div class="mh-badge-${pId}">✦ ${item.badge || 'Artisanal Fragrance Oil'} ✦</div>
    <h1 class="mh-title-${pId}">${item.displayTitle}</h1>
    <p class="mh-subtitle-${pId}">${item.subtitle}</p>
  </div>

  <!-- Performance Badges Grid -->
  <div class="mh-badges-grid-${pId}">
    <div class="mh-badge-card-${pId}">
      <span class="mh-badge-icon-${pId}">${item.badges?.[0]?.icon || '⏳'}</span>
      <span class="mh-badge-text-${pId}">${item.badges?.[0]?.text || '24H–72H Stay'}</span>
    </div>
    <div class="mh-badge-card-${pId}">
      <span class="mh-badge-icon-${pId}">${item.badges?.[1]?.icon || '🌿'}</span>
      <span class="mh-badge-text-${pId}">${item.badges?.[1]?.text || '100% Alcohol-Free'}</span>
    </div>
    <div class="mh-badge-card-${pId}">
      <span class="mh-badge-icon-${pId}">${item.badges?.[2]?.icon || '💎'}</span>
      <span class="mh-badge-text-${pId}">${item.badges?.[2]?.text || 'Undiluted Pure Oil'}</span>
    </div>
    <div class="mh-badge-card-${pId}">
      <span class="mh-badge-icon-${pId}">${item.badges?.[3]?.icon || '🔥'}</span>
      <span class="mh-badge-text-${pId}">${item.badges?.[3]?.text || 'Intense Sillage'}</span>
    </div>
  </div>

  <!-- Olfactory Storytelling -->
  <div class="mh-story-${pId}">
    <h3 class="mh-story-heading-${pId}">${item.storyHeading || '✨ The Essence of Elegance'}</h3>
    <p class="mh-story-p-${pId}">${item.storyP1}</p>
    <p class="mh-story-p-${pId}">${item.storyP2}</p>
  </div>

  <!-- Fragrance Notes Architecture (Pyramid) -->
  <div class="mh-pyramid-section-${pId}">
    <h3 class="mh-section-title-${pId}">The Olfactory Pyramid</h3>
    <p class="mh-section-desc-${pId}">Traditional Deg-Bhapka hydro-distillation of pure botanicals</p>

    <div class="mh-notes-grid-${pId}">
      <div class="mh-note-card-${pId}">
        <span class="mh-note-tier-${pId}">Top Notes • Opening Rush</span>
        <h4 class="mh-note-name-${pId}">${item.notes?.topName || 'Opening Aura'}</h4>
        <p class="mh-note-desc-${pId}">${item.notes?.topDesc || 'A captivating burst that awakens the senses.'}</p>
      </div>

      <div class="mh-note-card-${pId}">
        <span class="mh-note-tier-${pId}">Heart Notes • Core Essence</span>
        <h4 class="mh-note-name-${pId}">${item.notes?.heartName || 'Heart Accord'}</h4>
        <p class="mh-note-desc-${pId}">${item.notes?.heartDesc || 'The signature character that evolves beautifully with body warmth.'}</p>
      </div>

      <div class="mh-note-card-${pId}">
        <span class="mh-note-tier-${pId}">Base Notes • Eternal Sillage</span>
        <h4 class="mh-note-name-${pId}">${item.notes?.baseName || 'Drydown Base'}</h4>
        <p class="mh-note-desc-${pId}">${item.notes?.baseDesc || 'A deep, balsamic foundation that clings to clothes for days.'}</p>
      </div>
    </div>
  </div>

  <!-- Comparison Box -->
  <div class="mh-comparison-${pId}">
    <h3 class="mh-section-title-${pId}" style="margin-bottom: 0.5rem;">Why Mahekh Attar &gt; Commercial Sprays?</h3>
    <p class="mh-section-desc-${pId}" style="margin-bottom: 1.2rem;">Authentic royal perfume craft without harsh chemicals</p>

    <table class="mh-table-${pId}">
      <thead>
        <tr>
          <th>Feature</th>
          <th>👑 Mahekh Pure Attar</th>
          <th>💨 Regular Spray Perfume</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Alcohol Content</strong></td>
          <td class="highlight">❌ 100% Alcohol-Free</td>
          <td class="dim">✔️ 80–90% Alcohol</td>
        </tr>
        <tr>
          <td><strong>Longevity</strong></td>
          <td class="highlight">🕰️ 24–72 Hours on Clothes</td>
          <td class="dim">⏳ 2–4 Hours Fade</td>
        </tr>
        <tr>
          <td><strong>Concentration</strong></td>
          <td class="highlight">💎 100% Pure Perfume Oil</td>
          <td class="dim">🌫️ Diluted Synthetic Gas</td>
        </tr>
        <tr>
          <td><strong>Skin Safety</strong></td>
          <td class="highlight">🌿 Non-Drying, Gentle &amp; Pure</td>
          <td class="dim">⚠️ Can Burn or Dry Skin</td>
        </tr>
        <tr>
          <td><strong>Dosage Required</strong></td>
          <td class="highlight">👌 1–2 Drops Are Enough</td>
          <td class="dim">🔄 6–8 Heavy Sprays</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Features & Specifications -->
  <div class="mh-features-${pId}">
    <h3 class="mh-section-title-${pId}" style="margin-bottom: 0.5rem;">Why This Attar is Irreplaceable</h3>
    <p class="mh-section-desc-${pId}" style="margin-bottom: 1.5rem;">Crafted without dilution, chemicals, or synthetic stabilizers</p>

    <div class="mh-features-grid-${pId}">
      <div class="mh-feature-item-${pId}">
        <span class="mh-feature-check-${pId}">✔</span>
        <div class="mh-feature-text-${pId}">
          <h4>100% Alcohol-Free &amp; Halal</h4>
          <p>Pure perfume oil ideal for Namaz, Pooja, temple rituals, and sacred occasions.</p>
        </div>
      </div>
      <div class="mh-feature-item-${pId}">
        <span class="mh-feature-check-${pId}">✔</span>
        <div class="mh-feature-text-${pId}">
          <h4>Beast-Mode Fabric Longevity</h4>
          <p>Binds securely to natural fibers, radiating a warm scent trail for days.</p>
        </div>
      </div>
      <div class="mh-feature-item-${pId}">
        <span class="mh-feature-check-${pId}">✔</span>
        <div class="mh-feature-text-${pId}">
          <h4>No Harsh Chemicals or Headaches</h4>
          <p>Gentle on sensitive noses with zero artificial spirit pungency.</p>
        </div>
      </div>
      <div class="mh-feature-item-${pId}">
        <span class="mh-feature-check-${pId}">✔</span>
        <div class="mh-feature-text-${pId}">
          <h4>Precision Glass Applicator</h4>
          <p>Comes in a luxury bottle with a glass wand for clean, effortless dabbing.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Occasion Grid -->
  <div class="mh-occasions-${pId}">
    <h3 class="mh-section-title-${pId}" style="margin-bottom: 0.5rem;">When to Wear</h3>
    <p class="mh-section-desc-${pId}" style="margin-bottom: 0;">Tailored for your most memorable moments</p>

    <div class="mh-occ-grid-${pId}">
      <div class="mh-occ-item-${pId}">
        <span class="mh-occ-icon-${pId}">${item.occasions?.[0]?.icon || '🕌'}</span>
        <div class="mh-occ-title-${pId}">${item.occasions?.[0]?.title || 'Spiritual & Sacred'}</div>
        <div class="mh-occ-sub-${pId}">${item.occasions?.[0]?.sub || 'Prayers, Namaz & Pooja'}</div>
      </div>
      <div class="mh-occ-item-${pId}">
        <span class="mh-occ-icon-${pId}">${item.occasions?.[1]?.icon || '👔'}</span>
        <div class="mh-occ-title-${pId}">${item.occasions?.[1]?.title || 'Daily Signature'}</div>
        <div class="mh-occ-sub-${pId}">${item.occasions?.[1]?.sub || 'Office & Formal Meetings'}</div>
      </div>
      <div class="mh-occ-item-${pId}">
        <span class="mh-occ-icon-${pId}">${item.occasions?.[2]?.icon || '🌙'}</span>
        <div class="mh-occ-title-${pId}">${item.occasions?.[2]?.title || 'Evening Events'}</div>
        <div class="mh-occ-sub-${pId}">${item.occasions?.[2]?.sub || 'Weddings & Celebrations'}</div>
      </div>
      <div class="mh-occ-item-${pId}">
        <span class="mh-occ-icon-${pId}">${item.occasions?.[3]?.icon || '🎁'}</span>
        <div class="mh-occ-title-${pId}">${item.occasions?.[3]?.title || 'Royal Gifting'}</div>
        <div class="mh-occ-sub-${pId}">${item.occasions?.[3]?.sub || 'A Precious Present'}</div>
      </div>
    </div>
  </div>

  <!-- Application Ritual Guide -->
  <div class="mh-how-to-${pId}">
    <h3 class="mh-section-title-${pId}" style="margin-bottom: 0.5rem;">The Royal Application Ritual</h3>
    <p class="mh-section-desc-${pId}">Unlocking optimal depth and scent projection</p>

    <div class="mh-steps-${pId}">
      <div class="mh-step-${pId}">
        <span class="mh-step-num-${pId}">1</span>
        <h5>One Pure Drop</h5>
        <p>Take one drop using the glass wand directly on your inner wrist pulse points.</p>
      </div>
      <div class="mh-step-${pId}">
        <span class="mh-step-num-${pId}">2</span>
        <h5>Tap, Don't Rub</h5>
        <p>Gently dab wrists together, then touch the sides of your neck and collarbone.</p>
      </div>
      <div class="mh-step-${pId}">
        <span class="mh-step-num-${pId}">3</span>
        <h5>Fabric Touch</h5>
        <p>Gently swipe across collars, sleeves, or shawls for multi-day persistence.</p>
      </div>
    </div>
  </div>

  <!-- Guarantee & Trust Strip -->
  <div class="mh-guarantee-${pId}">
    <h3>👑 Authentic Distillation Guarantee</h3>
    <p>
      100% pure undiluted perfume oil distilled with traditional artisanal care. Backed by Cash on Delivery (COD) across India and damage-free luxury packaging.
    </p>
  </div>
</div>`;
}

// -------------------------------------------------------------
// COMBO PACK HTML GENERATOR
// -------------------------------------------------------------

function buildComboPackHtml(item) {
  const pId = item.id;
  const theme = item.theme || {
    bgBase: '#0b0c12',
    bgCard: '#131520',
    borderColor: '#24283b',
    gold: '#d4af37',
    goldLight: '#fae8a4',
  };

  return `<div class="mh-combo-${pId}-wrapper">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    .mh-combo-${pId}-wrapper {
      --gold: ${theme.gold};
      --gold-light: ${theme.goldLight};
      --bg-base: ${theme.bgBase};
      --bg-card: ${theme.bgCard};
      --border-color: ${theme.borderColor};
      --text-main: #f5f5f7;
      --text-muted: #9c9ca8;
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

      background-color: var(--bg-base);
      color: var(--text-main);
      padding: 3rem 1.5rem;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1.5rem 0;
      box-sizing: border-box;
      line-height: 1.8;
      font-family: var(--font-body);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 0 0 1px var(--border-color);
    }

    .mh-combo-${pId}-wrapper *,
    .mh-combo-${pId}-wrapper *::before,
    .mh-combo-${pId}-wrapper *::after {
      box-sizing: inherit;
    }

    @media (max-width: 768px) {
      .mh-combo-${pId}-wrapper {
        margin-left: -1.5rem !important;
        margin-right: -1.5rem !important;
        width: calc(100% + 3rem) !important;
        max-width: calc(100% + 3rem) !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        padding: 2.2rem 1.15rem !important;
        box-shadow: none !important;
      }
    }

    .mh-c-top-bar-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.03) 100%);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      text-align: center;
      margin-bottom: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }

    .mh-c-top-tag-${pId} {
      background: linear-gradient(90deg, #ffd700, #ffae19, #ffd700);
      color: #000;
      font-weight: 800;
      font-size: 0.85rem;
      text-transform: uppercase;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .mh-c-top-title-${pId} {
      font-weight: 700;
      font-size: 1.05rem;
      color: #fff;
      letter-spacing: 0.04em;
    }

    .mh-c-hero-${pId} {
      text-align: center;
      margin-bottom: 3rem;
      padding: 0 0.5rem;
    }

    .mh-c-badge-${pId} {
      display: inline-block;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 0.95rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      margin-bottom: 0.85rem;
    }

    .mh-c-title-${pId} {
      font-family: var(--font-heading);
      font-size: clamp(2.1rem, 6vw, 3.4rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 1.2rem;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .mh-c-title-${pId} span {
      background: linear-gradient(135deg, #fff 0%, var(--gold-light) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mh-c-subtitle-${pId} {
      font-size: clamp(1.05rem, 3vw, 1.25rem);
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 1.8rem;
      font-weight: 400;
      line-height: 1.7;
    }

    .mh-c-badges-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 2.8rem;
      width: 100%;
    }

    .mh-c-badge-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem 0.85rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .mh-c-badge-card-${pId}:hover {
      border-color: var(--gold);
      transform: translateY(-4px);
    }

    .mh-c-badge-icon-${pId} {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .mh-c-badge-text-${pId} {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mh-c-bottles-section-${pId} {
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-c-section-title-${pId} {
      text-align: center;
      font-family: var(--font-heading);
      font-size: clamp(1.8rem, 4.5vw, 2.4rem);
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .mh-c-section-desc-${pId} {
      text-align: center;
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 2.2rem;
    }

    .mh-c-bottles-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      width: 100%;
    }

    .mh-c-bottle-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.85rem 1.4rem;
      position: relative;
      border-top: 3px solid var(--gold);
    }

    .mh-c-bottle-num-${pId} {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.5rem;
      display: block;
    }

    .mh-c-bottle-title-${pId} {
      font-family: var(--font-heading);
      font-size: 1.4rem;
      color: #fff;
      margin: 0 0 0.8rem;
    }

    .mh-c-bottle-desc-${pId} {
      color: #b0b0bc;
      font-size: 0.95rem;
      line-height: 1.65;
      margin: 0;
    }

    /* Comparison / Value Box */
    .mh-c-value-box-${pId} {
      background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.3) 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-c-value-table-${pId} {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 1.5rem;
      font-size: 0.95rem;
    }

    .mh-c-value-table-${pId} th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--gold-light);
      padding: 1.1rem 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 2px solid var(--gold);
    }

    .mh-c-value-table-${pId} td {
      padding: 1.05rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #e2e2e8;
    }

    .mh-c-value-table-${pId} td.highlight {
      color: var(--gold-light);
      font-weight: 700;
    }

    .mh-c-value-table-${pId} td.dim {
      color: #7b7b8a;
    }

    /* Guarantee */
    .mh-c-guarantee-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
      border: 2px solid var(--gold);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      text-align: center;
      width: 100%;
    }

    .mh-c-guarantee-${pId} h3 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      color: var(--gold-light);
      margin: 0 0 0.6rem;
    }

    .mh-c-guarantee-${pId} p {
      color: #e2e2e8;
      font-size: 1.05rem;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.7;
    }

    @media (max-width: 600px) {
      .mh-c-top-bar-${pId} {
        flex-direction: column;
        gap: 8px;
        padding: 0.9rem 1rem;
      }
      .mh-c-badges-grid-${pId} {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .mh-c-bottles-grid-${pId} {
        grid-template-columns: 1fr;
      }
      .mh-c-value-box-${pId},
      .mh-c-guarantee-${pId} {
        padding: 1.75rem 1.2rem;
      }
    }
  </style>

  <div class="mh-c-top-bar-${pId}">
    <span class="mh-c-top-tag-${pId}">${item.topTag || '👑 Royal Heritage Combo'}</span>
    <span class="mh-c-top-title-${pId}">${item.topBarTitle || 'Multi-Fragrance Wardrobe | 100% Pure Alcohol-Free Oils'}</span>
  </div>

  <div class="mh-c-hero-${pId}">
    <div class="mh-c-badge-${pId}">✦ ${item.badge || 'Curated Collectors Edition'} ✦</div>
    <h1 class="mh-c-title-${pId}">${item.displayTitle}</h1>
    <p class="mh-c-subtitle-${pId}">${item.subtitle}</p>
  </div>

  <div class="mh-c-badges-grid-${pId}">
    <div class="mh-c-badge-card-${pId}">
      <span class="mh-c-badge-icon-${pId}">👑</span>
      <span class="mh-c-badge-text-${pId}">Multi-Scent Wardrobe</span>
    </div>
    <div class="mh-c-badge-card-${pId}">
      <span class="mh-c-badge-icon-${pId}">🌿</span>
      <span class="mh-c-badge-text-${pId}">100% Alcohol-Free</span>
    </div>
    <div class="mh-c-badge-card-${pId}">
      <span class="mh-c-badge-icon-${pId}">💰</span>
      <span class="mh-c-badge-text-${pId}">Mega Value Savings</span>
    </div>
    <div class="mh-c-badge-card-${pId}">
      <span class="mh-c-badge-icon-${pId}">🎁</span>
      <span class="mh-c-badge-text-${pId}">Luxury Gift Ready</span>
    </div>
  </div>

  <!-- What's Inside Section -->
  <div class="mh-c-bottles-section-${pId}">
    <h3 class="mh-c-section-title-${pId}">What's Inside This Royal Set</h3>
    <p class="mh-c-section-desc-${pId}">Hand-poured pure attar perfume oils for every mood and occasion</p>

    <div class="mh-c-bottles-grid-${pId}">
      ${(item.bottles || []).map((b, idx) => `
        <div class="mh-c-bottle-card-${pId}">
          <span class="mh-c-bottle-num-${pId}">Fragrance 0${idx + 1}</span>
          <h4 class="mh-c-bottle-title-${pId}">${b.name}</h4>
          <p class="mh-c-bottle-desc-${pId}">${b.desc}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Value & Comparison -->
  <div class="mh-c-value-box-${pId}">
    <h3 class="mh-c-section-title-${pId}" style="margin-bottom: 0.5rem;">Why Choose This Combo?</h3>
    <p class="mh-c-section-desc-${pId}" style="margin-bottom: 1.2rem;">Better variety, maximum savings, and royal versatility</p>

    <table class="mh-c-value-table-${pId}">
      <thead>
        <tr>
          <th>Benefit</th>
          <th>👑 Mahekh Combo Set</th>
          <th>💨 Buying Separately</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cost Efficiency</strong></td>
          <td class="highlight">🔥 Up to 50% Off Bundle Price</td>
          <td class="dim">💸 Higher Individual MRP</td>
        </tr>
        <tr>
          <td><strong>Fragrance Wardrobe</strong></td>
          <td class="highlight">✨ Switch Scent as per Occasion</td>
          <td class="dim">❌ Single Scent Only</td>
        </tr>
        <tr>
          <td><strong>Gifting Value</strong></td>
          <td class="highlight">🎁 Imperial Gift Presentation</td>
          <td class="dim">📦 Standard Packing</td>
        </tr>
        <tr>
          <td><strong>Alcohol-Free Purity</strong></td>
          <td class="highlight">🌿 100% Pure Undiluted Oils</td>
          <td class="dim">⚠️ Varies</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Guarantee -->
  <div class="mh-c-guarantee-${pId}">
    <h3>👑 Authentic Distillation & Safe Transit Guarantee</h3>
    <p>
      Every bottle in this combo set is individual sealed and cushion-packed for 100% damage-free delivery. Backed by Cash on Delivery (COD) across India.
    </p>
  </div>
</div>`;
}

// -------------------------------------------------------------
// EAU DE PARFUM (50ML) HTML GENERATOR
// -------------------------------------------------------------

function buildEdpHtml(item) {
  const pId = item.id;
  const theme = item.theme || {
    bgBase: '#0a0a0f',
    bgCard: '#13131c',
    borderColor: '#232332',
    gold: '#d4af37',
    goldLight: '#fae8a4',
  };

  return `<div class="mh-edp-${pId}-wrapper">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    .mh-edp-${pId}-wrapper {
      --gold: ${theme.gold};
      --gold-light: ${theme.goldLight};
      --bg-base: ${theme.bgBase};
      --bg-card: ${theme.bgCard};
      --border-color: ${theme.borderColor};
      --text-main: #f5f5f7;
      --text-muted: #9c9ca8;
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

      background-color: var(--bg-base);
      color: var(--text-main);
      padding: 3rem 1.5rem;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1.5rem 0;
      box-sizing: border-box;
      line-height: 1.8;
      font-family: var(--font-body);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 0 0 1px var(--border-color);
    }

    .mh-edp-${pId}-wrapper *,
    .mh-edp-${pId}-wrapper *::before,
    .mh-edp-${pId}-wrapper *::after {
      box-sizing: inherit;
    }

    @media (max-width: 768px) {
      .mh-edp-${pId}-wrapper {
        margin-left: -1.5rem !important;
        margin-right: -1.5rem !important;
        width: calc(100% + 3rem) !important;
        max-width: calc(100% + 3rem) !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        padding: 2.2rem 1.15rem !important;
        box-shadow: none !important;
      }
    }

    .mh-e-top-bar-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0.02) 100%);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      text-align: center;
      margin-bottom: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }

    .mh-e-top-tag-${pId} {
      background: linear-gradient(90deg, #ffd700, #ffae19, #ffd700);
      color: #000;
      font-weight: 800;
      font-size: 0.85rem;
      text-transform: uppercase;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .mh-e-top-title-${pId} {
      font-weight: 700;
      font-size: 1.05rem;
      color: #fff;
      letter-spacing: 0.04em;
    }

    .mh-e-hero-${pId} {
      text-align: center;
      margin-bottom: 3rem;
      padding: 0 0.5rem;
    }

    .mh-e-badge-${pId} {
      display: inline-block;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 0.95rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      margin-bottom: 0.85rem;
    }

    .mh-e-title-${pId} {
      font-family: var(--font-heading);
      font-size: clamp(2.1rem, 6vw, 3.4rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 1.2rem;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .mh-e-title-${pId} span {
      background: linear-gradient(135deg, #fff 0%, var(--gold-light) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mh-e-subtitle-${pId} {
      font-size: clamp(1.05rem, 3vw, 1.25rem);
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 1.8rem;
      font-weight: 400;
      line-height: 1.7;
    }

    .mh-e-badges-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 2.8rem;
      width: 100%;
    }

    .mh-e-badge-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem 0.85rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .mh-e-badge-card-${pId}:hover {
      border-color: var(--gold);
      transform: translateY(-4px);
    }

    .mh-e-badge-icon-${pId} {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .mh-e-badge-text-${pId} {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mh-e-notes-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      width: 100%;
      margin-bottom: 3.2rem;
    }

    .mh-e-note-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.85rem 1.35rem;
      border-top: 3px solid var(--gold);
    }

    .mh-e-note-tier-${pId} {
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--gold);
      margin-bottom: 0.6rem;
      display: block;
    }

    .mh-e-note-name-${pId} {
      font-family: var(--font-heading);
      font-size: 1.45rem;
      color: #fff;
      margin: 0 0 0.75rem;
    }

    .mh-e-note-desc-${pId} {
      color: #b0b0bc;
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.65;
    }

    /* Comparison Box */
    .mh-e-comparison-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
      overflow-x: auto;
    }

    .mh-e-table-${pId} {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 1.5rem;
      font-size: 0.95rem;
    }

    .mh-e-table-${pId} th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--gold-light);
      padding: 1.1rem 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 2px solid var(--gold);
    }

    .mh-e-table-${pId} td {
      padding: 1.05rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #e2e2e8;
    }

    .mh-e-table-${pId} td.highlight {
      color: var(--gold-light);
      font-weight: 700;
    }

    .mh-e-table-${pId} td.dim {
      color: #7b7b8a;
    }

    /* Guarantee */
    .mh-e-guarantee-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
      border: 2px solid var(--gold);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      text-align: center;
      width: 100%;
    }

    .mh-e-guarantee-${pId} h3 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      color: var(--gold-light);
      margin: 0 0 0.6rem;
    }

    .mh-e-guarantee-${pId} p {
      color: #e2e2e8;
      font-size: 1.05rem;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.7;
    }

    @media (max-width: 600px) {
      .mh-e-top-bar-${pId} {
        flex-direction: column;
        gap: 8px;
        padding: 0.9rem 1rem;
      }
      .mh-e-badges-grid-${pId} {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .mh-e-notes-grid-${pId} {
        grid-template-columns: 1fr;
      }
      .mh-e-comparison-${pId},
      .mh-e-guarantee-${pId} {
        padding: 1.75rem 1.2rem;
      }
    }
  </style>

  <div class="mh-e-top-bar-${pId}">
    <span class="mh-e-top-tag-${pId}">✨ Luxury Eau De Parfum</span>
    <span class="mh-e-top-title-${pId}">50ML French Concentration Flacon | High Sillage</span>
  </div>

  <div class="mh-e-hero-${pId}">
    <div class="mh-e-badge-${pId}">✦ Artisanal Fine Fragrance ✦</div>
    <h1 class="mh-e-title-${pId}">${item.displayTitle}</h1>
    <p class="mh-e-subtitle-${pId}">${item.subtitle}</p>
  </div>

  <div class="mh-e-badges-grid-${pId}">
    <div class="mh-e-badge-card-${pId}">
      <span class="mh-e-badge-icon-${pId}">⏳</span>
      <span class="mh-e-badge-text-${pId}">12–18H Stay</span>
    </div>
    <div class="mh-e-badge-card-${pId}">
      <span class="mh-e-badge-icon-${pId}">🇫🇷</span>
      <span class="mh-e-badge-text-${pId}">French Essence</span>
    </div>
    <div class="mh-e-badge-card-${pId}">
      <span class="mh-e-badge-icon-${pId}">💨</span>
      <span class="mh-e-badge-text-${pId}">Zero Gas Spray</span>
    </div>
    <div class="mh-e-badge-card-${pId}">
      <span class="mh-e-badge-icon-${pId}">✨</span>
      <span class="mh-e-badge-text-${pId}">Ultra High Sillage</span>
    </div>
  </div>

  <!-- Pyramid -->
  <div style="margin-bottom: 1.5rem; text-align: center;">
    <h3 style="font-family: var(--font-heading); font-size: clamp(1.8rem, 4.5vw, 2.4rem); color: #fff; margin-bottom: 0.5rem;">The Olfactory Pyramid</h3>
    <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 2rem;">A masterfully structured formulation that unfolds across three distinct chapters</p>
  </div>

  <div class="mh-e-notes-grid-${pId}">
    <div class="mh-e-note-card-${pId}">
      <span class="mh-e-note-tier-${pId}">Top Notes • Immediate Burst</span>
      <h4 class="mh-e-note-name-${pId}">${item.notes?.topName}</h4>
      <p class="mh-e-note-desc-${pId}">${item.notes?.topDesc}</p>
    </div>
    <div class="mh-e-note-card-${pId}">
      <span class="mh-e-note-tier-${pId}">Heart Notes • Core Personality</span>
      <h4 class="mh-e-note-name-${pId}">${item.notes?.heartName}</h4>
      <p class="mh-e-note-desc-${pId}">${item.notes?.heartDesc}</p>
    </div>
    <div class="mh-e-note-card-${pId}">
      <span class="mh-e-note-tier-${pId}">Base Notes • Lingering Trail</span>
      <h4 class="mh-e-note-name-${pId}">${item.notes?.baseName}</h4>
      <p class="mh-e-note-desc-${pId}">${item.notes?.baseDesc}</p>
    </div>
  </div>

  <!-- Comparison -->
  <div class="mh-e-comparison-${pId}">
    <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem; text-align: center;">Why Mahekh EDP &gt; Commercial Gas Deodorants?</h3>
    <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.2rem;">Real perfume concentration vs pressurized propellants</p>

    <table class="mh-e-table-${pId}">
      <thead>
        <tr>
          <th>Metric</th>
          <th>✨ Mahekh Eau De Parfum</th>
          <th>💨 Commercial Gas Spray</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Perfume Oil Concentration</strong></td>
          <td class="highlight">💎 High 20–25% Pure Essence</td>
          <td class="dim">🌫️ Under 3–5% (Mostly Gas)</td>
        </tr>
        <tr>
          <td><strong>Staying Power</strong></td>
          <td class="highlight">🕰️ 12–18 Hours Lasting Aura</td>
          <td class="dim">⏳ Evaporates in 1–2 Hours</td>
        </tr>
        <tr>
          <td><strong>Scent Experience</strong></td>
          <td class="highlight">👑 Smooth, Layered &amp; Sophisticated</td>
          <td class="dim">⚠️ Harsh, Pungent &amp; Headaches</td>
        </tr>
        <tr>
          <td><strong>Bottle Craftsmanship</strong></td>
          <td class="highlight">💎 Heavyweight Glass Flacon with Micro-Mist Atomizer</td>
          <td class="dim">🥫 Tin Canister</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Guarantee -->
  <div class="mh-e-guarantee-${pId}">
    <h3>👑 100% Quality &amp; Longevity Promise</h3>
    <p>
      Formulated with high-grade perfume essences. Backed by Cash on Delivery (COD) across India and break-resistant secure shipping.
    </p>
  </div>
</div>`;
}

// -------------------------------------------------------------
// CAR PERFUME (10ML BEECHWOOD) HTML GENERATOR
// -------------------------------------------------------------

function buildCarPerfumeHtml(item) {
  const pId = item.id;
  const theme = item.theme || {
    bgBase: '#0c0f12',
    bgCard: '#141a20',
    borderColor: '#242f3b',
    gold: '#d4af37',
    goldLight: '#fae8a4',
  };

  return `<div class="mh-car-${pId}-wrapper">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    .mh-car-${pId}-wrapper {
      --gold: ${theme.gold};
      --gold-light: ${theme.goldLight};
      --bg-base: ${theme.bgBase};
      --bg-card: ${theme.bgCard};
      --border-color: ${theme.borderColor};
      --text-main: #f5f5f7;
      --text-muted: #9c9ca8;
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

      background-color: var(--bg-base);
      color: var(--text-main);
      padding: 3rem 1.5rem;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1.5rem 0;
      box-sizing: border-box;
      line-height: 1.8;
      font-family: var(--font-body);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 0 0 1px var(--border-color);
    }

    .mh-car-${pId}-wrapper *,
    .mh-car-${pId}-wrapper *::before,
    .mh-car-${pId}-wrapper *::after {
      box-sizing: inherit;
    }

    @media (max-width: 768px) {
      .mh-car-${pId}-wrapper {
        margin-left: -1.5rem !important;
        margin-right: -1.5rem !important;
        width: calc(100% + 3rem) !important;
        max-width: calc(100% + 3rem) !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        padding: 2.2rem 1.15rem !important;
        box-shadow: none !important;
      }
    }

    .mh-cp-top-bar-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0.02) 100%);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      text-align: center;
      margin-bottom: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }

    .mh-cp-top-tag-${pId} {
      background: linear-gradient(90deg, #ffd700, #ffae19, #ffd700);
      color: #000;
      font-weight: 800;
      font-size: 0.85rem;
      text-transform: uppercase;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .mh-cp-top-title-${pId} {
      font-weight: 700;
      font-size: 1.05rem;
      color: #fff;
      letter-spacing: 0.04em;
    }

    .mh-cp-hero-${pId} {
      text-align: center;
      margin-bottom: 3rem;
      padding: 0 0.5rem;
    }

    .mh-cp-badge-${pId} {
      display: inline-block;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 0.95rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      margin-bottom: 0.85rem;
    }

    .mh-cp-title-${pId} {
      font-family: var(--font-heading);
      font-size: clamp(2.1rem, 6vw, 3.4rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 1.2rem;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .mh-cp-title-${pId} span {
      background: linear-gradient(135deg, #fff 0%, var(--gold-light) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mh-cp-subtitle-${pId} {
      font-size: clamp(1.05rem, 3vw, 1.25rem);
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 1.8rem;
      font-weight: 400;
      line-height: 1.7;
    }

    .mh-cp-badges-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 2.8rem;
      width: 100%;
    }

    .mh-cp-badge-card-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem 0.85rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .mh-cp-badge-card-${pId}:hover {
      border-color: var(--gold);
      transform: translateY(-4px);
    }

    .mh-cp-badge-icon-${pId} {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .mh-cp-badge-text-${pId} {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Diffuser Mechanism Section */
    .mh-cp-features-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-cp-features-grid-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 22px;
      margin-top: 1.8rem;
    }

    .mh-cp-feature-item-${pId} {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .mh-cp-feature-check-${pId} {
      color: var(--gold);
      font-size: 1.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .mh-cp-feature-text-${pId} h4 {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      color: #fff;
      font-weight: 700;
    }

    .mh-cp-feature-text-${pId} p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Comparison Box */
    .mh-cp-comparison-${pId} {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      margin-bottom: 3.2rem;
      width: 100%;
      overflow-x: auto;
    }

    .mh-cp-table-${pId} {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 1.5rem;
      font-size: 0.95rem;
    }

    .mh-cp-table-${pId} th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--gold-light);
      padding: 1.1rem 1rem;
      text-align: left;
      font-weight: 700;
      border-bottom: 2px solid var(--gold);
    }

    .mh-cp-table-${pId} td {
      padding: 1.05rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #e2e2e8;
    }

    .mh-cp-table-${pId} td.highlight {
      color: var(--gold-light);
      font-weight: 700;
    }

    .mh-cp-table-${pId} td.dim {
      color: #7b7b8a;
    }

    /* Installation Guide */
    .mh-cp-how-to-${pId} {
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.3) 100%);
      margin-bottom: 3.2rem;
      width: 100%;
    }

    .mh-cp-steps-${pId} {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 18px;
      margin-top: 1.8rem;
    }

    .mh-cp-step-${pId} {
      text-align: center;
      padding: 1.5rem 1.15rem;
      background: rgba(255, 255, 255, 0.025);
      border-radius: 14px;
      border: 1px dashed rgba(212, 175, 55, 0.35);
    }

    .mh-cp-step-num-${pId} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--gold);
      color: #000;
      font-weight: 800;
      font-size: 1.1rem;
      margin-bottom: 0.85rem;
    }

    .mh-cp-step-${pId} h5 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #fff;
    }

    .mh-cp-step-${pId} p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Guarantee */
    .mh-cp-guarantee-${pId} {
      background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
      border: 2px solid var(--gold);
      border-radius: 16px;
      padding: 2.2rem 1.85rem;
      text-align: center;
      width: 100%;
    }

    .mh-cp-guarantee-${pId} h3 {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      color: var(--gold-light);
      margin: 0 0 0.6rem;
    }

    .mh-cp-guarantee-${pId} p {
      color: #e2e2e8;
      font-size: 1.05rem;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.7;
    }

    @media (max-width: 600px) {
      .mh-cp-top-bar-${pId} {
        flex-direction: column;
        gap: 8px;
        padding: 0.9rem 1rem;
      }
      .mh-cp-badges-grid-${pId} {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .mh-cp-steps-${pId} {
        grid-template-columns: 1fr;
      }
      .mh-cp-features-${pId},
      .mh-cp-comparison-${pId},
      .mh-cp-how-to-${pId},
      .mh-cp-guarantee-${pId} {
        padding: 1.75rem 1.2rem;
      }
    }
  </style>

  <div class="mh-cp-top-bar-${pId}">
    <span class="mh-cp-top-tag-${pId}">🚗 Executive Cabin Aromatherapy</span>
    <span class="mh-cp-top-title-${pId}">45–60 Days Continuous Freshness | Natural Beechwood Cap</span>
  </div>

  <div class="mh-cp-hero-${pId}">
    <div class="mh-cp-badge-${pId}">✦ Luxury Hanging Car Diffuser ✦</div>
    <h1 class="mh-cp-title-${pId}">${item.displayTitle}</h1>
    <p class="mh-cp-subtitle-${pId}">${item.subtitle}</p>
  </div>

  <div class="mh-cp-badges-grid-${pId}">
    <div class="mh-cp-badge-card-${pId}">
      <span class="mh-cp-badge-icon-${pId}">⏳</span>
      <span class="mh-cp-badge-text-${pId}">45–60 Days Stay</span>
    </div>
    <div class="mh-cp-badge-card-${pId}">
      <span class="mh-cp-badge-icon-${pId}">🪵</span>
      <span class="mh-cp-badge-text-${pId}">Beechwood Diffuser</span>
    </div>
    <div class="mh-cp-badge-card-${pId}">
      <span class="mh-cp-badge-icon-${pId}">🚫</span>
      <span class="mh-cp-badge-text-${pId}">Spill-Proof Seal</span>
    </div>
    <div class="mh-cp-badge-card-${pId}">
      <span class="mh-cp-badge-icon-${pId}">🌿</span>
      <span class="mh-cp-badge-text-${pId}">Pure Fragrance Oil</span>
    </div>
  </div>

  <!-- Features Grid -->
  <div class="mh-cp-features-${pId}">
    <h3 style="font-family: var(--font-heading); font-size: clamp(1.8rem, 4.5vw, 2.4rem); color: #fff; margin-bottom: 0.5rem; text-align: center;">Why It Beats Common Car Sprays</h3>
    <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Sustained natural micro-diffusion without synthetic chemical propellants</p>

    <div class="mh-cp-features-grid-${pId}">
      <div class="mh-cp-feature-item-${pId}">
        <span class="mh-cp-feature-check-${pId}">✔</span>
        <div class="mh-cp-feature-text-${pId}">
          <h4>Eliminates AC &amp; Cabin Odors</h4>
          <p>Actively binds to and neutralizes food, smoke, and moisture odors instead of masking them.</p>
        </div>
      </div>
      <div class="mh-cp-feature-item-${pId}">
        <span class="mh-cp-feature-check-${pId}">✔</span>
        <div class="mh-cp-feature-text-${pId}">
          <h4>Continuous Natural Evaporation</h4>
          <p>Natural wood cap absorbs oil and releases scent smoothly through cabin airflow.</p>
        </div>
      </div>
      <div class="mh-cp-feature-item-${pId}">
        <span class="mh-cp-feature-check-${pId}">✔</span>
        <div class="mh-cp-feature-text-${pId}">
          <h4>No Headaches or Nausea</h4>
          <p>Zero cheap aerosol gases — gentle, calming natural aromatics for pleasant journeys.</p>
        </div>
      </div>
      <div class="mh-cp-feature-item-${pId}">
        <span class="mh-cp-feature-check-${pId}">✔</span>
        <div class="mh-cp-feature-text-${pId}">
          <h4>Executive Aesthetics</h4>
          <p>Clear diamond-cut flacon with hand-finished wood cap elevates your car interior.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Comparison Box -->
  <div class="mh-cp-comparison-${pId}">
    <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem; text-align: center;">Diffuser vs Cheap Paper Trees</h3>
    <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.2rem;">The difference between real luxury oil and dipped cardboard</p>

    <table class="mh-cp-table-${pId}">
      <thead>
        <tr>
          <th>Feature</th>
          <th>🚗 Mahekh Hanging Diffuser</th>
          <th>🌲 Cardboard Air Freshener</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Lifespan</strong></td>
          <td class="highlight">🕰️ 45–60 Days Lasting Fragrance</td>
          <td class="dim">⏳ Dries out in 5–7 Days</td>
        </tr>
        <tr>
          <td><strong>Diffusion System</strong></td>
          <td class="highlight">🪵 Natural Beechwood Capillary Action</td>
          <td class="dim">🌫️ Harsh Chemical Spike then dead</td>
        </tr>
        <tr>
          <td><strong>Cabin Aesthetics</strong></td>
          <td class="highlight">💎 High-end Glass &amp; Wooden Accent</td>
          <td class="dim">🗑️ Cheap disposable paper look</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 3-Step Setup -->
  <div class="mh-cp-how-to-${pId}">
    <h3 style="font-family: var(--font-heading); font-size: clamp(1.8rem, 4.5vw, 2.4rem); color: #fff; margin-bottom: 0.5rem; text-align: center;">How to Activate in 10 Seconds</h3>
    <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Quick activation guide</p>

    <div class="mh-cp-steps-${pId}">
      <div class="mh-cp-step-${pId}">
        <span class="mh-cp-step-num-${pId}">1</span>
        <h5>Unscrew &amp; Unseal</h5>
        <p>Unscrew the beechwood cap and remove the inner transparent leak-proof plastic plug.</p>
      </div>
      <div class="mh-cp-step-${pId}">
        <span class="mh-cp-step-num-${pId}">2</span>
        <h5>Invert 3–5 Seconds</h5>
        <p>Screw the wood cap back tightly and invert the bottle upside down to saturate the wood.</p>
      </div>
      <div class="mh-cp-step-${pId}">
        <span class="mh-cp-step-num-${pId}">3</span>
        <h5>Hang on Mirror</h5>
        <p>Hang securely from your rearview mirror using the adjustable lanyard. Enjoy!</p>
      </div>
    </div>
  </div>

  <!-- Guarantee -->
  <div class="mh-cp-guarantee-${pId}">
    <h3>👑 Spill-Proof &amp; Freshness Guarantee</h3>
    <p>
      Engineered for rugged roads with leak-proof seals and pure concentrated oil. Backed by Cash on Delivery (COD) across India.
    </p>
  </div>
</div>`;
}

export {
  buildAttarSingleHtml,
  buildComboPackHtml,
  buildEdpHtml,
  buildCarPerfumeHtml,
};
