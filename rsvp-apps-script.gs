/**
 * 喜帖 RSVP → Google 試算表
 *
 * 設定方式：
 * 1. 建一個新的 Google 試算表
 * 2. 上方選單「擴充功能 → Apps Script」，把這整個檔案貼進去取代原本內容，存檔
 * 3. 右上「部署 → 新增部署作業」，類型選「網頁應用程式」
 *    - 執行身分：我
 *    - 誰可以存取：所有人
 * 4. 授權後會拿到一個 https://script.google.com/macros/s/.../exec 網址
 * 5. 把網址貼到 site/js/content.js 的 rsvp.endpoint
 *
 * 之後改了這個檔案，要「部署 → 管理部署作業 → 編輯 → 新版本」才會生效。
 */

var HEADERS = ['回覆時間', '姓名', '電話', '是否出席', '出席人數', '素食人數', '兒童座椅', '留言'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    var p = e.parameter;
    sheet.appendRow([
      new Date(),
      p.name || '',
      // 前面加 ' 讓試算表把電話當文字，保留開頭的 0
      p.phone ? "'" + p.phone : '',
      p.attending || '',
      Number(p.guests || 0),
      Number(p.vegetarian || 0),
      Number(p.childSeats || 0),
      p.message || '',
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}
