import { db } from '../lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// 動的なページ（練習場詳細ページ）のリストを取得する関数 (変更なし)
async function getRangeUrls() {
  const rangesCollection = collection(db, 'artifacts', import.meta.env.PUBLIC_FIREBASE_APP_ID, 'public', 'data', 'practice_ranges');
  const querySnapshot = await getDocs(rangesCollection);
  const ranges = querySnapshot.docs.map(doc => doc.id);
  return ranges.map(id => `/ranges/${id}`);
}

// XML形式のサイトマップを生成する関数 (変更なし)
const createSitemap = (pages) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => {
    // ページが'/'（ホームページ）でない場合のみ、末尾にスラッシュを付ける
    const finalPageUrl = page === '/' ? page : `${page}/`;
    return `
  <url>
    <loc>https://shigagolf-reviews.netlify.app${finalPageUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`;
  }).join('')}
</urlset>`;


export async function GET() {
  // ★★★ ここからが自動化の修正箇所です ★★★

  // 1. Astroのglob機能を使って「記事ページ」を"自動で"すべて取得します
  //    './articles/**/index.astro' は、articlesフォルダ内のすべてのindex.astroを探します。
  const articleImports = import.meta.glob('./articles/**/index.astro');
  const articlePages = Object.keys(articleImports).map(file => 
      file
        .replace('./', '/')           // './' を '/' に置換
        .replace('/index.astro', '') // '/index.astro' を削除
  );

  // 2. 手動で管理する静的なページのリスト
  //    (記事ページは上で自動取得されるので、ここから削除します)
  const staticPages = [
    '/',
    '/about',
    '/criteria',
    '/articles', // 記事一覧ページは手動で追加
    '/map',
  ];

  // 3. 動的なページのリストを取得 (変更なし)
  const dynamicPages = await getRangeUrls();

  // 4. 静的ページ、自動取得した記事ページ、動的ページをすべて合体
  //    (Setを使って、万が一のURLの重複を自動的に削除します)
  const allPages = [...new Set([...staticPages, ...articlePages, ...dynamicPages])];

  return new Response(createSitemap(allPages), {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}

