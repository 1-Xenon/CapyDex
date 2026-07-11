import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error('Usage: node scripts/build-public-catalog.mjs <private-catalog.seed.json>');
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const categories = new Set([
  'adventurer',
  'hero',
  'brand',
  'equipment',
  'gem',
  'pet',
  'pet_armament',
  'mount',
  'artifact',
  'collectible',
  'mythic_treasure'
]);

const IMAGE_FIELDS = [
  'image',
  'image_id',
  'imageId',
  'icon',
  'icon_id',
  'iconId',
  'sprite',
  'sprite_id',
  'spriteId'
];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const sHeroNames = new Set([
  "April O'Neil",
  'Bone King',
  'Dark Knight',
  'Flame-Heart Succubus',
  'Ghost Princess',
  'Judgement Reaper',
  'Knight of the End',
  'Legendary Ranger',
  'Splinter',
  'Spring Orchid'
].map(normalizeName));
const excludedBrandNames = new Set([
  'Bonelet',
  'Crybaby',
  'Ghost Doll',
  'Legendary Knight',
  'Little Knight',
  'Scout',
  'Skeleton Lord',
  'Windstrider'
].map(normalizeName));
const ssBrandNames = new Set([
  'Alien UFO',
  'Brutal Wild Vulture',
  'Cleopatra',
  'Frankenstein',
  'Naga Siren',
  'Ootengu',
  'Prince of Sanctuary',
  'Mechanical Magic Eye',
  'Silly Sorcerer',
  'Thousand-Change Demon Eye',
  'White Robe Wizard',
  'White Tiger'
].map(normalizeName));
const sBrandNames = new Set([
  'Fantasy Joker',
  'Lava Giant',
  'Mecha Titan',
  'Phantom Assassin',
  'Skeleton Spellblade',
  'Stone Guardian',
  'Undead Swordsman',
  'Wild Vulture',
  'Wise Archdemon'
].map(normalizeName));
const collectibleRarities = new Map(
  Object.entries({
    Mythic: [
      "Aladdin's Lamp", 'Windwalker Boots', 'Sword in the Stone', "Saint's Relic", 'Giant Slayer',
      'King of the Salty Fish', 'Mysterious Egg', 'Wave-Treading Dragon Boat', 'Summer Good Coconut',
      '1st Anniversary Cake', 'Candy Gacha Machine', 'Sapling', 'Fragrant Boat', 'Hydra Poison Arrow',
      'Pizza', 'Mystic Dice', 'Egg Yolk Mooncake', 'Ceramics Horse'
    ],
    Legendary: [
      "Challenger's Badge", 'Iron Throne', "Mage's Bane", 'Heroic Brooch', 'Aegis Shield',
      '"Lucky Four-Leaf Clover"', 'Hungry Eye', 'Blade Armor', 'Horn of Plenty', 'Royal Roses',
      'Origin Staff', 'Eternal Lance', "Gladiator's Helm", 'Treasure Compass', 'Golden Apple',
      'Pot of Treasure', "Lion King's Shield", 'Lucky Rabbit Foot', "Flame's Delight", 'Oceanic Trident',
      'Darkmoon Card', 'Golden Armor', 'Sacred Anvil'
    ],
    Epic: [
      'Petals of Hope', "Frost Giant's Hand", "Keats' Ghost Ship", 'Infinite Blade', "Giant's Heart",
      "Devil's Blood", 'Forbidden Knowledge', "Titan's Sword", 'Destruction Hat'
    ],
    Rare: ["Alchemist's Lamp", 'Eternal Torch', 'Star Shard', 'Arcane Cloak', 'Holy Grail', 'Golden Hourglass']
  }).flatMap(([rarity, names]) => names.map((name) => [normalizeName(name), rarity]))
);

const collectibleOverridesByRawId = new Map([
  [351005, { name: 'Holy Grail', image_id: 'icon_351005' }],
  [358012, { name: 'Sapling', image_id: 'icon_358012' }],
  [358013, { name: 'Fragrant Boat', image_id: 'icon_358013' }]
]);

const compactObject = (object, keys) =>
  Object.fromEntries(
    keys
      .map((key) => [key, object?.[key]])
      .filter(([, value]) => value != null)
  );

const compactMaybeList = (value, mapper) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(mapper);
  return mapper(value);
};

const compactEffects = (effects) =>
  compactMaybeList(effects, (effect) =>
    compactObject(effect, ['rarity', 'star', 'title', 'description', 'source_text'])
  );

const compactCollectibleEffects = (effects) =>
  compactMaybeList(effects, (effect) => ({
    star: effect.star,
    description: effect.description,
    cumulative_effects: compactMaybeList(effect.cumulative_effects || [], (value) =>
      compactObject(value, ['stat', 'value', 'unit', 'formatted_value'])
    ),
    additional_star_effects: compactMaybeList(effect.additional_star_effects || [], (value) =>
      compactObject(value, ['stat', 'value', 'unit', 'formatted_value'])
    )
  }));

const compactLevels = (levels) =>
  compactMaybeList(levels, (level) =>
    compactObject(level, ['level', 'skill_name', 'awakening_star', 'description', 'upgrade_description'])
  );

const compactMythicStats = (stats) => {
  if (stats == null) return stats;

  return {
    columns: (stats.columns || []).map(({ label, is_percent }) => ({ label, is_percent })),
    rows: (stats.rows || []).map((row) => ({
      star: row.star,
      values: (row.values || []).map(({ raw_value }) => ({ raw_value }))
    }))
  };
};

const compactMythicEffects = (effects) =>
  compactMaybeList(effects, ({ star, description }) => ({ star, description }));

