import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { loadDetail } from '../../../../shared/data.server';
import { Detail, Deferred, Pending } from '../../../../shared/ui';

export const loader = ({ params }: LoaderFunctionArgs) => loadDetail(params.id!);

export default function Page() {
  const data = useLoaderData<typeof loader>();

  return (
    <Detail name={data.name}>
      <Suspense fallback={<Pending />}>
        <Await resolve={data.deferred}>{(value: string) => <Deferred value={value} />}</Await>
      </Suspense>
    </Detail>
  );
}
