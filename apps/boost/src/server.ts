import entryServer from '@lomray/vite-ssr-boost/adapters/express/entry';
import App from './app';
import routes from './routes';

export default entryServer(App, routes);
