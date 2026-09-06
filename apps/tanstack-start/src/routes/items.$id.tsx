import { Await, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { Detail, Deferred, Pending } from '../../../../shared/ui';
import { getDetail } from '../data';

export const Route = createFileRoute('/items/$id')({
  loader: ({ params }) => getDetail({ data: params.id }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();

  return (
    <Detail name={data.name}>
      <Suspense fallback={<Pending />}>
        <Await promise={data.deferred}>{(value) => <Deferred value={value} />}</Await>
      </Suspense>
    </Detail>
  );
}
