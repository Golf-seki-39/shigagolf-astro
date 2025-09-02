const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
setGlobalOptions({ region: "asia-northeast1" });

const NETLIFY_BUILD_HOOK_URL = "https://api.netlify.com/build_hooks/68b3b7a74e7aa45923289078";

exports.updateStatsAndTriggerBuild = onDocumentCreated(
    "artifacts/{appId}/public/data/practice_ranges/{rangeId}/reviews/{reviewId}",
    async (event) => {
        functions.logger.info("Function triggered for stats update and build!", { params: event.params });

        try {
            const { appId, rangeId } = event.params;
            const db = admin.firestore();

            const rangeRef = db.doc(`artifacts/${appId}/public/data/practice_ranges/${rangeId}`);
            const reviewsRef = rangeRef.collection("reviews");
            
            const reviewsSnapshot = await reviewsRef.get();
            
            // ★★★ ここからが修正箇所です ★★★

            let validReviewsCount = 0; // 有効なレビューの数
            let totalRating = 0;       // 有効な評価の合計

            reviewsSnapshot.forEach(doc => {
                const reviewData = doc.data();
                // 'rating'フィールドが存在し、かつ、それが数値として有効かを確認
                if (reviewData && typeof reviewData.rating === 'number' && !isNaN(reviewData.rating)) {
                    totalRating += reviewData.rating;
                    validReviewsCount++; // 有効なレビューとしてカウント
                }
            });
            
            // 全てのレビューの総数は newReviewCount として保持
            const newReviewCount = reviewsSnapshot.size;

            // 平均評価は「有効なレビュー」だけで計算
            const newAvgRating = validReviewsCount > 0 ? totalRating / validReviewsCount : 0;
            const roundedAvgRating = Math.round(newAvgRating * 10) / 10;
            
            // データベースには、総レビュー数と、計算された平均評価を更新
            await rangeRef.update({ 
                reviewCount: newReviewCount,
                avgRating: roundedAvgRating 
            });
            // ★★★ 修正箇所はここまで ★★★

            functions.logger.info(`Successfully updated stats for ${rangeId}: Count=${newReviewCount}, AvgRating=${roundedAvgRating}`);

            if (NETLIFY_BUILD_HOOK_URL) {
                await fetch(NETLIFY_BUILD_HOOK_URL, { method: 'POST' });
                functions.logger.info("Successfully triggered a new build on Netlify!");
            } else {
                functions.logger.warn("NETLIFY_BUILD_HOOK_URL is not set. Skipping build trigger.");
            }

        } catch (error) {
            functions.logger.error("An error occurred:", error);
        }
    },
);