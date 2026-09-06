import { getItem } from '../../../../../shared/data.server';

export function data({ routeParams }: { routeParams: { id: string } }) {
  const { id, name } = getItem(routeParams.id);

  return { id: String(id), name };
}
