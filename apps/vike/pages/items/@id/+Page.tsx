import { Suspense } from 'react';
import { useAsync } from 'react-streaming';
import { useData } from 'vike-react/useData';
import { Detail, Deferred, Pending } from '../../../../../shared/ui';

function Slow({ id }: { id: string }) {
  const value = useAsync(['item-detail', id], async () => {
    if (!import.meta.env.SSR) throw new Error('This benchmark uses document navigation.');

    const { loadDeferred } = await import('../../../../../shared/data.server');

    return loadDeferred(id);
  });

  return <Deferred value={value} />;
}

export default function Page() {
  const data = useData<{ id: string; name: string }>();

  return (
    <Detail name={data.name}>
      <Suspense fallback={<Pending />}>
        <Slow id={data.id} />
      </Suspense>
    </Detail>
  );
}
