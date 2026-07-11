import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const CATEGORIES = ['adventurer', 'hero', 'brand', 'equipment', 'gem', 'pet', 'pet_armament', 'mount', 'artifact', 'collectible', 'mythic_treasure'];
const SORTED_CATEGORIES = [...CATEGORIES].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
const RARITY_ORDER = ['Normal', 'Common', 'Fine', 'Great', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Immortal', 'Arcana', 'Transcendent', 'S', 'SS', 'Peerless'];
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
const PEERLESS_DEFAULT_CATEGORIES = new Set(['gem']);
const S_EQUIPMENT_NAMES = new Set([
  'Angel Bow',
  'Bishop Staff',
  'Blade of Justice',
  'Bloody Grail',
  'Dragon Ball Ring',
  "Dragon's Breath Armor",
  'Durian Hammer',
  'Judgment Ring',
  'Mushroom Hammer',
  'Proof of Glory',
  "Reaper's Staff",
  'Reckoning Badge',
  'Revival Cape',
  'Shadow Lance',
  'Shadow Ring',
  'Skyflame Ring',
  'Skysplitter',
  'Star Staff',
  'Whisperer',
]);

function hasTranscendentEquipmentSkill(item) {
  return item.category === 'equipment'
    && (item.extra?.equipment_rarity_effects || []).some((effect) => ['Surpass', 'Transcendent'].includes(effect.rarity));
}

function isSEquipment(item) {
  return item.category === 'equipment' && S_EQUIPMENT_NAMES.has(item.name);
}

function itemRarity(item) {
  if (hasTranscendentEquipmentSkill(item)) return 'SS';
  if (isSEquipment(item)) return 'S';

  const value = item.rarity || item.rarity_or_quality || '';
  if (item.category === 'equipment' && !value) return 'Normal';
  if (item.category === 'pet' && value === 'Common') return 'Normal';
  if (item.category === 'pet' && value === 'Great') return 'Fine';
  if (['pet', 'pet_armament', 'mount', 'artifact'].includes(item.category) && value === 'Arcana') return 'Transcendent';
  return value === 'Quality-dependent' ? '' : String(value);
}

function itemCardRarity(item) {
  if (hasTranscendentEquipmentSkill(item)) return 'Transcendent';
  if (isSEquipment(item)) return 'Mythic';
  if (item.category === 'equipment' && !item.rarity && !item.rarity_or_quality) return '';

  const rarity = itemRarity(item);
  if (rarity) return rarity;
  return PEERLESS_DEFAULT_CATEGORIES.has(item.category) ? 'Peerless' : '';
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
  return `${basePath()}/index?${params.toString()}`;
}

function indexRoutePath() {
  return `${basePath()}/index`;
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

function AdventurerStarEffects({ effects = [], emptyText = 'No star effects are linked for this Adventurer yet.' }) {
  if (!effects.length) {
    return <p className="muted">{emptyText}</p>;
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

function RarityEffects({ effects = [], emptyText = 'No rarity effects are linked for this entry yet.', shadeByRarity = false }) {
  if (!effects.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="rarity-effect-list">
      {effects.map((effect) => {
        const displayRarity = effect.rarity === 'Surpass' ? 'Transcendent' : effect.rarity;
        const colorKey = effect.rarity === 'Uncommon' ? 'Fine' : displayRarity;
        const rarityColor = RARITY_CARD_COLORS[colorKey];
        return (
          <div
            className={`rarity-effect-row${shadeByRarity && rarityColor ? ' rarity-effect-row-shaded' : ''}`}
            style={shadeByRarity && rarityColor ? { '--rarity-effect-color': rarityColor } : undefined}
            key={`${effect.rarity}_${effect.description}`}
          >
            <strong className="rarity-effect-title">{displayRarity}</strong>
            <p>{effect.description || 'No visible player-facing description linked.'}</p>
          </div>
        );
      })}
    </div>
  );
}

function EquipSkillEffects({ skills = [], showHeading = true }) {
  if (!skills.length) return <p className="muted">No equip skills are linked for this equipment yet.</p>;

  return (
    <div className="equip-skill-section">
      {showHeading ? <strong className="equip-skill-heading">Equip Skill:</strong> : null}
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
  if (!upgrades.length && !arcanaName) return <p className="muted">No Arcana effects are linked for this equipment yet.</p>;

  return (
    <div className="equip-skill-section">
      {upgrades.length ? (
        <div className="rarity-effect-list">
          {upgrades.map((upgrade) => (
            <div className="rarity-effect-row" key={`${item.name}_equipment_arcana_${upgrade.star}`}>
              <strong className="rarity-effect-title">{upgrade.star}⭐</strong>
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
  const persistentHighlightedValues = new Set();

  return (
    <div className="rarity-effect-list">
      {levels.map((level, index) => (
        <div className="rarity-effect-row" key={`${level.level}_${level.skill_id}`}>
          <strong className="rarity-effect-title">Level {level.level}</strong>
          <p>{highlightSkillUpgrade(level.description, levels[index - 1]?.description, persistentHighlightedValues) || 'No visible battle skill description linked.'}</p>
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
      {upgrades.length ? (
        <div className="rarity-effect-list">
          {upgrades.map((upgrade) => (
            <div className="rarity-effect-row" key={`${item.name}_arcana_${upgrade.star}`}>
              <strong className="rarity-effect-title">{upgrade.star}⭐</strong>
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

const SKILL_VALUE_PATTERN = /[+-]?\d[\d,]*(?:\.\d+)?(?:%|×|x)?(?:\s*(?:turns?|times?|hits?|stacks?|rounds?))?(?:\/(?:turn|round))?/gi;
const SKILL_NUMBER_PATTERN = /^([+-]?\d[\d,]*(?:\.\d+)?(?:%|×|x)?)(.*)$/i;

function normalizedSkillValue(value) {
  return String(value).toLowerCase().replace(/^\+/, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

function highlightSkillUpgrade(description, previousDescription, persistentHighlightedValues) {
  if (!description || !previousDescription) return description;

  const previousValues = new Map();
  for (const value of String(previousDescription).match(SKILL_VALUE_PATTERN) || []) {
    const normalized = normalizedSkillValue(value);
    previousValues.set(normalized, (previousValues.get(normalized) || 0) + 1);
  }

  const output = [];
  let cursor = 0;
  for (const [index, match] of [...String(description).matchAll(SKILL_VALUE_PATTERN)].entries()) {
    const value = match[0];
    const start = match.index;
    if (start > cursor) output.push(String(description).slice(cursor, start));

    const normalized = normalizedSkillValue(value);
    const remainingMatches = previousValues.get(normalized) || 0;
    const changedAtThisLevel = remainingMatches === 0;
    if (remainingMatches > 0) previousValues.set(normalized, remainingMatches - 1);
    if (changedAtThisLevel) persistentHighlightedValues.add(normalized);

    if (!changedAtThisLevel && !persistentHighlightedValues.has(normalized)) {
      output.push(value);
    } else {
      const [, number = value, unit = ''] = value.match(SKILL_NUMBER_PATTERN) || [];
      output.push(
        <React.Fragment key={`${normalized}_${index}`}>
          <strong className="upgrade-value-change">{number}</strong>{unit}
        </React.Fragment>
      );
    }

    cursor = start + value.length;
  }

  if (cursor < String(description).length) output.push(String(description).slice(cursor));
  return output;
}

function normalizedSkillClause(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9%+.-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function derivedUpgradeDescription(description, previousDescription) {
  if (!description) return '';
  if (!previousDescription) return description;
  if (normalizedSkillClause(description) === normalizedSkillClause(previousDescription)) {
    return 'No visible change is described for this level.';
  }

  const previous = normalizedSkillClause(previousDescription);
  const changedClauses = String(description)
    .split(/\n+|(?<=[.;])\s+|,\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .filter((clause) => !previous.includes(normalizedSkillClause(clause)));

  return changedClauses.length ? changedClauses.join('; ') : description;
}

function MountSkillSection({ title, levels = [], itemType, labelForLevel, showHeading = true, conciseUpgrades = false }) {
  const persistentHighlightedValues = new Set();

  return (
    <div className="equip-skill-section">
      {showHeading ? <strong className="equip-skill-heading">{title}:</strong> : null}
      {levels.length ? (
        <div className="rarity-effect-list">
          {levels.map((level, index) => (
            <div className="rarity-effect-row" key={`${title}_${level.level}_${level.skill_id}`}>
              <strong className="rarity-effect-title">
                {labelForLevel(level.level)}{level.skill_name ? ` — ${level.skill_name}` : ''}
              </strong>
              <p>
                {(conciseUpgrades
                  ? (index === 0
                    ? level.description
                    : level.upgrade_description || derivedUpgradeDescription(level.description, levels[index - 1]?.description))
                  : highlightSkillUpgrade(level.description, levels[index - 1]?.description, persistentHighlightedValues))
                  || `No visible ${itemType} description linked.`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No {title} levels are linked for this item yet.</p>
      )}
    </div>
  );
}

function ActiveDeploySkillTabs({ item, itemType, activeLevels, deployLevels }) {
  const [selectedTab, setSelectedTab] = useState('active');
  const rawRarity = item.rarity || item.rarity_or_quality || '';
  const idPrefix = `${item.category}-${itemSlug(item.name)}-skill`;
  const tabs = [
    { id: 'active', label: 'Active Skill' },
    { id: 'deploy', label: 'Deploy Skill' },
  ];

  function selectTab(tabId, moveFocus = false) {
    setSelectedTab(tabId);
    if (moveFocus) {
      window.requestAnimationFrame(() => document.getElementById(`${idPrefix}-${tabId}-tab`)?.focus());
    }
  }

  function handleTabKeyDown(event) {
    const currentIndex = tabs.findIndex((tab) => tab.id === selectedTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    selectTab(tabs[nextIndex].id, true);
  }

  return (
    <div className="skill-tabs">
      <div className="skill-tab-list" role="tablist" aria-label={`${item.name} ${itemType} skills`} onKeyDown={handleTabKeyDown}>
        {tabs.map((tab) => {
          const selected = selectedTab === tab.id;
          return (
            <button
              type="button"
              role="tab"
              className={`skill-tab${selected ? ' active' : ''}`}
              id={`${idPrefix}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              key={tab.id}
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="skill-tab-panel"
        role="tabpanel"
        id={`${idPrefix}-${selectedTab}-panel`}
        aria-labelledby={`${idPrefix}-${selectedTab}-tab`}
      >
        {selectedTab === 'active' ? (
          <MountSkillSection
            title="Active Skill"
            levels={activeLevels}
            itemType="Active Skill"
            labelForLevel={(level) => mountActiveSkillLabel(rawRarity, level)}
            showHeading={false}
          />
        ) : (
          <MountSkillSection
            title="Deploy Skill"
            levels={deployLevels}
            itemType="Deploy Skill"
            labelForLevel={mountDeploySkillLabel}
            showHeading={false}
            conciseUpgrades
          />
        )}
      </div>
    </div>
  );
}

function EquipmentDetailTabs({ item }) {
  const [selectedTab, setSelectedTab] = useState('rarity');
  const idPrefix = `${item.category}-${itemSlug(item.name)}-detail`;
  const equipSkills = item.extra?.equipment_equip_skills || [];
  const arcanaUpgrades = item.extra?.equipment_arcana_star_upgrades || [];
  const hasArcana = Boolean(item.extra?.equipment_arcana_name) || arcanaUpgrades.length > 0;
  const tabs = [
    { id: 'rarity', label: 'Rarity Skill' },
    equipSkills.length > 0 ? { id: 'equip', label: 'Equip Skill' } : null,
    hasArcana ? { id: 'arcana', label: 'Arcana' } : null,
  ].filter(Boolean);

  function selectTab(tabId, moveFocus = false) {
    setSelectedTab(tabId);
    if (moveFocus) {
      window.requestAnimationFrame(() => document.getElementById(`${idPrefix}-${tabId}-tab`)?.focus());
    }
  }

  function handleTabKeyDown(event) {
    const currentIndex = tabs.findIndex((tab) => tab.id === selectedTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    selectTab(tabs[nextIndex].id, true);
  }

  return (
    <div className="skill-tabs">
      <div className={`skill-tab-list skill-tab-list-${tabs.length}`} role="tablist" aria-label={`${item.name} equipment details`} onKeyDown={handleTabKeyDown}>
        {tabs.map((tab) => {
          const selected = selectedTab === tab.id;
          return (
            <button
              type="button"
              role="tab"
              className={`skill-tab${selected ? ' active' : ''}`}
              id={`${idPrefix}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              key={tab.id}
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="skill-tab-panel" role="tabpanel" id={`${idPrefix}-${selectedTab}-panel`} aria-labelledby={`${idPrefix}-${selectedTab}-tab`}>
        {selectedTab === 'rarity' ? <RarityEffects effects={item.extra?.equipment_rarity_effects || []} shadeByRarity /> : null}
        {selectedTab === 'equip' ? <EquipSkillEffects skills={equipSkills} showHeading={false} /> : null}
        {selectedTab === 'arcana' ? <EquipmentArcanaStars item={item} /> : null}
      </div>
    </div>
  );
}

function PetDetailTabs({ item }) {
  const [selectedTab, setSelectedTab] = useState('skill');
  const idPrefix = `${item.category}-${itemSlug(item.name)}-detail`;
  const skillLevels = item.extra?.pet_battle_skill_levels || [];
  const arcanaUpgrades = item.extra?.pet_arcana_star_upgrades || [];
  const arcanaName = item.extra?.pet_arcana_name || item.extra?.evolved_name || item.extra?.pet_arcana_item_name || '';
  const tabs = [
    { id: 'skill', label: 'Pet Skill' },
    arcanaUpgrades.length > 0 || arcanaName ? { id: 'arcana', label: 'Arcana' } : null,
  ].filter(Boolean);

  function selectTab(tabId, moveFocus = false) {
    setSelectedTab(tabId);
    if (moveFocus) {
      window.requestAnimationFrame(() => document.getElementById(`${idPrefix}-${tabId}-tab`)?.focus());
    }
  }

  function handleTabKeyDown(event) {
    const currentIndex = tabs.findIndex((tab) => tab.id === selectedTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    selectTab(tabs[nextIndex].id, true);
  }

  return (
    <div className="skill-tabs">
      <div className={`skill-tab-list skill-tab-list-${tabs.length}`} role="tablist" aria-label={`${item.name} pet details`} onKeyDown={handleTabKeyDown}>
        {tabs.map((tab) => {
          const selected = selectedTab === tab.id;
          return (
            <button
              type="button"
              role="tab"
              className={`skill-tab${selected ? ' active' : ''}`}
              id={`${idPrefix}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              key={tab.id}
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="skill-tab-panel" role="tabpanel" id={`${idPrefix}-${selectedTab}-panel`} aria-labelledby={`${idPrefix}-${selectedTab}-tab`}>
        {selectedTab === 'skill' ? <PetBattleSkillLevels levels={skillLevels} /> : null}
        {selectedTab === 'arcana' ? <PetArcanaStars item={item} /> : null}
      </div>
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
          const cardRarity = itemCardRarity(item);
          return (
            <button
              type="button"
              className={`index-item-card ${rarityClassName(cardRarity)}`}
              style={rarityCardStyle(cardRarity)}
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
      renderDetail={(item) => <RarityEffects effects={item.extra?.rarity_effects || []} shadeByRarity />}
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
      renderDetail={(item) => <EquipmentDetailTabs key={item.name} item={item} />}
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
      renderDetail={(item) => <PetDetailTabs key={item.name} item={item} />}
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
      renderDetail={(item) => (
        <ActiveDeploySkillTabs
          key={item.name}
          item={item}
          itemType="mount"
          activeLevels={item.extra?.mount_skill_levels || []}
          deployLevels={item.extra?.riding_skill_levels || []}
        />
      )}
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
      renderDetail={(item) => (
        <ActiveDeploySkillTabs
          key={item.name}
          item={item}
          itemType="artifact"
          activeLevels={item.extra?.artifact_active_skill_levels || []}
          deployLevels={item.extra?.artifact_deploy_skill_levels || []}
        />
      )}
    />
  );
}

function collectibleEffectValue(effect) {
  if (!effect) return '—';
  if (effect.formatted_value !== undefined && effect.formatted_value !== null) return effect.formatted_value;
  if (effect.value === undefined || effect.value === null || effect.value === '') return '—';
  return `${effect.value}${effect.unit === 'percent' ? '%' : ''}`;
}

function parseCollectibleEffect(value) {
  const match = String(value || '').trim().match(/^(.*):\s*([^:]+)$/);
  if (!match) return null;
  return { stat: match[1].trim(), formatted_value: match[2].trim() };
}

function collectibleEffectTracks(effect) {
  const cumulative = effect.cumulative_effects?.[0];
  const additional = effect.additional_star_effects?.[0];
  if (cumulative && additional) return { cumulative, additional };

  const descriptionMatch = String(effect.description || '').match(
    /^Cumulative at this star — (.*?)\.\s*Additional star-linked effect — (.*)$/
  );

  return {
    cumulative: cumulative || parseCollectibleEffect(descriptionMatch?.[1]),
    additional: additional || parseCollectibleEffect(descriptionMatch?.[2]),
  };
}

function collectibleStatLabel(value) {
  return value === 'Maximum HP' ? 'HP' : value;
}

function CollectibleEffectsTable({ effects = [] }) {
  if (!effects.length) {
    return <p className="muted">No star effects are linked for this collectible yet.</p>;
  }

  const rows = effects.map((effect) => ({ ...effect, ...collectibleEffectTracks(effect) }));
  const baseStat = collectibleStatLabel(rows.find((effect) => effect.cumulative)?.cumulative.stat) || 'Base Effect';
  const additionalStat = collectibleStatLabel(rows.find((effect) => effect.additional)?.additional.stat) || 'Additional Effect';

  return (
    <div className="mythic-stat-table-wrap collectible-effect-table-wrap">
      <table className="mythic-stat-table collectible-effect-table">
        <thead>
          <tr>
            <th scope="col">Star</th>
            <th scope="col">{baseStat}</th>
            <th scope="col">{additionalStat}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((effect) => (
            <tr key={`collectible_effect_${effect.star}`}>
              <th scope="row">{effect.star}★</th>
              <td>{collectibleEffectValue(effect.cumulative)}</td>
              <td>{collectibleEffectValue(effect.additional)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollectibleCatalog({ items, routeItems, routeTarget, setRouteTarget }) {
  return (
    <ItemCardGrid
      items={items}
      routeItems={routeItems}
      category="collectible"
      routeTarget={routeTarget}
      setRouteTarget={setRouteTarget}
      renderDetail={(item) => (
        <CollectibleEffectsTable effects={item.extra?.collectible_star_effects || []} />
      )}
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

  if (category === 'collectible') {
    return <CollectibleCatalog items={items} {...routeProps} />;
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
  const [excludedRarities, setExcludedRarities] = useState(() => new Set());
  const [equipmentType, setEquipmentType] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  function applyRouteTarget(nextRouteTarget) {
    setRouteTarget(nextRouteTarget);
    if (!nextRouteTarget) return;

    setCategory(nextRouteTarget.category);
    setQ('');
    setExcludedRarities(new Set());
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
    setExcludedRarities(new Set());
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
      if (excludedRarities.has(itemRarity(item))) return false;
      if (category === 'gem' && equipmentType && item.subtype !== equipmentType) return false;
      return true;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [category, equipmentType, excludedRarities, items]);

  const countText = useMemo(() => `${displayItems.length} item${displayItems.length === 1 ? '' : 's'}`, [displayItems]);
  const hasRarity = rarityOptions.length > 0;
  const hasEquipmentType = equipmentTypeOptions.length > 0;

  function changeCategory(nextCategory) {
    setCategory(nextCategory);
    setRouteTarget(null);
    window.history.pushState(null, '', indexRoutePath());
  }

  function toggleRarity(rarity) {
    setExcludedRarities((current) => {
      const next = new Set(current);
      if (next.has(rarity)) next.delete(rarity);
      else next.add(rarity);
      return next;
    });
  }

  return (
    <main>
      <div className="page-header index-page-header">
        <div>
          <div className="eyebrow"><span />Browse the archive</div>
          <h1>The Index</h1>
        </div>
        <span className="pill">{countText}</span>
      </div>
      <section className="panel">
        <div className={`grid index-filter-grid${hasEquipmentType ? ' has-equipment-filter' : ''}`}>
          <label className="field index-filter-control">
            <span className="index-filter-control-header"><strong>Category</strong></span>
            <select value={category} onChange={(event) => changeCategory(event.target.value)}>{SORTED_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select>
          </label>
          <label className="field index-filter-control">
            <span className="index-filter-control-header"><strong>Search</strong></span>
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name of item..." />
          </label>
          {hasRarity ? (
            <fieldset className="field rarity-filter">
              <legend className="rarity-filter-legend">Rarity</legend>
              <div className="rarity-filter-header">
                <strong>Rarity</strong>
                <button type="button" className="rarity-filter-reset" disabled={excludedRarities.size === 0} onClick={() => setExcludedRarities(new Set())}>Show all</button>
              </div>
              <div className="rarity-toggle-list">
                {rarityOptions.map((value) => {
                  const isIncluded = !excludedRarities.has(value);
                  return <button type="button" className="rarity-toggle" aria-pressed={isIncluded} key={value} onClick={() => toggleRarity(value)}>{value}</button>;
                })}
              </div>
            </fieldset>
          ) : null}
          {hasEquipmentType ? (
            <label className="field index-filter-control">
              <span className="index-filter-control-header"><strong>Equipment</strong></span>
              <select value={equipmentType} onChange={(event) => setEquipmentType(event.target.value)}><option value="">All Equipment</option>{equipmentTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </label>
          ) : null}
        </div>
      </section>
      <CatalogTable category={category} items={displayItems} routeItems={items} routeTarget={routeTarget} setRouteTarget={setRouteTarget} />
      {message ? <div className="toast">{message}</div> : null}
    </main>
  );
}
