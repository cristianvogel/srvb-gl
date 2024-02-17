import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// A helper plugin which specifically watches for changes to public/dsp.main.js,
// which is built in a parallel watch job via esbuild during dev.
//
// We can still use Vite's HMR to send a custom reload-dsp event, which is caught
// inside the webview and propagated to native to reinitialize the embedded js engine.
//
// During production builds, this all gets pruned from the bundle.
function pubDirReloadPlugin() {
  return {
    name: 'pubDirReload',
    handleHotUpdate({ file, modules, server }) {
      if (file.includes('public/dsp.main.js' || 'public/nel-vcs-24/js/patch.js')) {
        server.ws.send({
          type: 'custom',
          event: 'reload-dsp',
        });
      }

      return modules;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte(), pubDirReloadPlugin()],
  server: {
    watch: {
      // The paths to be added to the watch list
      include: ['public/nel-vcs-24/js/patch.js'],
    }
  }
})
