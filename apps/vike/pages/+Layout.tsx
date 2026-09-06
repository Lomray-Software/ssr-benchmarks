import type { PropsWithChildren } from 'react';
import { Shell } from '../../../shared/ui';
import '../../../shared/style.css';

export default function Layout({ children }: PropsWithChildren) {
  return <Shell>{children}</Shell>;
}
