// 喜帖的所有文字內容都在這裡改。標「假資料」的請換成真的。
// 不想顯示的區塊，把它設成 null 就會整段隱藏。
window.WEDDING = {
  couple: {
    groom: '黃楷翔',
    bride: '何育晴',
    // 主視覺上的大字
    first: '楷翔',
    second: '育晴',
  },

  // 假資料：婚宴開始時間（倒數計時、加入行事曆都用這個）
  date: '2027-05-22T18:00:00+08:00',
  // 假資料：行事曆活動的結束時間
  endDate: '2027-05-22T21:00:00+08:00',
  dateText: '2027 年 5 月 22 日（六）',

  welcome: {
    title: '誠摯邀請',
    // 假資料
    text: '我們決定攜手走向人生的下一段旅程。\n誠摯邀請您撥冗出席，見證並分享我們最重要的時刻。',
  },

  venue: {
    // 假資料
    name: '婚宴場地名稱',
    hall: '宴會廳名稱',
    address: '台北市信義區（地址待補）',
    time: '17:30 迎賓　18:00 入席',
    // 地圖搜尋字串；留空就用 address
    mapQuery: '',
  },

  // 假資料
  schedule: [
    { time: '17:30', title: '迎賓', note: '簽到・拍照留念' },
    { time: '18:00', title: '入席', note: '' },
    { time: '18:15', title: '證婚儀式', note: '' },
    { time: '18:40', title: '開席', note: '' },
    { time: '20:30', title: '送客', note: '' },
  ],

  // 假資料；不需要就設 null
  dressCode: {
    text: '歡迎以柔和的大地色系或淺色系出席，與我們一起留下溫暖的合照。',
    colors: ['#EFE6D8', '#D9C4AE', '#B9A28A', '#A8B5A0'],
  },

  // 假資料；不需要就設 null
  transport: [
    { title: '捷運', text: '捷運○○站 ○號出口，步行約 5 分鐘。' },
    { title: '開車', text: '場地提供停車位，請於簽到處領取停車抵用券。' },
  ],

  // 婚紗照路徑，例如 'assets/photos/01.jpg'；空陣列會先顯示預留框
  gallery: [],

  // 禮金資訊；不建議在公開網頁放完整帳號，預設不顯示
  gifts: null,

  rsvp: {
    // 假資料
    deadline: '2027 年 4 月 22 日',
    // Google 試算表的 Apps Script 網址；留空 = 測試模式（不會真的送出）
    endpoint: '',
  },

  // 背景音樂檔，例如 'assets/music.mp3'；留空就不顯示音樂按鈕
  // 請用免版稅或有授權的曲子
  music: '',
};
