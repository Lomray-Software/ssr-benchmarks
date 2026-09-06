import { useData } from 'vike-react/useData';
import type { loadItems } from '../../../../../shared/data.server';
import { Items } from '../../../../../shared/ui';

export default function Page() {
  return <Items items={useData<Awaited<ReturnType<typeof loadItems>>>()} />;
}
