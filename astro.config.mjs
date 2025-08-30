import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: 'https://shigagolf-reviews.netlify.app',
  integrations: [tailwind()],
});