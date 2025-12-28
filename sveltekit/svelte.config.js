import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages:'_build',
			assets:'_build'
		}),
		prerender:{
			handleHttpError:'ignore',
		}
	}
};

export default config;
