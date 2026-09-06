import { Suspense } from 'react';
import { loadDetail } from '../../../../../shared/data.server';
import { Detail, Deferred, Pending } from '../../../../../shared/ui';

async function Slow({ value }: { value: Promise<string> }) {
  return <Deferred value={await value} />;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = loadDetail(id);

  return (
    <Detail name={data.name}>
      <Suspense fallback={<Pending />}>
        <Slow value={data.deferred} />
      </Suspense>
    </Detail>
  );
}
