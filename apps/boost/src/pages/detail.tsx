import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { Detail, Deferred, Pending } from '../../../../shared/ui';

export async function loader({ params }: LoaderFunctionArgs) {
  if (!import.meta.env.SSR) throw new Error('This benchmark uses document navigation.');

  const { loadDetail } = await import('../../../../shared/data.server');

  return loadDetail(params.id!);
}

export function Component() {
  const data = useLoaderData<typeof loader>();

  return (
    <Detail name={data.name}>
      <Suspense fallback={<Pending />}>
        <Await resolve={data.deferred}>{(value: string) => <Deferred value={value} />}</Await>
      </Suspense>
    </Detail>
  );
}
