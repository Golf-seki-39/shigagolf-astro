import { defineConfig } from 'astro/config';

// 既存のTailwindインポートはそのまま残します
import tailwind from "@astrojs/tailwind";

// ★★★ 1. Netlifyアダプターを新しくインポートします ★★★
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  // 既存の設定はそのまま残します
  site: 'https://shigagolf-reviews.netlify.app',
  integrations: [tailwind()],

  // ★★★ 2. ページを動的にするための設定をここに追加します ★★★
  output: 'hybrid', // 静的(SSG)と動的(SSR)ページを混在させるモード
  adapter: netlify(),
});

