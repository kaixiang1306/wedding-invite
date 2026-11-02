(function () {
  'use strict';
  var W = window.WEDDING;

  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, W);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- 文字綁定、隱藏不需要的區塊 ----------
  document.title = W.couple.first + ' & ' + W.couple.second + '｜婚禮邀請';
  document.querySelectorAll('[data-bind]').forEach(function (n) {
    var v = get(n.getAttribute('data-bind'));
    if (v != null) n.textContent = v;
  });
  document.querySelectorAll('[data-section]').forEach(function (n) {
    var v = W[n.getAttribute('data-section')];
    if (v == null || (Array.isArray(v) && v.length === 0)) n.remove();
  });

  // ---------- 婚宴資訊：地圖與行事曆 ----------
  if (W.venue) {
    var q = encodeURIComponent(W.venue.mapQuery || W.venue.address);
    var mapFrame = document.querySelector('.venue__map iframe');
    if (mapFrame) mapFrame.src = 'https://www.google.com/maps?q=' + q + '&output=embed';
    document.getElementById('mapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + q;

    var gcal = function (iso) { return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, ''); };
    document.getElementById('calLink').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(W.couple.first + ' & ' + W.couple.second + ' 婚宴') +
      '&dates=' + gcal(W.date) + '/' + gcal(W.endDate || W.date) +
      '&location=' + encodeURIComponent(W.venue.name + ' ' + W.venue.address) +
      '&details=' + encodeURIComponent(location.href.split('#')[0]);
  }

  // ---------- 流程、服裝、交通 ----------
  var tl = document.querySelector('.timeline');
  if (tl) W.schedule.forEach(function (s) {
    var li = el('li');
    li.appendChild(el('time', null, s.time));
    var body = el('div');
    body.appendChild(el('strong', null, s.title));
    if (s.note) body.appendChild(el('small', null, s.note));
    li.appendChild(body);
    tl.appendChild(li);
  });

  var sw = document.querySelector('.dress__swatches');
  if (sw) (W.dressCode.colors || []).forEach(function (c) {
    var i = el('i'); i.style.background = c; sw.appendChild(i);
  });

  var tr = document.querySelector('.transport__list');
  if (tr) W.transport.forEach(function (t) {
    var d = el('div');
    d.appendChild(el('strong', null, t.title));
    d.appendChild(el('p', null, t.text));
    tr.appendChild(d);
  });

  // ---------- 相簿：內容複製一份，translateX(-50%) 才能無縫循環 ----------
  var track = document.querySelector('.gallery__track');
  var photos = W.gallery.length ? W.gallery : [1, 2, 3, 4, 5, 6];
  [0, 1].forEach(function (copy) {
    photos.forEach(function (p, i) {
      var n;
      if (W.gallery.length) {
        n = el('img'); n.src = p; n.alt = ''; n.loading = 'lazy';
      } else {
        n = el('div', 'gallery__ph', '婚紗照 ' + (i + 1));
      }
      if (copy) n.setAttribute('aria-hidden', 'true');
      track.appendChild(n);
    });
  });

  // ---------- 倒數 ----------
  var target = new Date(W.date).getTime();
  var cd = {};
  ['d', 'h', 'm', 's'].forEach(function (k) { cd[k] = document.querySelector('[data-cd="' + k + '"]'); });
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var t = Math.max(0, Math.floor((target - Date.now()) / 1000));
    cd.d.textContent = Math.floor(t / 86400);
    cd.h.textContent = pad(Math.floor(t / 3600) % 24);
    cd.m.textContent = pad(Math.floor(t / 60) % 60);
    cd.s.textContent = pad(t % 60);
  }
  tick();
  setInterval(tick, 1000);

  // ---------- 捲動浮現 ----------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (n) { io.observe(n); });

  // ---------- 背景音樂 ----------
  var music = null;
  var musicBtn = document.querySelector('.music');
  if (W.music) {
    music = new Audio(W.music);
    music.loop = true;
    musicBtn.addEventListener('click', function () {
      if (music.paused) music.play().catch(function () {}); else music.pause();
    });
    music.addEventListener('play', function () { musicBtn.classList.add('is-on'); });
    music.addEventListener('pause', function () { musicBtn.classList.remove('is-on'); });
  }

  // ---------- 開場：點擊 → 播信封影片 → 結束前 0.8 秒淡出 ----------
  var intro = document.getElementById('intro');
  var introVideo = intro.querySelector('video');
  var heroVideo = document.querySelector('.hero__video');
  var state = 'idle';
  var safety = null;

  // 網址加 ?debug=1 會在畫面上列出影片事件，方便在手機上查播放問題
  var debug = /[?&]debug=1/.test(location.search) ? el('pre', 'debug-log') : null;
  function log(msg) {
    if (!debug) return;
    var t = (performance.now() / 1000).toFixed(2);
    debug.textContent += t + 's ' + msg + '\n';
  }
  if (debug) {
    document.body.appendChild(debug);
    log(navigator.userAgent);
    ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'suspend', 'pause', 'ended']
      .forEach(function (ev) {
        introVideo.addEventListener(ev, function () {
          log('intro ' + ev + ' rs=' + introVideo.readyState + ' ns=' + introVideo.networkState +
              ' t=' + introVideo.currentTime.toFixed(2) + ' d=' + introVideo.duration);
        });
      });
    introVideo.addEventListener('error', function () {
      var e = introVideo.error;
      log('intro ERROR code=' + (e && e.code) + ' ' + (e && e.message));
    });
  }

  function openPage(reason) {
    if (state === 'fading') return;
    log('openPage: ' + reason);
    state = 'fading';
    clearTimeout(safety);
    intro.classList.add('is-fading');
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-open');
    if (music) musicBtn.hidden = false;
    setTimeout(function () { intro.remove(); }, 800);
  }

  function start() {
    if (state !== 'idle') return;
    state = 'playing';
    log('tap');
    // 開場影片先播，確保它拿到這次點擊的播放許可
    var p = introVideo.play();
    if (p && p.then) {
      p.then(function () { log('play() ok'); }, function (err) {
        log('play() rejected: ' + (err && err.name) + ' ' + (err && err.message));
        openPage('play rejected'); // 省電模式、App 內建瀏覽器等擋播放時直接進入
      });
    }
    // 音樂要在使用者點擊的當下啟動，手機才允許播放
    if (music) music.play().catch(function () {});
    heroVideo.play().catch(function () {});
    // 保險：網路慢、影片一直沒開始播，最多等 10 秒
    safety = setTimeout(function () { openPage('timeout before playing'); }, 10000);
  }

  introVideo.addEventListener('playing', function () {
    // 真的開始播了，改成「影片長度 + 1 秒」的保險
    clearTimeout(safety);
    safety = setTimeout(function () { openPage('timeout while playing'); }, (introVideo.duration || 3) * 1000 + 1000);
  });
  introVideo.addEventListener('timeupdate', function () {
    if (introVideo.currentTime > 0.05) intro.classList.add('is-playing');
    if (state === 'playing' && introVideo.duration - introVideo.currentTime <= 0.8) openPage('near end');
  });
  introVideo.addEventListener('ended', function () { openPage('ended'); });
  intro.addEventListener('click', start);
  intro.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
  });

  // ---------- RSVP ----------
  var form = document.querySelector('.rsvp__form');
  var more = form.querySelector('.rsvp__more');
  var errBox = form.querySelector('.rsvp__error');
  // 不能用 form.name：那是表單自己的 name 屬性
  var nameInput = form.elements.namedItem('name');
  var steppers = {};

  form.querySelectorAll('.stepper').forEach(function (s) {
    var name = s.getAttribute('data-name');
    var min = +s.getAttribute('data-min');
    var max = +s.getAttribute('data-max');
    var out = s.querySelector('output');
    var btns = s.querySelectorAll('button');
    var api = {
      value: +s.getAttribute('data-value'),
      set: function (v) {
        api.value = Math.min(api.max(), Math.max(min, v));
        out.textContent = api.value;
        btns[0].disabled = api.value <= min;
        btns[1].disabled = api.value >= api.max();
      },
      max: function () { return max; },
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        api.set(api.value + (+b.getAttribute('data-step')));
        clampVeg();
      });
    });
    steppers[name] = api;
  });
  // 素食人數不能超過出席人數
  steppers.vegetarian.max = function () { return steppers.guests.value; };
  function clampVeg() { steppers.vegetarian.set(steppers.vegetarian.value); }
  Object.keys(steppers).forEach(function (k) { steppers[k].set(steppers[k].value); });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'attending') {
      more.hidden = e.target.value !== 'yes';
      form.querySelector('fieldset').classList.remove('fieldset-invalid');
    }
  });
  nameInput.addEventListener('input', function () { nameInput.parentNode.classList.remove('is-invalid'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var att = form.querySelector('input[name="attending"]:checked');
    var errs = [];
    if (!name) { errs.push('請填寫姓名'); nameInput.parentNode.classList.add('is-invalid'); }
    if (!att) { errs.push('請選擇是否出席'); form.querySelector('fieldset').classList.add('fieldset-invalid'); }
    if (errs.length) { errBox.textContent = errs.join('、'); errBox.hidden = false; return; }
    errBox.hidden = true;

    var yes = att.value === 'yes';
    var data = {
      name: name,
      phone: form.elements.namedItem('phone').value.trim(),
      attending: yes ? '出席' : '不克出席',
      guests: yes ? steppers.guests.value : 0,
      vegetarian: yes ? steppers.vegetarian.value : 0,
      childSeats: yes ? steppers.childSeats.value : 0,
      message: form.elements.namedItem('message').value.trim(),
    };

    var btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = '送出中…';

    var send = W.rsvp.endpoint
      // Apps Script 不回 CORS 標頭，用 no-cors 送出（拿不到回應內容，但資料會寫入）
      ? fetch(W.rsvp.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) })
      : new Promise(function (r) { setTimeout(r, 600); });

    send.then(function () {
      form.hidden = true;
      var done = document.querySelector('.rsvp__done');
      done.querySelector('.rsvp__done-text').textContent = yes
        ? '期待 ' + data.guests + ' 位的蒞臨，婚禮當天見！'
        : '雖然無法見面，也謝謝您的祝福。';
      done.querySelector('.rsvp__test').hidden = !!W.rsvp.endpoint;
      done.hidden = false;
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = '送出回覆';
      errBox.textContent = '送出失敗，請檢查網路後再試一次';
      errBox.hidden = false;
    });
  });
})();
