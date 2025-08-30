const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// FieldValueをインポートすることを忘れないでください
const {FieldValue} = require("firebase-admin/firestore");

admin.initializeApp();

setGlobalOptions({region: "asia-northeast1"});

exports.updateReviewCount = onDocumentCreated(
  "artifacts/{appId}/public/data/practice_ranges/{rangeId}/reviews/{reviewId}",
  async (event) => {
    functions.logger.info("Function triggered!", {params: event.params});
    
    try {
      const {appId, rangeId} = event.params;
      const db = admin.firestore();
      const rangeRef = db.doc(`artifacts/${appId}/public/data/practice_ranges/${rangeId}`);
      
      functions.logger.info(`Attempting to increment reviewCount at path: ${rangeRef.path}`);
      
      // FieldValue.increment(1) を使って、サーバーサイドでアトミックに+1する
      await rangeRef.update({
        reviewCount: FieldValue.increment(1)
      });
      
      functions.logger.info("Successfully sent increment command!", {path: rangeRef.path});
    
    } catch (error) {
      functions.logger.error("An error occurred during the increment operation:", error);
    }
  },
);