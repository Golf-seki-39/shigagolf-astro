import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://shigagolf-reviews.netlify.app',
  integrations: [tailwind()],
  
  // ★★★ 変更点はこの "output" の行だけです ★★★
  // "hybrid" がエラーになるため、アダプターが要求する "server" に変更します。
  // これで、静的ページと動的ページが正しく混在できるようになります。
  output: 'server', 
  adapter: netlify(),
});

