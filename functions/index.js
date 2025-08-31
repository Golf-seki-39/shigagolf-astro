const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // fetchを使うために追加

admin.initializeApp();
setGlobalOptions({ region: "asia-northeast1" });

// ▼▼▼ Netlifyでコピーした、あなたのBuild HookのURLをここに貼り付けてください ▼▼▼
const NETLIFY_BUILD_HOOK_URL = "https://api.netlify.com/build_hooks/68b3b7a74e7aa45923289078";

exports.updateReviewCountAndTriggerBuild = onDocumentCreated(
    "artifacts/{appId}/public/data/practice_ranges/{rangeId}/reviews/{reviewId}",
    async (event) => {
        functions.logger.info("Function triggered!", { params: event.params });

        try {
            const { appId, rangeId } = event.params;

            // --- レビュー件数を更新 ---
            const db = admin.firestore();
            const rangeRef = db.doc(`artifacts/${appId}/public/data/practice_ranges/${rangeId}`);
            const rangeDoc = await rangeRef.get();
            if (!rangeDoc.exists) {
                functions.logger.error("Parent document does not exist!");
                return;
            }
            const currentCount = rangeDoc.data().reviewCount || 0;
            const newCount = currentCount + 1;
            await rangeRef.update({ reviewCount: newCount });
            functions.logger.info("Successfully updated reviewCount!");

            // --- Netlifyに、サイトの再ビルドを命令 ---
            if (NETLIFY_BUILD_HOOK_URL) {
                const body = {
                    clear_cache: true
                };

                await fetch(NETLIFY_BUILD_HOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                functions.logger.info("Successfully triggered a new build on Netlify!");
            } else {
                functions.logger.warn("NETLIFY_BUILD_HOOK_URL is not set. Skipping build trigger.");
            }

        } catch (error) {
            functions.logger.error("An error occurred:", error);
        }
    },
);