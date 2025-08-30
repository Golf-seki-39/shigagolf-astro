import { db, storage } from '../lib/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from 'browser-image-compression';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('review-form');
  if (!form) return;

  // --- 管理人フォーム用の要素を取得 ---
  const reviewerNameInput = document.getElementById('reviewerName');
  const adminScoresSection = document.getElementById('admin-scores-section');
  const adminScoreInputs = adminScoresSection.querySelectorAll('input');

  // ニックネームが変更されたら、管理人フォームの表示とrequired属性を切り替える
  reviewerNameInput.addEventListener('input', () => {
    const isAdmin = reviewerNameInput.value === '関＠シガゴル管理人';
    if (isAdmin) {
      adminScoresSection.classList.remove('hidden');
      adminScoreInputs.forEach(input => input.required = true);
    } else {
      adminScoresSection.classList.add('hidden');
      adminScoreInputs.forEach(input => input.required = false);
    }
  });

  // --- 写真プレビューのコード (変更なし) ---
  const imageUploadInput = document.getElementById('review-image-upload');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  let uploadedFiles = [];
  imageUploadInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files) return;
    if (uploadedFiles.length + files.length > 5) {
      alert('写真は5枚までしかアップロードできません。');
      return;
    }
    for (const file of files) {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      try {
        const compressedFile = await imageCompression(file, options);
        const fileWithId = new File([compressedFile], `${Date.now()}-${file.name}`, { type: file.type });
        uploadedFiles.push(fileWithId);
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewWrapper = document.createElement('div');
          previewWrapper.className = 'relative w-24 h-24';
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'w-full h-full object-cover rounded';
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.textContent = '×';
          removeBtn.className = 'absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs';
          removeBtn.onclick = () => {
            const index = uploadedFiles.indexOf(fileWithId);
            if (index > -1) { uploadedFiles.splice(index, 1); }
            previewWrapper.remove();
          };
          previewWrapper.appendChild(img);
          previewWrapper.appendChild(removeBtn);
          imagePreviewContainer.appendChild(previewWrapper);
        }
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('画像圧縮中にエラーが発生しました:', error);
        alert('画像の処理に失敗しました。別のファイルで試してください。');
      }
    }
  });

  // --- フォーム送信のコード (変更なし) ---
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '投稿中...';

    try {
      const imageUrls = [];
      for (const file of uploadedFiles) {
        const storageRef = ref(storage, `reviews-images/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        imageUrls.push(downloadURL);
      }

      const rangeId = document.getElementById('rangeId').value;
      const appId = form.dataset.appId;
      const name = document.getElementById('reviewerName').value;
      const title = document.getElementById('reviewTitle').value;
      const body = document.getElementById('reviewComment').value;
      const rating = form.querySelector('input[name="rating"]:checked').value;
      
      const reviewData = {
        author: name,
        title: title,
        body: body,
        rating: Number(rating),
        createdAt: serverTimestamp(),
        imageUrls: imageUrls,
      };

      if (name === '関＠シガゴル管理人') {
        reviewData.scores = {
          "打席・レンジの質": Number(document.getElementById('score_range').value),
          "設備の充実度": Number(document.getElementById('score_facilities').value),
          "練習環境の多様性": Number(document.getElementById('score_variety').value),
          "コストパフォーマンス": Number(document.getElementById('score_cost').value),
          "快適性・ホスピタリティ": Number(document.getElementById('score_hospitality').value)
        };
      }

      const reviewsCollectionPath = collection(db, 'artifacts', appId, 'public', 'data', 'practice_ranges', rangeId, 'reviews');
      await addDoc(reviewsCollectionPath, reviewData);

      alert('レビューの投稿が完了しました！ありがとうございます。');
      window.location.href = `/ranges/${rangeId}`;

    } catch (e) {
      console.error("レビュー投稿中にエラーが発生しました: ", e);
      alert('エラーが発生し、レビューを投稿できませんでした。');
      submitButton.disabled = false;
      submitButton.textContent = '投稿する';
    }
  });
});