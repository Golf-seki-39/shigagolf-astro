import admin from 'firebase-admin';

// Netlifyの環境変数からサービスアカウントキーを読み込む準備
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// 接続がまだ確立されていない場合のみ、初期化を実行
if (!admin.apps.length) {
  try {
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    });
    
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

// 初期化済みのFirestoreインスタンスをエクスポート
export const dbAdmin = admin.firestore();
