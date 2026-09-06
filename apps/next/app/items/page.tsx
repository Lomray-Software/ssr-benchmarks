import { loadItems } from '../../../../shared/data.server';
import { Items } from '../../../../shared/ui';

export default async function Page() {
  return <Items items={await loadItems()} />;
}
