import { db } from '../lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// 動的なページ（練習場詳細ページ）のリストを取得
async function getRangeUrls() {
  const rangesCollection = collection(db, 'artifacts', import.meta.env.PUBLIC_VITE_APP_ID, 'public', 'data', 'practice_ranges');
  const querySnapshot = await getDocs(rangesCollection);
  const ranges = querySnapshot.docs.map(doc => doc.id);
  return ranges.map(id => `/ranges/${id}`);
}

// XML形式のサイトマップを生成する
const createSitemap = (pages) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>https://shigagolf-reviews.netlify.app${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`;

export async function GET() {
  // 静的なページのリスト
  const staticPages = [
    '/',
    '/about',
    '/criteria',
    '/articles/omi-higashiomi-comparison',
  ];

  // 動的なページのリストを取得
  const dynamicPages = await getRangeUrls();

  // 静的と動的なページを合体
  const allPages = [...staticPages, ...dynamicPages];

  return new Response(createSitemap(allPages), {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}