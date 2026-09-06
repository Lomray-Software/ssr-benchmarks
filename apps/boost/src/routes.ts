import { Home } from '../../../shared/ui';

const routes = [
  { path: '/', Component: Home },
  { path: '/items', lazy: () => import('./pages/items') },
  { path: '/items/:id', lazy: () => import('./pages/detail') },
];

export default routes;
