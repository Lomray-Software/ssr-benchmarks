import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('items', 'routes/items.tsx'),
  route('items/:id', 'routes/detail.tsx'),
];
