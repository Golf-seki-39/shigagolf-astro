import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap"; // ★ 1. これをインポート（追加）

// https://astro.build/config
export default defineConfig({
  site: 'https://shigagolf.com',
  
  trailingSlash: 'always', // ★ 2. この行を追加 (Netlifyの設定と合わせる)

  integrations: [
    tailwind(),
    sitemap() // ★ 3. これを配列に追加
  ], 
  // ★★★ output と adapter の設定を... (このコメントはそのまま触らなくてOKです)
});