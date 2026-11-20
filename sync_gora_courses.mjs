import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// --- 設定エリア ---
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID;
const COLLECTION_PATH = 'artifacts/1:842932591721:web:c5b6f35673cd5f95be56f8/public/data/golf_courses';
const AREA_CODE_SHIGA = '25'; // 滋賀県
// ------------------

if (!RAKUTEN_APP_ID || !RAKUTEN_ACCESS_KEY) {
  console.error('❌ .env から RAKUTEN_APP_ID または RAKUTEN_ACCESS_KEY が読み込めませんでした');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fetchAllShigaCourses() {
  let allCourses = [];
  let page = 1;
  let pageCount = 1;

  do {
    let url = `https://openapi.rakuten.co.jp/engine/api/Gora/GoraGolfCourseSearch/20170623?format=json&areaCode=${AREA_CODE_SHIGA}&hits=30&page=${page}&applicationId=${RAKUTEN_APP_ID}&accessKey=${RAKUTEN_ACCESS_KEY}`;
    if (RAKUTEN_AFFILIATE_ID) {
      url += `&affiliateId=${RAKUTEN_AFFILIATE_ID}`;
    }

   const res = await fetch(url, {
      headers: {
        'Referer': 'https://shigagolf.com/',
        'Origin': 'https://shigagolf.com'
      }
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('詳細エラー:', errorText);
      throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    pageCount = data.pageCount;

    if (data.Items) {
      for (const item of data.Items) {
        allCourses.push(item.Item);
      }
    }

    console.log(`📡 ${page} / ${pageCount} ページ目を取得...`);
    page++;
    if (page <= pageCount) await new Promise((r) => setTimeout(r, 1100));
  } while (page <= pageCount);

  return allCourses;
}

async function run() {
  console.log('🚀 滋賀県の全ゴルフ場を楽天GORAから取得中...');
  const courses = await fetchAllShigaCourses();
  console.log(`⛳️ ${courses.length} 件を取得しました。Firestoreへ書き込みます...`);

  const batch = db.batch();

  for (const c of courses) {
    const courseId = String(c.golfCourseId);
    const docRef = db.collection(COLLECTION_PATH).doc(courseId);

    batch.set(docRef, {
      goraCourseId: courseId,
      name: c.golfCourseName,
      kana: c.golfCourseNameKana || '',
      address: c.address || '',
      latitude: c.latitude || null,
      longitude: c.longitude || null,
      rating: c.evaluation || 0,
      goraImageUrl: c.golfCourseImageUrl || '',
      reserveUrl: c.reserveCalUrl || c.golfCourseDetailUrl || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Firestoreへの一括登録が完了しました！');
}

run().catch(console.error);