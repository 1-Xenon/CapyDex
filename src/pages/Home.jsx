import React from 'react';

const SYSTEMS = [
  'Adventurers', 'Artifacts', 'Brands', 'Collectibles', 'Equipment', 'Gems',
  'Heroes', 'Mounts', 'Mythic Treasures', 'Pet Armaments', 'Pets'
];

const ORBIT_ITEMS = [
  { name: 'Adventurer', image: 'img_card_hero_daji', className: 'orbit-item-hero' },
  { name: 'Equipment', image: 'Equip_SS_3_YingRen', className: 'orbit-item-equipment' },
  { name: 'Collectible', image: 'icon_358009', className: 'orbit-item-collectible' },
  { name: 'Mount', image: 'icon_mount_dajiao', className: 'orbit-item-mount' },
];

function imageSource(imageId) {
  return `${import.meta.env.BASE_URL}images/${encodeURIComponent(imageId)}.png`;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export default function Home({ onNavigate }) {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <div className="eyebrow"><span />Community-maintained game archive</div>
          <h1 id="home-title">Every item.<br /><em>One living index.</em></h1>
          <p className="home-hero-lead">
            CapyDex stores clear, searchable information about the many items and progression
            systems in Capybara Go—from equipment and pets to artifacts, mounts, collectibles, and more.
          </p>
          <div className="home-actions">
            <button type="button" className="primary home-primary-action" onClick={() => onNavigate('index')}>
              Explore the Index <ArrowIcon />
            </button>
            <button type="button" className="home-secondary-action" onClick={() => onNavigate('changelog')}>
              See what’s new
            </button>
          </div>
          <div className="home-proof" aria-label="Index highlights">
            <div><strong>{SYSTEMS.length}</strong><span>item systems</span></div>
            <div><strong>v1.8.19</strong><span>current game data</span></div>
          </div>
        </div>

        <div className="home-visual" aria-label="A selection of indexed Capybara Go items">
          <div className="archive-orbit" aria-hidden="true">
            <div className="orbit-ring orbit-ring-outer" />
            <div className="orbit-ring orbit-ring-inner" />
            <div className="orbit-core">
              <span>THE</span>
              <strong>INDEX</strong>
              <small>Capybara Go</small>
            </div>
            {ORBIT_ITEMS.map((item) => (
              <div className={`orbit-item ${item.className}`} key={item.name}>
                <img src={imageSource(item.image)} alt="" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-purpose" aria-labelledby="purpose-title">
        <div className="home-section-heading">
          <div>
            <div className="eyebrow"><span />Built for quick reference</div>
            <h2 id="purpose-title">Less hunting. More understanding.</h2>
          </div>
          <p>A focused companion for checking the details that are easy to miss inside the game.</p>
        </div>

        <div className="purpose-grid">
          <article className="purpose-card purpose-card-featured">
            <span className="purpose-number">01</span>
            <div>
              <h3>Explore every system</h3>
              <p>Move between categories without losing your place, then filter by rarity or search for a specific item.</p>
            </div>
          </article>
          <article className="purpose-card">
            <span className="purpose-number">02</span>
            <div>
              <h3>Read progression clearly</h3>
              <p>Compare stars, rarity effects, active skills, deploy skills, and upgrade milestones in structured views.</p>
            </div>
          </article>
          <article className="purpose-card">
            <span className="purpose-number">03</span>
            <div>
              <h3>Share direct references</h3>
              <p>Each item has a linkable detail view, making it easier to revisit or share exactly what you found.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-systems" aria-labelledby="systems-title">
        <div className="systems-copy">
          <span className="systems-kicker">Inside the archive</span>
          <h2 id="systems-title">One doorway to every item category.</h2>
          <p>The Index brings separate game systems into one consistent, searchable reference.</p>
          <button type="button" className="text-action" onClick={() => onNavigate('index')}>
            Open all categories <ArrowIcon />
          </button>
        </div>
        <ol className="system-list">
          {SYSTEMS.map((system, index) => (
            <li key={system}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{system}</strong>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
