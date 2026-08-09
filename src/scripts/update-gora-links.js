import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 設定
const COURSES_FILE = path.join(__dirname, '../data/golf-courses.json');
const OUTPUT_FILE = path.join(__dirname, '../data/gora-links.json');

// 環境変数
const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const AFF_ID = process.env.RAKUTEN_AFFILIATE_ID;

if (!APP_ID || !ACCESS_KEY || !AFF_ID) {
  console.error("❌ エラー: .envに RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY, RAKUTEN_AFFILIATE_ID がすべて設定されているか確認してください。");
  process.exit(1);
}

async function fetchGoraLink(courseId) {
  const url = `https://openapi.rakuten.co.jp/engine/api/Gora/GoraGolfCourseDetail/20170623?format=json&applicationId=${APP_ID}&accessKey=${ACCESS_KEY}&affiliateId=${AFF_ID}&golfCourseId=${courseId}`;
  
  // 💡 OriginやUser-Agentを追加し、よりブラウザに近い完璧な身分証を提示する
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': 'https://shigagolf.com',
      'Referer': 'https://shigagolf.com'
    }
  });

  if (!res.ok) {
    // 💡 ここが超重要！楽天が返している「詳細なエラー理由」を文字列として取得
    const errText = await res.text();
    throw new Error(`HTTP Error: ${res.status} | 詳細: ${errText}`);
  }
  
  const data = await res.json();
  
  if (data?.Item?.reserveCalUrl) {
    return data.Item.reserveCalUrl;
  }
  
  throw new Error(`APIレスポンス内に reserveCalUrl が見つかりませんでした。(ID: ${courseId})`);
}

async function main() {
  console.log("🚀 楽天GORA アフィリエイトリンクの取得を開始します...");

  try {
    const courses = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
    const links = {};

    for (const [key, id] of Object.entries(courses)) {
      console.log(`⏳ 取得中: ${key} (ID: ${id})`);
      const link = await fetchGoraLink(id);
      links[key] = link;
      
      // API制限（Rate Limit）対策として1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(links, null, 2), 'utf-8');
    console.log("✅ 成功: src/data/gora-links.json を更新しました！");

  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    process.exit(1);
  }
}

main();