function compactExtra(item) {
  const extra = item.extra || {};
  const output = {};

  if (hasOwn(extra, 'adventurer_star_effects')) output.adventurer_star_effects = compactEffects(extra.adventurer_star_effects);
  if (hasOwn(extra, 'rarity_effects')) output.rarity_effects = compactEffects(extra.rarity_effects);
  if (hasOwn(extra, 'equipment_rarity_effects')) output.equipment_rarity_effects = compactEffects(extra.equipment_rarity_effects);
  if (hasOwn(extra, 'equipment_equip_skills')) output.equipment_equip_skills = compactEffects(extra.equipment_equip_skills);
  if (hasOwn(extra, 'equipment_arcana_name')) output.equipment_arcana_name = extra.equipment_arcana_name;
  if (hasOwn(extra, 'equipment_arcana_star_upgrades')) output.equipment_arcana_star_upgrades = compactEffects(extra.equipment_arcana_star_upgrades);
  if (hasOwn(extra, 'gem_rarity_effects')) output.gem_rarity_effects = compactEffects(extra.gem_rarity_effects);
  if (hasOwn(extra, 'pet_battle_skill_levels')) output.pet_battle_skill_levels = compactLevels(extra.pet_battle_skill_levels);
  if (hasOwn(extra, 'pet_arcana_name')) output.pet_arcana_name = extra.pet_arcana_name;
  if (hasOwn(extra, 'evolved_name')) output.evolved_name = extra.evolved_name;
  if (hasOwn(extra, 'pet_arcana_item_name')) output.pet_arcana_item_name = extra.pet_arcana_item_name;
  if (hasOwn(extra, 'pet_arcana_star_upgrades')) output.pet_arcana_star_upgrades = compactEffects(extra.pet_arcana_star_upgrades);
  if (hasOwn(extra, 'pet_armament_skill_name')) output.pet_armament_skill_name = extra.pet_armament_skill_name;
  if (hasOwn(extra, 'pet_armament_skill_levels')) output.pet_armament_skill_levels = compactLevels(extra.pet_armament_skill_levels);
  if (hasOwn(extra, 'riding_skill_levels')) output.riding_skill_levels = compactLevels(extra.riding_skill_levels);
  if (hasOwn(extra, 'mount_skill_levels')) output.mount_skill_levels = compactLevels(extra.mount_skill_levels);
  if (hasOwn(extra, 'artifact_active_skill_levels')) output.artifact_active_skill_levels = compactLevels(extra.artifact_active_skill_levels);
  if (hasOwn(extra, 'artifact_deploy_skill_levels')) output.artifact_deploy_skill_levels = compactLevels(extra.artifact_deploy_skill_levels);
  if (hasOwn(extra, 'collectible_star_effects')) output.collectible_star_effects = compactCollectibleEffects(extra.collectible_star_effects);
  if (hasOwn(extra, 'mythic_treasure_base_stats')) output.mythic_treasure_base_stats = compactMythicStats(extra.mythic_treasure_base_stats);
  if (hasOwn(extra, 'mythic_treasure_equipment_effects')) output.mythic_treasure_equipment_effects = compactMythicEffects(extra.mythic_treasure_equipment_effects);

  return output;
}

function isPublicCatalogItem(item) {
  if (!categories.has(item.category)) return false;
  if (item.category === 'brand' && excludedBrandNames.has(normalizeName(item.name))) return false;
  if (item.category !== 'collectible') return true;

  const override = collectibleOverridesByRawId.get(Number(item.raw_id));
  const name = override?.name || item.name;
  const imageId = override?.image_id || IMAGE_FIELDS
    .map((field) => item[field] || item.extra?.[field])
    .find(Boolean);

  return Boolean(
    collectibleRarities.has(normalizeName(name))
    && imageId
    && item.extra?.collectible_star_effects?.length
    && (normalizeName(name) !== normalizeName('Holy Grail') || Number(item.raw_id) === 351005)
  );
}

const items = source.items
  .filter(isPublicCatalogItem)
  .map((item) => {
    const collectibleOverride = item.category === 'collectible'
      ? collectibleOverridesByRawId.get(Number(item.raw_id))
      : null;
    const name = collectibleOverride?.name || item.name;
    const output = { category: item.category, name };

    if (collectibleOverride?.image_id || item.image_id) output.image_id = collectibleOverride?.image_id || item.image_id;

    const rarity = item.category === 'collectible'
      ? collectibleRarities.get(normalizeName(name))
      : item.category === 'hero'
        ? (sHeroNames.has(normalizeName(name)) ? 'S' : 'Non-S')
        : item.category === 'brand'
          ? (ssBrandNames.has(normalizeName(name)) ? 'SS' : sBrandNames.has(normalizeName(name)) ? 'S' : 'Non-S')
        : item.rarity || item.rarity_or_quality;
    if (rarity) output.rarity = rarity;

    if (item.subtype) output.subtype = item.subtype;

    const imageField = IMAGE_FIELDS.find((field) => item[field] || item.extra?.[field]);
    if (!collectibleOverride?.image_id && imageField) output.image_id = item[imageField] || item.extra?.[imageField];

    const extra = compactExtra(item);
    if (Object.keys(extra).length) output.extra = extra;

    return output;
  });

const output = {
  metadata: {
    title: 'Capybara Go Index',
    table_version: '1.8.14',
    public_item_count: items.length
  },
  items
};

fs.writeFileSync(path.join(ROOT, 'public', 'data', 'catalog.json'), JSON.stringify(output));
console.log(`Wrote ${items.length} public Index entries.`);
