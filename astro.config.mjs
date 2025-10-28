import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify/functions"; // ★ 1. Netlifyアダプタをインポート

// https://astro.build/config
export default defineConfig({
  // --- 既存の設定 (そのまま) ---
  site: 'https://shigagolf.com',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap()
  ], 
  
  // --- ▼▼▼ ここからが追加分 ▼▼▼ ---

  // ★ 2. AstroにNetlify CDNを使うよう設定
  adapter: netlify({
    imageCDN: true, // NetlifyのImage CDNを有効化
  }),

  // ★ 3. Netlify CDNにFirebaseのURLを許可する設定
  image: {
    // Astro 4.5以降では "astro/assets/services/netlify" を推奨
    // service: "netlify", 
    
    // 許可する外部ドメインのリスト
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com", 
        // (さくらGCの署名付きURLで使われていたドメインも許可)
      },
    ],
  },
});
