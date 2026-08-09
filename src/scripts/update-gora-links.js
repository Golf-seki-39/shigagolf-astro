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

// APIから必要なデータ（URL、ゴルフ場名、画像、評価）を抽出する関数
async function fetchGoraData(courseId) {
  const url = `https://openapi.rakuten.co.jp/engine/api/Gora/GoraGolfCourseDetail/20170623?format=json&applicationId=${APP_ID}&accessKey=${ACCESS_KEY}&affiliateId=${AFF_ID}&golfCourseId=${courseId}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': 'https://shigagolf.com',
      'Referer': 'https://shigagolf.com'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP Error: ${res.status} | 詳細: ${errText}`);
  }
  
  const data = await res.json();
  
  if (data?.Item?.reserveCalUrl && data?.Item?.golfCourseName) {
    return {
      name: data.Item.golfCourseName,
      reserveUrl: data.Item.reserveCalUrl,
      imageUrl: data.Item.golfCourseImageUrl1, // ★追加：画像URL
      rating: data.Item.evaluation             // ★追加：総合評価（星）
    };
  }
  
  throw new Error(`APIレスポンス内に必要なデータが見つかりませんでした。(ID: ${courseId})`);
}

async function main() {
  console.log("🚀 楽天GORA アフィリエイトデータ（リッチ版）の取得を開始します...");

  try {
    const courses = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
    const richData = {};

    for (const [key, id] of Object.entries(courses)) {
      console.log(`⏳ 取得中: ${key} (ID: ${id})`);
      
      const apiData = await fetchGoraData(id);
      
      // リッチなJSON構造を組み立てる
      richData[key] = {
        name: apiData.name,
        courseId: id,
        reserveUrl: apiData.reserveUrl,
        imageUrl: apiData.imageUrl,  // ★追加
        rating: apiData.rating       // ★追加
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(richData, null, 2), 'utf-8');
    console.log("✅ 成功: src/data/gora-links.json をリッチ形式で更新しました！");

  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    process.exit(1);
  }
}

main();