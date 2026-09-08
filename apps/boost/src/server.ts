import entryServer from '@lomray/vite-ssr-boost/adapters/express/entry';
import App from './app';
import routes from './routes';

/** Expose the compiled application to runtime launchers without rebuilding its source. */
export { App, routes };

export default entryServer(App, routes);
