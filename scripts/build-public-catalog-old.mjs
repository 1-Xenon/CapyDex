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
  'mythic_treasure'
]);
const IMAGE_FIELDS = ['image', 'image_id', 'imageId', 'icon', 'icon_id', 'iconId', 'sprite', 'sprite_id', 'spriteId'];

const compactEffects = (effects = []) =>
  effects.map(({ rarity, star, title, description, source_text }) =>
    Object.fromEntries(
      Object.entries({ rarity, star, title, description, source_text }).filter(([, value]) => value != null)
    )
  );

const compactLevels = (levels = []) =>
  levels.map(({ level, skill_name, awakening_star, description }) =>
    Object.fromEntries(
      Object.entries({ level, skill_name, awakening_star, description }).filter(([, value]) => value != null)
    )
  );

const compactMythicStats = (stats) => {
  if (!stats) return undefined;
  return {
    columns: (stats.columns || []).map(({ label, is_percent }) => ({ label, is_percent })),
    rows: (stats.rows || []).map((row) => ({
      star: row.star,
      values: (row.values || []).map(({ raw_value }) => ({ raw_value }))
    }))
  };
};

const compactMythicEffects = (effects = []) =>
  effects.map(({ star, description }) => ({ star, description }));

function compactExtra(item) {
  const extra = item.extra || {};
  const output = {};

  if (extra.adventurer_star_effects) output.adventurer_star_effects = compactEffects(extra.adventurer_star_effects);
  if (extra.rarity_effects) output.rarity_effects = compactEffects(extra.rarity_effects);
  if (extra.equipment_rarity_effects) output.equipment_rarity_effects = compactEffects(extra.equipment_rarity_effects);
  if (extra.equipment_equip_skills) output.equipment_equip_skills = compactEffects(extra.equipment_equip_skills);
  if (extra.equipment_arcana_name) output.equipment_arcana_name = extra.equipment_arcana_name;
  if (extra.equipment_arcana_star_upgrades) output.equipment_arcana_star_upgrades = compactEffects(extra.equipment_arcana_star_upgrades);
  if (extra.gem_rarity_effects) output.gem_rarity_effects = compactEffects(extra.gem_rarity_effects);
  if (extra.pet_battle_skill_levels) output.pet_battle_skill_levels = compactLevels(extra.pet_battle_skill_levels);
  if (extra.pet_arcana_name) output.pet_arcana_name = extra.pet_arcana_name;
  if (extra.evolved_name) output.evolved_name = extra.evolved_name;
  if (extra.pet_arcana_item_name) output.pet_arcana_item_name = extra.pet_arcana_item_name;
  if (extra.pet_arcana_star_upgrades) output.pet_arcana_star_upgrades = compactEffects(extra.pet_arcana_star_upgrades);
  if (extra.pet_armament_skill_name) output.pet_armament_skill_name = extra.pet_armament_skill_name;
  if (extra.pet_armament_skill_levels) output.pet_armament_skill_levels = compactLevels(extra.pet_armament_skill_levels);
  if (extra.riding_skill_levels) output.riding_skill_levels = compactLevels(extra.riding_skill_levels);
  if (extra.mount_skill_levels) output.mount_skill_levels = compactLevels(extra.mount_skill_levels);
  if (extra.artifact_active_skill_levels) output.artifact_active_skill_levels = compactLevels(extra.artifact_active_skill_levels);
  if (extra.artifact_deploy_skill_levels) output.artifact_deploy_skill_levels = compactLevels(extra.artifact_deploy_skill_levels);
  if (extra.mythic_treasure_base_stats) output.mythic_treasure_base_stats = compactMythicStats(extra.mythic_treasure_base_stats);
  if (extra.mythic_treasure_equipment_effects) output.mythic_treasure_equipment_effects = compactMythicEffects(extra.mythic_treasure_equipment_effects);

  return output;
}

const items = source.items
  .filter((item) => categories.has(item.category))
  .map((item) => {
    const output = { category: item.category, name: item.name };
    if (item.image_id) output.image_id = item.image_id;
    const rarity = item.rarity || item.rarity_or_quality;
    if (rarity) output.rarity = rarity;
    if (item.subtype) output.subtype = item.subtype;
    const imageField = IMAGE_FIELDS.find((field) => item[field] || item.extra?.[field]);
    if (imageField) output.image_id = item[imageField] || item.extra?.[imageField];
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
