import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://shigagolf-reviews.netlify.app',
  integrations: [tailwind()],
  // ★★★ output と adapter の設定を完全に削除し、
  // シンプルで安定した「静的サイトモード」に戻します。★★★
});

