import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import css from '../../../../shared/style.css?url';
import { Shell } from '../../../../shared/ui';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'SSR benchmark' },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: 'data:,' },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Shell>
          <Outlet />
        </Shell>
        <Scripts />
      </body>
    </html>
  );
}
