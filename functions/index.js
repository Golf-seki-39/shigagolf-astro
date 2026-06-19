const functions = require("firebase-functions/v1"); // ← ここに「/v1」を足しただけです！
const axios = require("axios");

// 先ほど取得したDiscordのWebhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1517355790204403802/gGVD-zVxlu_wNcaq3oAOigqMuzwGImgzrlbbCdWUMr5v1FRySXb4GDsPxoohbdeUIpyf";

// Firestoreの「reviews」コレクションに新しいデータが作成されたら起動する
exports.notifyReview = functions.region('asia-northeast1').firestore
  .document("artifacts/{appId}/public/data/practice_ranges/{rangeId}/reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    
    // 投稿された口コミのデータ
    const review = snap.data();
    // どの練習場（URLのID）に投稿されたか
    const rangeId = context.params.rangeId;

    // 管理人（関さん）の返信テストなどは通知しないようにする
    if (review.author === "関＠シガゴル管理人") {
        return null;
    }

    // Discordに送るメッセージのレイアウト
    const message = {
      content: `🎉 **シガゴルに新しい口コミが届きました！**\n\n**対象施設:** ${rangeId}\n**投稿者:** ${review.author || "匿名"}\n**評価:** ⭐️ ${review.rating}\n**タイトル:** ${review.title || "なし"}\n**本文:**\n\`\`\`\n${review.body || "なし"}\n\`\`\``
    };

    try {
      // Discordへ送信！
      await axios.post(DISCORD_WEBHOOK_URL, message);
      console.log("Discord通知成功！");
    } catch (error) {
      console.error("Discord通知エラー:", error);
    }
    
    return null;
  });