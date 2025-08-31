// functions/index.js

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

            // --- レビュー件数と平均評価を再計算 ---
            const rangeRef = db.doc(`artifacts/${appId}/public/data/practice_ranges/${rangeId}`);
            const reviewsRef = rangeRef.collection("reviews");
            
            const reviewsSnapshot = await reviewsRef.get();
            
            const newReviewCount = reviewsSnapshot.size;
            
            let totalRating = 0;
            reviewsSnapshot.forEach(doc => {
                totalRating += doc.data().rating || 0;
            });
            
            const newAvgRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;
            const roundedAvgRating = Math.round(newAvgRating * 10) / 10;
            
            // 新しい統計データを更新
            await rangeRef.update({ 
                reviewCount: newReviewCount,
                avgRating: roundedAvgRating 
            });
            functions.logger.info(`Successfully updated stats for ${rangeId}: Count=${newReviewCount}, AvgRating=${roundedAvgRating}`);

            // --- Netlifyに、サイトの再ビルドを命令 ---
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