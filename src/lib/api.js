let catalogPromise;

function loadCatalog() {
  catalogPromise ||= fetch(`${import.meta.env.BASE_URL}data/catalog.json`, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`Unable to load Index data: ${response.status}`);
    return response.json();
  });
  return catalogPromise;
}

function searchableText(item) {
  return JSON.stringify({
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    subtype: item.subtype,
    extra: item.extra
  }).toLowerCase();
}

export const api = {
  async catalog({ category = '', q = '' } = {}) {
    const catalog = await loadCatalog();
    const query = q.trim().toLowerCase();
    const items = catalog.items.filter((item) => {
      if (category && item.category !== category) return false;
      return !query || searchableText(item).includes(query);
    });
    return { metadata: catalog.metadata, items };
  }
};
