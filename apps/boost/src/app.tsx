import type { PropsWithChildren } from 'react';
import { Shell } from '../../../shared/ui';
import '../../../shared/style.css';

export default function App({ children }: PropsWithChildren) {
  return <Shell>{children}</Shell>;
}
