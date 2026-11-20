// 2点間の直線距離（km）を計算する（ヒュベニ・ハーバーサイン公式）
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;

  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 小数点第1位まで（例: 4.2）
}

// ターゲットの座標から近い順に施設を抽出する（lat/lng と latitude/longitude 両対応）
export function findNearbySpots(targetLat, targetLng, spots, limit = 5) {
  if (!targetLat || !targetLng) return [];

  return spots
    .map((spot) => {
      const spotLat = spot.lat ?? spot.latitude;
      const spotLng = spot.lng ?? spot.longitude;
      const distance = calculateDistance(targetLat, targetLng, spotLat, spotLng);
      // 車での所要時間目安（直線距離×1.3 ÷ 時速35km ≒ 1kmあたり約2.2分で概算）
      const driveMinutes = distance !== null ? Math.max(3, Math.round(distance * 2.2)) : null;

      return {
        ...spot,
        distance,
        driveMinutes,
      };
    })
    .filter((spot) => spot.distance !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}