import { useLoaderData } from 'react-router';
import { loadItems } from '../../../../shared/data.server';
import { Items } from '../../../../shared/ui';

export const loader = () => loadItems();

export default function Page() {
  return <Items items={useLoaderData<typeof loader>()} />;
}
