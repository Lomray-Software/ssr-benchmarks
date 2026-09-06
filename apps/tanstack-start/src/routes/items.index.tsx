import { createFileRoute } from '@tanstack/react-router';
import { Items } from '../../../../shared/ui';
import { getItems } from '../data';

export const Route = createFileRoute('/items/')({ loader: () => getItems(), component: Page });

function Page() {
  return <Items items={Route.useLoaderData()} />;
}
