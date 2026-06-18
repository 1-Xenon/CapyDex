import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const CATEGORIES = ['adventurer', 'hero', 'brand', 'equipment', 'gem', 'pet', 'pet_armament', 'mount', 'artifact', 'mythic_treasure'];
const RARITY_ORDER = ['Common', 'Great', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Immortal', 'Arcana', 'Transcendent', 'Peerless'];

function itemRarity(item) {
  const value = item.rarity || item.rarity_or_quality || '';
  if ((item.category === 'mount' || item.category === 'artifact') && value === 'Arcana') return 'Transcendent';
  return value === 'Quality-dependent' ? '' : value;
}

function categoryLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
          <strong className="rarity-effect-title">{effect.rarity}</strong>
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

function ItemCardGrid({ items, category, renderDetail, renderCardMeta }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <>
      <div className={`index-card-grid index-card-grid-${category}`}>
        {items.map((item, index) => {
          const rarity = itemRarity(item);
          return (
            <button
              type="button"
              className="index-item-card"
              key={`${item.category}_${item.name}_${index}`}
              onClick={() => setSelectedItem(item)}
            >
              <span className="index-item-name">{item.name}</span>
              {renderCardMeta ? renderCardMeta(item) : null}
              {rarity ? <small>{rarity}</small> : null}
            </button>
          );
        })}
      </div>

      {selectedItem ? (
        <div className="index-modal-backdrop" role="presentation" onClick={() => setSelectedItem(null)}>
          <section className="index-modal" role="dialog" aria-modal="true" aria-label={`${selectedItem.name} details`} onClick={(event) => event.stopPropagation()}>
            <header className="index-modal-header">
              <div>
                <span className="pill">{categoryLabel(category)}</span>
                <h2>{selectedItem.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)}>Close</button>
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

function AdventurerCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="adventurer"
      renderDetail={(item) => <AdventurerStarEffects effects={item.extra?.adventurer_star_effects || []} />}
    />
  );
}

function HeroBrandCatalog({ category, items }) {
  return (
    <ItemCardGrid
      items={items}
      category={category}
      renderDetail={(item) => <RarityEffects effects={item.extra?.rarity_effects || []} />}
    />
  );
}

function EquipmentCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="equipment"
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

function GemCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="gem"
      renderCardMeta={(item) => item.subtype ? <small className="index-item-equipment">{item.subtype}</small> : null}
      renderDetail={(item) => <GemRarityEffects effects={item.extra?.gem_rarity_effects || []} />}
    />
  );
}

function PetCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="pet"
      renderDetail={(item) => (
        <>
          <PetBattleSkillLevels levels={item.extra?.pet_battle_skill_levels || []} />
          <PetArcanaStars item={item} />
        </>
      )}
    />
  );
}


function PetArmamentCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="pet_armament"
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

function MountCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="mount"
      renderDetail={(item) => {
        const rawRarity = item.rarity || item.rarity_or_quality || '';
        return (
          <>
            <MountSkillSection
              title="Active Skill"
              levels={item.extra?.riding_skill_levels || []}
              itemType="Active Skill"
              labelForLevel={(level) => mountActiveSkillLabel(rawRarity, level)}
            />
            <MountSkillSection
              title="Deploy Skill"
              levels={item.extra?.mount_skill_levels || []}
              itemType="Deploy Skill"
              labelForLevel={mountDeploySkillLabel}
            />
          </>
        );
      }}
    />
  );
}

function ArtifactCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="artifact"
      renderDetail={(item) => {
        const rawRarity = item.rarity || item.rarity_or_quality || '';
        return (
          <>
            <MountSkillSection
              title="Active Skill"
              levels={item.extra?.artifact_deploy_skill_levels || []}
              itemType="Active Skill"
              labelForLevel={(level) => mountActiveSkillLabel(rawRarity, level)}
            />
            <MountSkillSection
              title="Deploy Skill"
              levels={item.extra?.artifact_active_skill_levels || []}
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

function MythicTreasureCatalog({ items }) {
  return (
    <ItemCardGrid
      items={items}
      category="mythic_treasure"
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

function GenericCatalog({ category, items }) {
  return (
    <ItemCardGrid
      items={items}
      category={category}
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

function CatalogTable({ category, items }) {
  if (category === 'adventurer') {
    return <AdventurerCatalog items={items} />;
  }

  if (category === 'hero' || category === 'brand') {
    return <HeroBrandCatalog category={category} items={items} />;
  }

  if (category === 'equipment') {
    return <EquipmentCatalog items={items} />;
  }

  if (category === 'gem') {
    return <GemCatalog items={items} />;
  }

  if (category === 'pet') {
    return <PetCatalog items={items} />;
  }

  if (category === 'pet_armament') {
    return <PetArmamentCatalog items={items} />;
  }

  if (category === 'mount') {
    return <MountCatalog items={items} />;
  }

  if (category === 'artifact') {
    return <ArtifactCatalog items={items} />;
  }

  if (category === 'mythic_treasure') {
    return <MythicTreasureCatalog items={items} />;
  }

  return <GenericCatalog category={category} items={items} />;
}

export default function Index() {
  const [category, setCategory] = useState('adventurer');
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

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

  return (
    <main>
      <div className="page-header"><div><h1>Index</h1><p>Browse item skills, rarity effects, levels, and progression details.</p></div><span className="pill">{countText}</span></div>
      <section className="panel">
        <div className={`grid index-filter-grid${hasRarity || hasEquipmentType ? ' has-extra-filter' : ''}`}>
          <label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
          <label className="field"><span>Search</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name or effect text..." /></label>
          {hasRarity ? <label className="field"><span>Rarity</span><select value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="">All rarities</option>{rarityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
          {hasEquipmentType ? <label className="field"><span>Equipment</span><select value={equipmentType} onChange={(event) => setEquipmentType(event.target.value)}><option value="">All equipment</option>{equipmentTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
        </div>
      </section>
      <CatalogTable category={category} items={displayItems} />
      {message ? <div className="toast">{message}</div> : null}
    </main>
  );
}
