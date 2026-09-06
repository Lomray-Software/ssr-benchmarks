import { createServerFn } from '@tanstack/react-start';
import { loadItems, loadDetail } from '../../../shared/data.server';

export const getItems = createServerFn({ method: 'GET' }).handler(() => loadItems());

export const getDetail = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => loadDetail(data));
