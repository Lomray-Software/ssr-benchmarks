import entryClient from '@lomray/vite-ssr-boost/browser/entry';
import App from './app';
import routes from './routes';

void entryClient(App, routes);
