import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const CATEGORIES = ['adventurer', 'hero', 'brand', 'equipment', 'gem', 'pet', 'pet_armament', 'mount', 'artifact', 'mythic_treasure'];
const SORTED_CATEGORIES = [...CATEGORIES].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
const RARITY_ORDER = ['Common', 'Great', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Immortal', 'Arcana', 'Transcendent', 'Peerless'];
const IMAGE_FIELDS = ['image', 'image_id', 'imageId', 'icon', 'icon_id', 'iconId', 'sprite', 'sprite_id', 'spriteId'];
const GEM_CARD_IMAGE_ID = 'gem_rarity_peerless';
const GEM_RARITY_IMAGE_IDS = {
  Normal: 'gem_rarity_normal',
  Fine: 'gem_rarity_fine',
  Rare: 'gem_rarity_rare',
  Epic: 'gem_rarity_epic',
  Legendary: 'gem_rarity_legendary',
  Mythic: 'gem_rarity_mythic',
  Immortal: 'gem_rarity_immortal',
  Transcendent: 'gem_rarity_transcendent',
  Peerless: 'gem_rarity_peerless',
};
const RARITY_CARD_COLORS = {
  Normal: '#D9D8F0',
  Fine: '#48C048',
  Rare: '#58B0F0',
  Epic: '#A860F8',
  Legendary: '#FF9850',
  Mythic: '#af2342',
  Immortal: '#e762a9',
  Transcendent: '#4928ED',
  Peerless: '#35E69E',
};

function itemRarity(item) {
  const value = item.rarity || item.rarity_or_quality || '';
  if (['pet', 'pet_armament', 'mount', 'artifact'].includes(item.category) && value === 'Arcana') return 'Transcendent';
  return value === 'Quality-dependent' ? '' : value;
}

function rarityCardStyle(rarity) {
  const color = RARITY_CARD_COLORS[rarity];
  if (!color) return undefined;

  return {
    '--rarity-card-color': color,
    '--rarity-card-border-color': `color-mix(in srgb, ${color} 60%, white)`,
  };
}

function rarityClassName(rarity) {
  return rarity ? `index-item-card-rarity-${itemSlug(rarity)}` : '';
}

function categoryLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function itemSlug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function itemRoutePath(item) {
  const params = new URLSearchParams({ [item.category]: itemSlug(item.name) });
  return `${basePath()}/?${params.toString()}`;
}

function indexRoutePath() {
  return `${basePath()}/`;
}

function parseItemRoute() {
  if (typeof window === 'undefined') return null;

  const base = basePath();
  let pathname = window.location.pathname;
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/';
  }

  const match = pathname.match(/^\/([^/=]+)=([^/]+)$/);
  if (!match) {
    const params = new URLSearchParams(window.location.search);
    for (const category of CATEGORIES) {
      const slug = params.get(category);
      if (slug) return { category, slug: itemSlug(decodeURIComponent(slug)) };
    }
    return null;
  }

  const [, category, slug] = match;
  return CATEGORIES.includes(category) ? { category, slug: itemSlug(decodeURIComponent(slug)) } : null;
}

function itemImageId(item) {
  for (const field of IMAGE_FIELDS) {
    const value = item[field] || item.extra?.[field];
    if (value) return String(value);
  }
  return '';
}

