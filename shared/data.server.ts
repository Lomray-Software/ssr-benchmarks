import items from '../data/items.json';

export const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function getItem(id: string) {
  const item = items.find((entry) => String(entry.id) === id);

  if (!item) throw new Error('Item not found');

  return item;
}

export async function loadItems() {
  await delay(100);

  return items.map(({ id, name }) => ({ id, name }));
}

export async function loadDeferred(id: string) {
  await delay(800);

  return getItem(id).description;
}

export function loadDetail(id: string) {
  const { name } = getItem(id);

  return { id, name, deferred: loadDeferred(id) };
}
