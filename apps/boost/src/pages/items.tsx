import { useLoaderData } from 'react-router';
import { Items } from '../../../../shared/ui';

// Ordinary anchors in the shared UI always request a new server-rendered document.
export async function loader() {
  if (!import.meta.env.SSR) throw new Error('This benchmark uses document navigation.');

  const { loadItems } = await import('../../../../shared/data.server');

  return loadItems();
}

export function Component() {
  return <Items items={useLoaderData<typeof loader>()} />;
}
