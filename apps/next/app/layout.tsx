import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { Shell } from '../../../shared/ui';
import '../../../shared/style.css';

export const metadata = { title: 'SSR benchmark', icons: { icon: 'data:,' } };

export default async function Layout({ children }: { children: ReactNode }) {
  await connection();

  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
