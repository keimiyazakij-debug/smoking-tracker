(function () {
// 設定画面の描画
function renderSettings() {
  const el = document.getElementById("planInfo");
  if (!el) return;

  if (isPremium()) {
    el.innerHTML = `
      <strong>プレミアム</strong><br>
      ・記録は無期限<br>
      ・統計情報が表示されます<br>
      ・広告が軽減されます
    `;
  } else {
    el.innerHTML = `
      <strong>無料版</strong><br>
      ・記録は直近30日まで<br>
      ・広告が表示されます
    `;
  }
}

})();