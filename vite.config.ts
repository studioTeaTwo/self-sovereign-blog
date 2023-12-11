import { sveltekit } from '@sveltejs/kit/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills()],
	// allows vite access to ./posts
	server: {
		fs: {
			allow: ['./']
		}
	}
});