function imageIdToSrc(imageId) {
  if (!imageId) return '';
  if (/^(https?:)?\/\//.test(imageId) || imageId.startsWith('data:')) return imageId;

  const normalized = imageId
    .replace(/^\/+/, '')
    .replace(/^images\//, '')
    .replace(/^public\/images\//, '');
  const filename = /\.[a-z0-9]+$/i.test(normalized) ? normalized : `${normalized}.png`;
  const encoded = filename.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${import.meta.env.BASE_URL}images/${encoded}`;
}

function itemImageSrc(item) {
  return imageIdToSrc(itemImageId(item).trim());
}

function itemImageFallbackSrc(item) {
  const imageId = itemImageId(item).trim();
  if (!imageId || !imageId.endsWith('v') || /\.[a-z0-9]+$/i.test(imageId)) return '';
  return imageIdToSrc(imageId.slice(0, -1));
}

function ItemImage({ item, variant = 'card' }) {
  const src = item.category === 'gem' ? imageIdToSrc(GEM_CARD_IMAGE_ID) : itemImageSrc(item);
  const fallbackSrc = item.category === 'gem' ? '' : itemImageFallbackSrc(item);
  if (!src) return null;
  return (
    <img
      className={`index-item-image index-item-image-${variant}`}
      src={src}
      alt=""
      loading="lazy"
      data-fallback-src={fallbackSrc}
      onError={(event) => {
        const fallback = event.currentTarget.dataset.fallbackSrc;
        if (fallback && event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback;
          event.currentTarget.dataset.fallbackSrc = '';
          return;
        }
        event.currentTarget.hidden = true;
      }}
    />
  );
}

function GemRarityLabel({ rarity }) {
  const iconSrc = imageIdToSrc(GEM_RARITY_IMAGE_IDS[rarity]);

  return (
    <span className="gem-rarity-title">
      {iconSrc ? <img className="gem-rarity-icon" src={iconSrc} alt="" loading="lazy" /> : null}
      <span>{rarity}</span>
    </span>
  );
}

function AdventurerStarEffects({ effects = [] }) {
  if (!effects.length) {
    return <p className="muted">No star effects are linked for this Adventurer yet.</p>;
  }

  return (
    <div className="star-effect-list">
      {effects.map((effect) => (
        <div className="star-effect-row" key={effect.star}>
          <div className="star-badge">{effect.star}★</div>
          <div className="star-effect-copy">
            <strong>{effect.title || 'No new visible effect linked'}</strong>
            {effect.description ? <p>{effect.description}</p> : null}
            {!effect.description && effect.source_text && effect.source_text !== effect.title ? <p>{effect.source_text}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function RarityEffects({ effects = [], emptyText = 'No rarity effects are linked for this entry yet.' }) {
  if (!effects.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="rarity-effect-list">
      {effects.map((effect) => (
        <div className="rarity-effect-row" key={`${effect.rarity}_${effect.description}`}>
          <strong className="rarity-effect-title">{effect.rarity}</strong>
          <p>{effect.description || 'No visible player-facing description linked.'}</p>
        </div>
      ))}
    </div>
  );
}

function EquipSkillEffects({ skills = [] }) {
  if (!skills.length) return null;

  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">Equip Skill:</strong>
      <div className="rarity-effect-list">
        {skills.map((skill, index) => (
          <div className="rarity-effect-row" key={`${skill.title}_${index}`}>
            <strong className="rarity-effect-title">{skill.title}</strong>
            <p>{skill.description || 'No visible player-facing description linked.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentArcanaStars({ item }) {
  const upgrades = item.extra?.equipment_arcana_star_upgrades || [];
  const arcanaName = item.extra?.equipment_arcana_name || '';
  if (!upgrades.length && !arcanaName) return null;

  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">Arcana / Statue Skill Effects{arcanaName ? `: ${arcanaName}` : ':'}</strong>
      {upgrades.length ? (
        <div className="rarity-effect-list">
          {upgrades.map((upgrade) => (
            <div className="rarity-effect-row" key={`${item.name}_equipment_arcana_${upgrade.star}`}>
              <strong className="rarity-effect-title">Star {upgrade.star}</strong>
              <p>{upgrade.description || 'No new skill-effect upgrade linked.'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Arcana / Statue form is linked, but no star upgrade rows are available yet.</p>
      )}
    </div>
  );
}

function boldPercentValues(description = '') {
  return String(description)
    .split(/([+-]?\d+(?:\.\d+)?%)/g)
    .map((part, index) => (
      /^[+-]?\d+(?:\.\d+)?%$/.test(part)
        ? <strong className="gem-percent-value" key={`${part}_${index}`}>{part}</strong>
        : part
    ));
}

function GemRarityEffects({ effects = [] }) {
  if (!effects.length) {
    return <p className="muted">No gem rarity values are linked for this entry yet.</p>;
  }

  return (
    <div className="rarity-effect-list">
      {effects.map((effect) => (
        <div className="rarity-effect-row" key={`${effect.rarity}_${effect.description}`}>
          <strong className="rarity-effect-title gem-rarity-effect-title">
            <GemRarityLabel rarity={effect.rarity} />
          </strong>
          <p>{boldPercentValues(effect.description || 'No visible player-facing description linked.')}</p>
        </div>
      ))}
    </div>
  );
}

function PetBattleSkillLevels({ levels = [] }) {
  if (!levels.length) {
    return <p className="muted">No battle skill levels are linked for this pet yet.</p>;
  }

  return (
    <div className="rarity-effect-list">
      {levels.map((level) => (
        <div className="rarity-effect-row" key={`${level.level}_${level.skill_id}`}>
          <strong className="rarity-effect-title">Level {level.level}</strong>
          <p>{level.description || 'No visible battle skill description linked.'}</p>
        </div>
      ))}
    </div>
  );
}

function PetArcanaStars({ item }) {
  const upgrades = item.extra?.pet_arcana_star_upgrades || [];
  const arcanaName = item.extra?.pet_arcana_name || item.extra?.evolved_name || item.extra?.pet_arcana_item_name || '';
  if (!upgrades.length && !arcanaName) return null;

  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">Arcana / Pet Statue Skill Effects{arcanaName ? `: ${arcanaName}` : ':'}</strong>
      {upgrades.length ? (
        <div className="rarity-effect-list">
          {upgrades.map((upgrade) => (
            <div className="rarity-effect-row" key={`${item.name}_arcana_${upgrade.star}`}>
              <strong className="rarity-effect-title">Star {upgrade.star}</strong>
              <p>{upgrade.description || 'No new skill-effect upgrade linked.'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Arcana form is linked, but no star upgrade rows are available yet.</p>
      )}
    </div>
  );
}

function SkillSection({ title, levels = [], itemType = 'skill' }) {
  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">{title}:</strong>
      {levels.length ? (
        <div className="rarity-effect-list">
          {levels.map((level) => (
            <div className="rarity-effect-row" key={`${title}_${level.level}_${level.skill_id}`}>
              <strong className="rarity-effect-title">Level {level.level}{level.skill_name ? ` — ${level.skill_name}` : ''}</strong>
              {level.awakening_star !== undefined && level.awakening_star !== null ? <p className="muted small-note">Awakening Star {level.awakening_star}</p> : null}
              <p>{level.description || `No visible ${itemType} description linked.`}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No {title} levels are linked for this item yet.</p>
      )}
    </div>
  );
}

function mountActiveSkillLabel(rarity, level) {
  if (level === 1) return 'Unlock';
  if (rarity === 'Arcana' && level >= 2 && level <= 6) return '⭐'.repeat(level - 1);
  if (['Legendary', 'Mythic', 'Immortal'].includes(rarity) && level === 2) return '⭐⭐⭐⭐⭐';
  return `Level ${level}`;
}

function mountDeploySkillLabel(level) {
  return ({ 1: 'A0', 2: 'A2', 3: 'A4', 4: 'A7', 5: 'A10' })[level] || `Level ${level}`;
}

function MountSkillSection({ title, levels = [], itemType, labelForLevel }) {
  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">{title}:</strong>
      {levels.length ? (
        <div className="rarity-effect-list">
          {levels.map((level) => (
            <div className="rarity-effect-row" key={`${title}_${level.level}_${level.skill_id}`}>
              <strong className="rarity-effect-title">
                {labelForLevel(level.level)}{level.skill_name ? ` — ${level.skill_name}` : ''}
              </strong>
              <p>{level.description || `No visible ${itemType} description linked.`}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No {title} levels are linked for this item yet.</p>
      )}
    </div>
  );
}

function ItemCardGrid({ items, routeItems = items, category, routeTarget, setRouteTarget, renderDetail, renderCardMeta }) {
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (routeTarget?.category !== category) {
      setSelectedItem(null);
      return;
    }

    const routeItem = routeItems.find((item) => itemSlug(item.name) === routeTarget.slug);
    setSelectedItem(routeItem || null);
  }, [category, routeItems, routeTarget]);

  function selectItem(item) {
    setSelectedItem(item);
    const nextTarget = { category: item.category, slug: itemSlug(item.name) };
    window.history.pushState(nextTarget, '', itemRoutePath(item));
    setRouteTarget(nextTarget);
  }

  function clearSelectedItem() {
    setSelectedItem(null);
    window.history.pushState(null, '', indexRoutePath());
    setRouteTarget(null);
  }

  return (
    <>
      <div className={`index-card-grid index-card-grid-${category}`}>
        {items.map((item, index) => {
          const rarity = itemRarity(item);
          return (
            <button
              type="button"
              className={`index-item-card ${rarityClassName(rarity)}`}
              style={rarityCardStyle(rarity)}
              key={`${item.category}_${item.name}_${index}`}
              onClick={() => selectItem(item)}
            >
              <ItemImage item={item} />
              <span className="index-item-name">{item.name}</span>
              {renderCardMeta ? renderCardMeta(item) : null}
              {rarity ? <small>{rarity}</small> : null}
            </button>
          );
        })}
      </div>

      {selectedItem ? (
        <div className="index-modal-backdrop" role="presentation" onClick={clearSelectedItem}>
          <section className="index-modal" role="dialog" aria-modal="true" aria-label={`${selectedItem.name} details`} onClick={(event) => event.stopPropagation()}>
            <header className="index-modal-header">
              <div className="index-modal-title">
                <ItemImage item={selectedItem} variant="modal" />
                <div>
                  <span className="pill">{categoryLabel(category)}</span>
                  <h2>{selectedItem.name}</h2>
                </div>
              </div>
              <button type="button" onClick={clearSelectedItem}>Close</button>
            </header>
            <div className="index-modal-body">
              {renderDetail(selectedItem)}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function AdventurerCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="adventurer"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => <AdventurerStarEffects effects={item.extra?.adventurer_star_effects || []} />}
    />
  );
}

function HeroBrandCatalog({ category, items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category={category}
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => <RarityEffects effects={item.extra?.rarity_effects || []} />}
    />
  );
}

function EquipmentCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="equipment"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => (
        <>
          <RarityEffects effects={item.extra?.equipment_rarity_effects || []} />
          <EquipSkillEffects skills={item.extra?.equipment_equip_skills || []} />
          <EquipmentArcanaStars item={item} />
        </>
      )}
    />
  );
}

function GemCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="gem"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderCardMeta={(item) => item.subtype ? <small className="index-item-equipment">{item.subtype}</small> : null}
      renderDetail={(item) => <GemRarityEffects effects={item.extra?.gem_rarity_effects || []} />}
    />
  );
}

function PetCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="pet"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => (
        <>
          <PetBattleSkillLevels levels={item.extra?.pet_battle_skill_levels || []} />
          <PetArcanaStars item={item} />
        </>
      )}
    />
  );
}


function PetArmamentCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="pet_armament"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => {
        const skillLevels = item.extra?.pet_armament_skill_levels || [];
        const skillName = item.extra?.pet_armament_skill_name || '';
        return (
          <>
            <div className="equip-skill-section">
              <strong className="equip-skill-heading">Pet Armament Skill{skillName ? `: ${skillName}` : ':'}</strong>
              {skillLevels.length ? (
                <div className="rarity-effect-list">
                  {skillLevels.map((level) => (
                    <div className="rarity-effect-row" key={`${item.name}_skill_${level.level}_${level.detail_key || level.description || 'level'}`}>
                      <strong className="rarity-effect-title">Skill Level {level.level}{level.skill_name ? ` — ${level.skill_name}` : ''}</strong>
                      <p>{level.description || 'No visible pet armament skill description linked.'}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="muted">No player-facing skill levels are linked for this pet armament yet.</p>}
            </div>
          </>
        );
      }}
    />
  );
}

function MountCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="mount"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => {
        const rawRarity = item.rarity || item.rarity_or_quality || '';
        return (
          <>
            <MountSkillSection
              title="Active Skill"
              levels={item.extra?.mount_skill_levels || []}
              itemType="Active Skill"
              labelForLevel={(level) => mountActiveSkillLabel(rawRarity, level)}
            />
            <MountSkillSection
              title="Deploy Skill"
              levels={item.extra?.riding_skill_levels || []}
              itemType="Deploy Skill"
              labelForLevel={mountDeploySkillLabel}
            />
          </>
        );
      }}
    />
  );
}

function ArtifactCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="artifact"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => {
        const rawRarity = item.rarity || item.rarity_or_quality || '';
        return (
          <>
            <MountSkillSection
              title="Active Skill"
              levels={item.extra?.artifact_active_skill_levels || []}
              itemType="Active Skill"
              labelForLevel={(level) => mountActiveSkillLabel(rawRarity, level)}
            />
            <MountSkillSection
              title="Deploy Skill"
              levels={item.extra?.artifact_deploy_skill_levels || []}
              itemType="Deploy Skill"
              labelForLevel={mountDeploySkillLabel}
            />
          </>
        );
      }}
    />
  );
}

function formatMythicTreasureStat(value, column) {
  if (value === undefined || value === null || value === '') return '—';
  return `${value}${column?.is_percent ? '%' : ''}`;
}

function MythicTreasureBaseStats({ stats }) {
  const columns = stats?.columns || [];
  const rows = stats?.rows || [];

  if (columns.length !== 2 || !rows.length) {
    return <p className="muted">No Mythic Treasure base-stat table is linked for this item yet.</p>;
  }

  return (
    <div className="mythic-stat-table-wrap">
      <table className="mythic-stat-table">
        <thead>
          <tr>
            <th scope="col">Star</th>
            {columns.map((column) => <th scope="col" key={column.label}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`mythic_stat_${row.star}`}>
              <th scope="row">{row.star}★</th>
              {columns.map((column, index) => (
                <td key={`${row.star}_${column.label}`}>
                  {formatMythicTreasureStat(row.values?.[index]?.raw_value, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MythicTreasureEquipmentEffects({ effects = [] }) {
  if (!effects.length) return null;

  return (
    <div className="equip-skill-section">
      <strong className="equip-skill-heading">Equipment Effect:</strong>
      <div className="mythic-stat-table-wrap mythic-effect-table-wrap">
        <table className="mythic-stat-table mythic-effect-table">
          <thead>
            <tr>
              <th scope="col">Star</th>
              <th scope="col">Equipment Effect</th>
            </tr>
          </thead>
          <tbody>
            {effects.map((effect) => (
              <tr key={`mythic_equipment_effect_${effect.star}`}>
                <th scope="row">{effect.star}★</th>
                <td>{effect.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MythicTreasureCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="mythic_treasure"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => {
        const baseStats = item.extra?.mythic_treasure_base_stats;
        const equipmentEffects = item.extra?.mythic_treasure_equipment_effects || [];
        return (
          <>
            <MythicTreasureBaseStats stats={baseStats} />
            <MythicTreasureEquipmentEffects effects={equipmentEffects} />
          </>
        );
      }}
    />
  );
}

function GenericCatalog({ category, items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category={category}
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => (
        <div className="rarity-effect-list">
          <div className="rarity-effect-row">
            <strong className="rarity-effect-title">Details</strong>
            <p>No user-facing skill display has been configured for this category yet.</p>
          </div>
        </div>
      )}
    />
  );
}

function CatalogTable({ category, items, routeItems, routeTarget, setRouteTarget }) {
  const routeProps = { routeItems, routeTarget, setRouteTarget };

  if (category === 'adventurer') {
    return <AdventurerCatalog items={items} {...routeProps} />;
  }

  if (category === 'hero' || category === 'brand') {
    return <HeroBrandCatalog category={category} items={items} {...routeProps} />;
  }

  if (category === 'equipment') {
    return <EquipmentCatalog items={items} {...routeProps} />;
  }

  if (category === 'gem') {
    return <GemCatalog items={items} {...routeProps} />;
  }

  if (category === 'pet') {
    return <PetCatalog items={items} {...routeProps} />;
  }

  if (category === 'pet_armament') {
    return <PetArmamentCatalog items={items} {...routeProps} />;
  }

  if (category === 'mount') {
    return <MountCatalog items={items} {...routeProps} />;
  }

  if (category === 'artifact') {
    return <ArtifactCatalog items={items} {...routeProps} />;
  }

  if (category === 'mythic_treasure') {
    return <MythicTreasureCatalog items={items} {...routeProps} />;
  }

  return <GenericCatalog category={category} items={items} {...routeProps} />;
}

export default function Index() {
  const [routeTarget, setRouteTarget] = useState(() => parseItemRoute());
  const [category, setCategory] = useState(() => parseItemRoute()?.category || 'adventurer');
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  function applyRouteTarget(nextRouteTarget) {
    setRouteTarget(nextRouteTarget);
    if (!nextRouteTarget) return;

    setCategory(nextRouteTarget.category);
    setQ('');
    setRarity('');
    setEquipmentType('');
  }

  useEffect(() => {
    function syncRouteTarget() {
      const nextRouteTarget = parseItemRoute();
      applyRouteTarget(nextRouteTarget);
    }

    syncRouteTarget();
    window.addEventListener('popstate', syncRouteTarget);
    return () => window.removeEventListener('popstate', syncRouteTarget);
  }, []);

  useEffect(() => {
    api.catalog({ category, q }).then((data) => setItems(data.items || [])).catch((error) => setMessage(error.message));
  }, [category, q]);

  useEffect(() => {
    setRarity('');
    setEquipmentType('');
  }, [category]);

  const rarityOptions = useMemo(() => {
    const values = [...new Set(items.map(itemRarity).filter(Boolean))];
    return values.sort((a, b) => {
      const aRank = RARITY_ORDER.indexOf(a);
      const bRank = RARITY_ORDER.indexOf(b);
      if (aRank === -1 && bRank === -1) return String(a).localeCompare(String(b));
      if (aRank === -1) return 1;
      if (bRank === -1) return -1;
      return aRank - bRank;
    });
  }, [items]);

  const equipmentTypeOptions = useMemo(() => {
    if (category !== 'gem') return [];
    return [...new Set(items.map((item) => item.subtype).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [category, items]);

  const displayItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (rarity && itemRarity(item) !== rarity) return false;
      if (category === 'gem' && equipmentType && item.subtype !== equipmentType) return false;
      return true;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [category, equipmentType, items, rarity]);

  const countText = useMemo(() => `${displayItems.length} item${displayItems.length === 1 ? '' : 's'}`, [displayItems]);
  const hasRarity = rarityOptions.length > 0;
  const hasEquipmentType = equipmentTypeOptions.length > 0;

  function changeCategory(nextCategory) {
    setCategory(nextCategory);
    setRouteTarget(null);
    window.history.pushState(null, '', indexRoutePath());
  }

  return (
    <main>
      <div className="page-header"><div><h1>The Index</h1></div><span className="pill">{countText}</span></div>
      <section className="panel">
        <div className={`grid index-filter-grid${hasRarity || hasEquipmentType ? ' has-extra-filter' : ''}`}>
          <label className="field"><span>Category</span><select value={category} onChange={(event) => changeCategory(event.target.value)}>{SORTED_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
          <label className="field"><span>Search</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name of item..." /></label>
          {hasRarity ? <label className="field"><span>Rarity</span><select value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="">All Rarities</option>{rarityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
          {hasEquipmentType ? <label className="field"><span>Equipment</span><select value={equipmentType} onChange={(event) => setEquipmentType(event.target.value)}><option value="">All Equipment</option>{equipmentTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
        </div>
      </section>
      <CatalogTable category={category} items={displayItems} routeItems={items} routeTarget={routeTarget} setRouteTarget={setRouteTarget} />
      {message ? <div className="toast">{message}</div> : null}
    </main>
  );
}
