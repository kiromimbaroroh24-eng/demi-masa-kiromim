(function () {
  "use strict";
  var C = window.CONTENT, CFG = window.SITE_CONFIG || {};
  var app = document.getElementById("app");
  var KEY = "demimasa-v1";

  /* ---------- penyimpanan lokal (aman bila tidak tersedia) ---------- */
  var mem = {};
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return mem; } }
  function save(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load(); S.done = S.done || {}; S.refl = S.refl || {}; S.quiz = S.quiz || {}; S.plan = S.plan || []; S.opened = S.opened || {}; S.quizLast = S.quizLast || {};

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function h(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  /* ---------- top bar ---------- */
  var drawer = $("#drawer"), menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", function () {
    var open = drawer.hidden; drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function (e) {
    if (!drawer.hidden && !drawer.contains(e.target) && e.target !== menuBtn) { drawer.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
  });
  $("#drawerParts").innerHTML = C.bagian.map(function (b) {
    return '<a href="#bagian-' + b.no + '">' + b.ikon + " " + b.no + ". " + esc(b.judul) + "</a>";
  }).join("");
  $("#footSchool").textContent = CFG.sekolah || "";
  function updChip() { $("#progChip").textContent = Object.keys(S.done).length + "/5 selesai"; }

  /* ---------- komponen ---------- */
  function dalilCard(d) {
    return '<div class="card surah dalil"><span class="tag">' + (d.tipe === "ayat" ? "Ayat Al-Qur’an" : "Hadis") + '</span>' +
      '<div class="ar" lang="ar">' + d.arab + "</div>" +
      (d.latin ? '<p class="latin">' + esc(d.latin) + "</p>" : "") +
      '<p class="arti">“' + esc(d.arti) + '”</p><span class="src">' + esc(d.sumber) + "</span></div>";
  }

  function quizBlock(list, id) {
    var wrap = h('<div class="quiz"></div>');
    var answered = 0, right = 0;
    var scoreEl = h('<p class="score" aria-live="polite"></p>');
    list.forEach(function (it, qi) {
      var q = h('<div class="q"><p class="qt">' + (qi + 1) + ". " + esc(it.q) + "</p></div>");
      it.o.forEach(function (op, oi) {
        var b = h('<button class="opt" type="button">' + String.fromCharCode(65 + oi) + ". " + esc(op) + "</button>");
        b.addEventListener("click", function () {
          $$(".opt", q).forEach(function (x, xi) { x.disabled = true; if (xi === it.a) x.classList.add("right"); });
          var ok = oi === it.a; if (!ok) b.classList.add("wrong");
          q.appendChild(h('<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "Tepat! " : "Belum tepat. ") + "</b>" + esc(it.w) + "</div>"));
          answered++; if (ok) right++;
          if (answered === list.length) {
            scoreEl.textContent = "Skormu: " + right + " dari " + list.length + (right === list.length ? " — luar biasa! 🌟" : ". Baca lagi penjelasannya, lalu coba ulang bila perlu.");
            S.quiz[id] = Math.max(S.quiz[id] || 0, right); S.quizLast[id] = right; save(S);
            var again = h('<button class="btn btn-ghost" type="button">Ulangi kuis</button>');
            again.addEventListener("click", function () { var n = quizBlock(list, id); wrap.replaceWith(n); });
            wrap.appendChild(again);
          }
        });
        q.appendChild(b);
      });
      wrap.appendChild(q);
    });
    wrap.appendChild(scoreEl);
    return wrap;
  }

  function videoBlock(no) {
    var v = (CFG.VIDEOS || {})[no] || {};
    if (v.id) {
      return '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) +
        '" title="' + esc(v.judul || "Video") + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
        '<p class="small muted">' + esc(v.judul || "") + "</p>";
    }
    return '<div class="video-ph"><div><div class="play">▶</div><b>' + esc(v.judul || "Video pembelajaran") + "</b>Video akan ditambahkan oleh guru. (Atur di <code>js/config.js</code>)</div></div>";
  }


  /* ---------- audio: bacakan teks (Text-to-Speech browser) ---------- */
  var TTS = ("speechSynthesis" in window) && typeof SpeechSynthesisUtterance !== "undefined";
  function stopSpeak() { if (TTS) try { speechSynthesis.cancel(); } catch (e) {} }
  function speakBtn(getText, label) {
    if (!TTS) return h('<p class="small muted">🔇 Browser ini belum mendukung fitur dengar.</p>');
    var b = h('<button class="listen" type="button" aria-pressed="false"><span class="li">🔊</span> <span class="lt">' + esc(label || "Dengarkan penjelasan") + "</span></button>"), on = false;
    b.onclick = function () {
      if (on) { stopSpeak(); return; }
      stopSpeak();
      var u = new SpeechSynthesisUtterance(getText()); u.lang = "id-ID"; u.rate = 0.95;
      var v = speechSynthesis.getVoices().filter(function (x) { return /^id/i.test(x.lang); })[0]; if (v) u.voice = v;
      u.onstart = function () { on = true; b.classList.add("on"); b.setAttribute("aria-pressed", "true"); $(".lt", b).textContent = "Berhenti"; $(".li", b).textContent = "⏹"; };
      u.onend = u.onerror = function () { on = false; b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); $(".lt", b).textContent = label || "Dengarkan penjelasan"; $(".li", b).textContent = "🔊"; };
      try { speechSynthesis.speak(u); } catch (e) {}
    };
    return b;
  }
  function plain(html) { var d = document.createElement("div"); d.innerHTML = html; return d.textContent; }

  /* ---------- diagram per bagian ---------- */
  function diagram(no) {
    var d = C.diagram[no]; if (!d) return "";
    var body = "";
    if (d.tipe === "bar") {
      var tot = d.data.reduce(function (t, x) { return t + x[1]; }, 0);
      body = '<div class="dg-bar">' + d.data.map(function (x) { return '<span style="flex:' + x[1] + ";background:" + x[2] + '" title="' + esc(x[0]) + '"></span>'; }).join("") + "</div>" +
        '<ul class="dg-leg">' + d.data.map(function (x) { return '<li><i style="background:' + x[2] + '"></i>' + esc(x[0]) + " <b>" + x[1] + " jam</b></li>"; }).join("") + "</ul>" +
        '<p class="small muted" style="margin:6px 0 0">Total ' + tot + " jam</p>";
    } else if (d.tipe === "alur") {
      body = '<ol class="dg-flow">' + d.data.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    } else if (d.tipe === "saring") {
      body = '<div class="dg-filter"><div class="dg-in">📱 Kebiasaan bermedia</div>' + d.data.map(function (x, i) { return '<div class="dg-q"><b>' + (i + 1) + "</b>" + esc(x) + "</div>"; }).join("") +
        '<div class="dg-out">' + d.hasil.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div></div>";
    } else if (d.tipe === "lingkar") {
      body = '<div class="dg-ring">' + d.data.map(function (x, i) { return '<div class="dg-node n' + i + '">' + esc(x) + "</div>"; }).join("") + '<div class="dg-mid">🤝<br>saling</div></div>';
    }
    return '<div class="card diagram"><h3>' + esc(d.judul) + "</h3>" + body + '<p class="small muted" style="margin:10px 0 0">' + esc(d.ket) + "</p></div>";
  }

  function lastScoreLabel(id, max) {
    if (S.quizLast[id] == null) return '<span class="badge">Belum dikerjakan</span>';
    var s = S.quizLast[id], ok = s / max >= 0.67;
    return '<span class="badge ' + (ok ? "done" : "warnb") + '">' + s + "/" + max + (ok ? " · bagus" : " · perlu diulang") + "</span>";
  }

  /* ---------- aktivitas ---------- */
  var ACT = {
    kalkulator: function () {
      var el = h('<div class="act calc"><h3>Kalkulator “Modal Waktu”</h3><p class="muted small">Geser sesuai perkiraanmu sendiri. Tidak ada yang melihat angkamu.</p>' +
        '<label for="mnt">Berapa menit sehari kamu menggulir konten yang bikin gelisah?</label><div class="val"><span id="mv">60</span> menit/hari</div>' +
        '<input type="range" id="mnt" min="0" max="300" step="5" value="60">' +
        '<div class="grid"><div><b id="w1"></b><span>jam/minggu</span></div><div><b id="w2"></b><span>jam/bulan</span></div><div><b id="w3"></b><span>hari penuh/tahun</span></div></div>' +
        '<div class="eq" id="eq"></div></div>');
      var r = $("#mnt", el);
      function upd() {
        var m = +r.value, wk = m * 7 / 60, mo = m * 30 / 60, yr = m * 365 / 60 / 24;
        $("#mv", el).textContent = m; $("#w1", el).textContent = wk.toFixed(1); $("#w2", el).textContent = mo.toFixed(0); $("#w3", el).textContent = yr.toFixed(1);
        var juz = Math.floor(m * 30 / 40), buku = Math.floor(m * 30 / 360);
        $("#eq", el).innerHTML = m === 0 ? "Masyaallah, waktumu terjaga. Pertahankan!" :
          "Dalam sebulan, waktu itu cukup untuk membaca sekitar <b>" + juz + " juz</b> Al-Qur’an (±40 menit per juz) atau menamatkan sekitar <b>" + buku + " buku</b> (±6 jam per buku). Waktu ini adalah <em>modal</em>. Kamu yang menentukan ke mana ia dibelanjakan.";
      }
      r.addEventListener("input", upd); upd(); return el;
    },

    skenario: function () {
      var sk = C.skenario, el = h('<div class="act"><h3>Skenario: Malam di Depan Layar</h3><p class="muted small">Pilih langkahmu. Tidak ada nilai, cukup jujur pada diri sendiri.</p><div class="scene" aria-live="polite"></div></div>');
      var sc = $(".scene", el), jam = { a: "22.15", b: "22.55", c: "00.10" };
      function go(k) {
        if (sk.langkah[k]) {
          var s = sk.langkah[k];
          sc.innerHTML = '<span class="clock">🕙 ' + jam[k] + "</span><p>" + esc(s.t) + "</p>";
          s.p.forEach(function (p) { var b = h('<button class="choice" type="button">' + esc(p.l) + "</button>"); b.onclick = function () { go(p.ke); }; sc.appendChild(b); });
        } else {
          var e = sk.akhir[k];
          sc.innerHTML = '<div class="end"><h4>' + (e.ok ? "✅ " : "⚠️ ") + esc(e.j) + "</h4><p>" + esc(e.t) + "</p></div>";
          var b = h('<button class="choice" type="button">↺ Ulangi skenario</button>'); b.onclick = function () { go(sk.mulai); }; sc.appendChild(b);
        }
      }
      go(sk.mulai); return el;
    },

    sortir: function () {
      var el = h('<div class="act"><h3>Pilah Kartu: Amal Saleh atau Sia-sia?</h3><p class="muted small">Tentukan kategori setiap aktivitas bermedia berikut.</p><div class="list"></div><p class="score" aria-live="polite"></p></div>');
      var list = $(".list", el), n = 0, ok = 0;
      C.sortir.forEach(function (it) {
        var box = h('<div class="sort-item"><p>' + esc(it.t) + '</p><div class="row"><button class="chip-btn" data-k="baik" type="button">🌱 Amal saleh</button><button class="chip-btn" data-k="sia" type="button">🍂 Cenderung sia-sia</button></div></div>');
        $$(".chip-btn", box).forEach(function (b) {
          b.onclick = function () {
            var right = b.dataset.k === it.k;
            $$(".chip-btn", box).forEach(function (x) { x.disabled = true; });
            b.classList.add(right ? "sel-ok" : "sel-no");
            box.appendChild(h('<div class="fb ' + (right ? "ok" : "no") + '">' + (right ? "Tepat. " : "Coba pikirkan lagi. ") + esc(it.w) + "</div>"));
            n++; if (right) ok++;
            if (n === C.sortir.length) $(".score", el).textContent = "Kamu memilah " + ok + " dari " + n + " kartu dengan tepat.";
          };
        });
        list.appendChild(box);
      });
      return el;
    },

    chat: function () {
      var c = C.chat;
      var el = h('<div class="act"><h3>Simulasi: Pesan Berantai</h3><p class="muted small">Kamu baru saja menerima pesan ini di grup kelas.</p>' +
        '<div class="phone"><div class="ph-top">👥 XI-3 Kompak</div><div class="bubble in"><span class="who">Andra</span><span class="fwd">↪ Diteruskan berkali-kali</span>' + esc(c.pesan) + '</div><div class="thread"></div></div><div class="ctrl"></div></div>');
      var thread = $(".thread", el), ctrl = $(".ctrl", el);
      function step(opts, title, after) {
        ctrl.innerHTML = '<p style="font-weight:800;margin:16px 0 4px">' + title + "</p>";
        opts.forEach(function (o) {
          var b = h('<button class="opt" type="button">' + esc(o.l) + "</button>");
          b.onclick = function () {
            $$(".opt", ctrl).forEach(function (x) { x.disabled = true; });
            b.classList.add(o.ok ? "right" : "wrong");
            ctrl.appendChild(h('<div class="fb ' + (o.ok ? "ok" : "no") + '">' + esc(o.w) + "</div>"));
            if (o.ok) { var nb = h('<button class="btn btn-dark" type="button" style="margin-top:12px">Lanjut →</button>'); nb.onclick = after; ctrl.appendChild(nb); }
            else { var rb = h('<button class="btn btn-ghost" type="button" style="margin-top:12px">Coba pilihan lain</button>'); rb.onclick = function () { step(opts, title, after); }; ctrl.appendChild(rb); }
          };
          ctrl.appendChild(b);
        });
      }
      step(c.pilihan, "1) Apa yang kamu lakukan pertama kali?", function () {
        thread.appendChild(h('<div class="bubble out">🔎 (Kamu mengecek situs resmi pemda & PDAM: tidak ada pengumuman apa pun.)</div>'));
        step(c.balasan, "2) Pilih balasan yang akan kamu kirim ke grup:", function () {
          var good = c.balasan.filter(function (x) { return x.ok; })[0];
          thread.appendChild(h('<div class="bubble out">' + esc(good.l.replace(/^“|”$/g, "")) + "</div>"));
          thread.appendChild(h('<div class="bubble in"><span class="who">Andra</span>Oh iya, makasih udah ngingetin 🙏 aku hapus ya</div>'));
          ctrl.innerHTML = '<div class="fb ok" style="margin-top:14px"><b>Selesai!</b> Kamu sudah mempraktikkan tabayyun dan saling menasihati dalam kebenaran.</div>';
        });
      });
      return el;
    },

    balas: function () {
      var c = C.balas;
      var el = h('<div class="act"><h3>Balas Pesan Rani</h3><div class="phone"><div class="ph-top">Rani</div><div class="bubble in">' + esc(c.pesan) + '</div><div class="thread"></div></div><div class="ctrl"></div></div>');
      var ctrl = $(".ctrl", el), thread = $(".thread", el);
      function render() {
        ctrl.innerHTML = '<p style="font-weight:800;margin:16px 0 4px">Pilih balasanmu:</p>';
        c.pilihan.forEach(function (o) {
          var b = h('<button class="opt" type="button">' + esc(o.l) + "</button>");
          b.onclick = function () {
            $$(".opt", ctrl).forEach(function (x) { x.disabled = true; });
            b.classList.add(o.ok ? "right" : "wrong");
            ctrl.appendChild(h('<div class="fb ' + (o.ok ? "ok" : "no") + '">' + esc(o.w) + "</div>"));
            if (o.ok) {
              thread.innerHTML = '<div class="bubble out">' + esc(o.l.replace(/^“|”$/g, "")) + '</div><div class="bubble in">Makasih ya 🥹 aku taruh HP dulu. Besok kita saling ingetin.</div>';
            } else {
              var rb = h('<button class="btn btn-ghost" type="button" style="margin-top:12px">Coba lagi</button>'); rb.onclick = render; ctrl.appendChild(rb);
            }
          };
          ctrl.appendChild(b);
        });
      }
      render(); return el;
    }
  };

  function reflBlock(key, prompt) {
    var el = h('<div class="card"><p style="margin-top:0;font-weight:700">' + esc(prompt) + '</p><textarea aria-label="Jawaban refleksi" placeholder="Tulis dengan kata-katamu sendiri…"></textarea><div class="saved" aria-live="polite"></div><p class="small muted" style="margin:6px 0 0">🔒 Tersimpan hanya di perangkat ini dan tidak dikirim ke mana pun.</p></div>');
    var ta = $("textarea", el), sv = $(".saved", el), t;
    ta.value = S.refl[key] || "";
    ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { S.refl[key] = ta.value; save(S); sv.textContent = "✓ Tersimpan"; }, 400); });
    return el;
  }

  /* ---------- halaman ---------- */
  function sunSVG() {
    return '<div class="horizon" aria-hidden="true"><svg class="sun" viewBox="0 0 200 200"><defs><radialGradient id="g" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fff0c2"/><stop offset="1" stop-color="#ff9f6e"/></radialGradient></defs><circle class="disc" cx="100" cy="104" r="84" fill="url(#g)"/></svg>' +
      '<svg class="hill" viewBox="0 0 1000 60" preserveAspectRatio="none"><path d="M0 34 Q250 6 500 26 T1000 20 V60 H0Z" fill="#fff8f4"/></svg></div>';
  }

  function home() {
    var doneN = Object.keys(S.done).length;
    var nextPart = C.bagian.filter(function (b) { return !S.done[b.no]; })[0];
    var qsum = Object.keys(S.quiz).filter(function (k) { return k.charAt(0) === "b"; }).reduce(function (t, k) { return t + S.quiz[k]; }, 0);
    app.innerHTML =
      '<section class="hero"><div class="cloud c1"></div><div class="cloud c2"></div><div class="wrap">' +
      '<p class="ar-big" lang="ar">وَالْعَصْرِ</p>' +
      "<h1>Demi Masa: <em>Kendalikan Jempol,</em><br>Jaga Waktumu</h1>" +
      '<p class="lead">Belajar nilai QS. Al-‘Ashr untuk mengendalikan <i>doomscrolling</i>.</p>' +
      '<div class="row"><a class="btn btn-main" href="#bagian-' + (nextPart ? nextPart.no : 1) + '">' + (doneN ? "Lanjutkan belajar →" : "Mulai belajar →") + '</a><a class="btn btn-soft" href="#petunjuk">Petunjuk</a></div>' +
      "</div>" + sunSVG() + "</section>" +

      (S.last ? '<section class="sec tight"><div class="wrap"><a class="resume" href="#bagian-' + S.last + '" data-tone="' + S.last + '"><span class="ic">' + C.bagian[S.last - 1].ikon + '</span><span><small>Terakhir kamu buka</small><b>Bagian ' + S.last + ": " + esc(C.bagian[S.last - 1].judul) + "</b></span><span class='go'>→</span></a></div></section>" : "") +

      '<section class="sec"><div class="wrap"><div class="sec-head"><p class="kicker">Tujuan belajar</p><h2>Yang akan kamu kuasai</h2></div>' +
      '<div class="goal-tiles">' + C.pilar.map(function (p, i) { return '<div class="gt" data-tone="' + p.no + '"><span class="gi">' + p.ikon + "</span><b>" + esc(p.nama) + "</b><small>" + esc(p.ringkas) + "</small></div>"; }).join("") + "</div>" +
      '<details class="more"><summary>Lihat tujuan lengkap</summary><ol>' + C.tujuanUmum.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></details></div></section>" +

      '<section class="sec band-soft"><div class="wrap"><div class="sec-head"><p class="kicker">Surah ke-103</p><h2>Tiga ayat, pedoman seumur hidup</h2></div>' +
      dalilCard({ tipe: "ayat", arab: C.alAshr.arab, latin: C.alAshr.latin, arti: C.alAshr.arti, sumber: C.alAshr.sumber }) + "</div></section>" +

      '<section class="sec"><div class="wrap"><div class="sec-head"><p class="kicker">Daftar materi</p><h2>Lima bagian, lima pilar</h2></div><div class="journey">' +
      C.bagian.map(function (b) {
        var qs = S.quiz["b" + b.no];
        return '<a class="pcard" data-tone="' + b.no + '" href="#bagian-' + b.no + '"><div class="ic">' + b.ikon + '</div><div><span class="num">Bagian ' + b.no + " · Pertemuan " + b.pertemuan + "</span><h3>" + esc(b.judul) + '</h3><div class="badges">' + (S.done[b.no] ? '<span class="badge done">✓ Selesai</span>' : "") + (qs != null ? '<span class="badge">Kuis ' + qs + "/3</span>" : "") + "</div></div></a>";
      }).join("") + "</div></div></section>" +

      '<section class="sec band-soft"><div class="wrap"><div class="sec-head"><p class="kicker">Progresku</p><h2>Sejauh mana kamu belajar?</h2></div>' +
      '<div class="scores"><div><b>' + doneN + '/5</b><span>bagian</span></div><div><b>' + qsum + '/15</b><span>kuis bagian</span></div><div><b>' + (S.quiz.akhir != null ? S.quiz.akhir : "–") + '/10</b><span>kuis akhir</span></div></div>' +
      '<div class="row" style="margin-top:18px"><a class="btn btn-ghost" href="#progres">Lihat progres →</a></div></div></section>' +

      '<section class="sec"><div class="wrap"><div class="sec-head"><p class="kicker">Jelajahi</p><h2>Fitur belajar</h2></div><div class="tiles">' +
      [["#kuis-akhir", "🏁", "Kuis Akhir", "10 soal"], ["#rangkuman", "🗺️", "Rangkuman", "4 pilar"], ["#glosarium", "🔤", "Glosarium", C.glosarium.length + " istilah"], ["#unduhan", "⬇️", "Unduhan", "2 PDF"], ["#tanya", "💬", "Tanya Jawab", "& FAQ"], ["#materi", "📚", "Daftar Materi", "per topik"]].map(function (t) {
        return '<a class="tile" href="' + t[0] + '"><span>' + t[1] + "</span><b>" + t[2] + "</b><small>" + t[3] + "</small></a>";
      }).join("") + "</div></div></section>" +

      '<section class="sec band-soft"><div class="wrap"><div class="sec-head"><p class="kicker">Baru ditambahkan</p><h2>Materi terbaru</h2></div><div class="news">' + C.terbaru.map(function (n) { return '<a href="' + n.link + '"><time>' + esc(tgl(n.tgl)) + "</time><b>" + esc(n.judul) + "</b></a>"; }).join("") + "</div></div></section>" +

      '<section class="sec"><div class="wrap"><a class="dev-mini" href="#pengembang"><div class="avatar">KB</div><div><b>Kiromim Baroroh</b><span>Pengembang · STIT Muhammadiyah Bojonegoro</span></div><span class="go">→</span></a></div></section>';
  }

  function petunjuk() {
    app.innerHTML = '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Petunjuk</p><span class="pnum">🧭 Sebelum mulai</span><h1>Cara Belajar di Sini</h1><p class="sub">Lima bagian yang mengikuti pilar QS. Al-‘Ashr</p></div></section>' +
      '<section class="sec"><div class="wrap">' +
      '<div class="card mat"><h3>📚 Alur setiap bagian</h3><ul><li><b>Tujuan</b>: apa yang akan kamu pahami.</li><li><b>Pemantik</b>: pertanyaan untuk diingat-ingat.</li><li><b>Ayat & hadis</b>: teks Arab dan terjemahnya.</li><li><b>Penjelasan</b>: makna dan tafsir ringkas.</li><li><b>Video & cerita</b>: contoh dari kehidupan sehari-hari.</li><li><b>Aktivitas</b>: simulasi interaktif.</li><li><b>Refleksi</b>: jawaban pribadi yang hanya tersimpan di perangkatmu.</li><li><b>Kuis</b>: latihan dengan umpan balik langsung.</li></ul></div>' +
      '<div class="card mat"><h3>👩‍🏫 Belajar bersama guru</h3><p>Website ini dipakai dalam pembelajaran PAI yang dipandu guru selama empat pertemuan. Ikuti arahan gurumu tentang bagian mana yang dikerjakan di setiap pertemuan.</p></div>' +
      '<div class="card mat"><h3>💬 Tidak ada yang menghakimi</h3><p>Kamu tidak perlu menceritakan kebiasaanmu di depan kelas. Jawablah refleksi dengan jujur untuk dirimu sendiri.</p></div>' +
      '<div class="card mat"><h3>🫶 Jika kamu merasa sangat cemas</h3><p>Jika berita buruk membuatmu sulit tidur atau sedih berkepanjangan, ceritakan kepada orang tua, wali kelas, atau guru BK. Meminta bantuan adalah langkah yang berani.</p></div>' +
      '<div class="row" style="margin-top:22px"><a class="btn btn-main" href="#bagian-1">Mulai Bagian 1 →</a></div></div></section>';
  }

  var MAT_IK = { 1: ["🕰️", "🎨", "💼", "🙈", "📵"], 2: ["💡", "📜", "🛑", "🌙", "🌤️"], 3: ["🌱", "📲", "🍂", "⚖️"], 4: ["🔎", "📰", "🖐️", "🤝"], 5: ["💪", "👫", "🪜", "🫶"] };

  function slider(slides) {
    var el = h('<div class="slider"><div class="slides" tabindex="0" aria-label="Kartu penjelasan, geser ke samping"></div><div class="sl-nav"><button type="button" class="sl-btn" aria-label="Sebelumnya">‹</button><div class="dots"></div><button type="button" class="sl-btn" aria-label="Berikutnya">›</button></div></div>');
    var track = $(".slides", el), dots = $(".dots", el);
    slides.forEach(function (s, i) {
      track.insertAdjacentHTML("beforeend", '<article class="slide"><div class="sl-top"><span class="sl-ic">' + s.ic + '</span><span class="sl-n">' + (i + 1) + " / " + slides.length + "</span></div><h3>" + s.h + "</h3>" + s.body + "</article>");
      dots.insertAdjacentHTML("beforeend", '<i class="' + (i ? "" : "on") + '"></i>');
    });
    function idx() { var w = track.firstChild.getBoundingClientRect().width + 14; return Math.round(track.scrollLeft / w); }
    function goTo(i) { var t = track.children[Math.max(0, Math.min(slides.length - 1, i))]; track.scrollTo({ left: t.offsetLeft - track.offsetLeft - 2, behavior: "smooth" }); }
    track.addEventListener("scroll", function () { var k = idx(); $$("i", dots).forEach(function (d, j) { d.classList.toggle("on", j === k); }); });
    var bt = $$(".sl-btn", el); bt[0].onclick = function () { goTo(idx() - 1); }; bt[1].onclick = function () { goTo(idx() + 1); };
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") goTo(idx() + 1); if (e.key === "ArrowLeft") goTo(idx() - 1); });
    return el;
  }

  function part(no) {
    var b = C.bagian[no - 1]; if (!b) return notFound();
    var pil = C.pilar[no - 1];
    S.opened[no] = Date.now(); S.last = no; S.pos = S.pos || {}; save(S);
    var steps = [["tujuan", "Mulai", "🎯"], ["dalil", "Ayat", "📖"], ["materi", "Penjelasan", "💬"], ["diagram", "Diagram", "📊"], ["video", "Video", "🎬"], ["cerita", "Contoh", "📱"], ["aktivitas", "Aktivitas", "🕹️"], ["refleksi", "Refleksi", "✍️"], ["rangkuman", "Rangkuman", "📌"], ["kuis", "Kuis", "✅"]];
    app.innerHTML =
      '<section class="phead slim"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Bagian ' + b.no + '</p><div class="ph-row"><div><span class="pnum">' + b.ikon + " Bagian " + b.no + "</span><h1>" + esc(b.judul) + '</h1><p class="sub">' + esc(b.sub) + '</p></div><p class="ar-pillar" lang="ar">' + pil.arab + "</p></div></div></section>" +
      '<nav class="stepper" aria-label="Langkah belajar"><div class="wrap"><ol>' + steps.map(function (s, i) { return '<li><button type="button" data-i="' + i + '"><span class="sn">' + (i + 1) + "</span><span class=\"sl\">" + s[1] + "</span></button></li>"; }).join("") + '</ol></div><div class="sbar"><i></i></div></nav>' +
      '<div class="wrap stage" id="partBody"></div>' +
      '<div class="pager"><div class="wrap"><button type="button" class="btn btn-ghost pg-prev">←</button><span class="pg-info"></span><button type="button" class="btn btn-main pg-next">Lanjut →</button></div></div>';
    var body = $("#partBody");
    function blk(id, icon, title, inner) {
      var s = h('<section class="block step" id="s-' + id + '"><h2><span class="dot">' + icon + "</span>" + title + "</h2></section>");
      if (typeof inner === "string") s.insertAdjacentHTML("beforeend", inner); else s.appendChild(inner);
      body.appendChild(s); return s;
    }
    blk("tujuan", "🎯", "Siap belajar?", '<div class="hero-step"><span class="big-ic">' + b.ikon + '</span><p class="lead-step">' + esc(b.tujuan) + '</p></div><div class="card ask"><span class="lbl">Coba ingat-ingat dulu…</span><p>' + esc(b.pemantik) + "</p></div>");
    blk("dalil", "📖", "Ayat & Hadis", b.dalil.map(dalilCard).join(""));

    var ms = blk("materi", "💬", "Penjelasan", "");
    ms.appendChild(speakBtn(function () { return b.materi.map(function (m) { return m.h + ". " + plain(m.p || "") + " " + (m.list || []).join(". "); }).join(" "); }, "Dengarkan semua"));
    var sl = b.materi.map(function (m, i) {
      var pp = "";
      if (m.p) {
        var sn = m.p.split(/(?<=\.)\s+(?=[A-Z“])/);
        pp = '<p class="inti">' + sn[0] + "</p>" + (sn.length > 1 ? '<details class="lanjut"><summary>Baca selengkapnya</summary><p>' + sn.slice(1).join(" ") + "</p></details>" : "");
      }
      return { ic: (MAT_IK[b.no] || [])[i] || "✨", h: esc(m.h), body: pp + (m.list ? '<ul class="checks">' + m.list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") };
    });
    if (b.tafsir) b.tafsir.forEach(function (t) { sl.push({ ic: "📚", h: esc(t.m), body: '<p class="small muted" style="margin:0 0 6px"><i>' + esc(t.k) + "</i></p><p>" + esc(t.t) + "</p>" }); });
    ms.appendChild(slider(sl));
    ms.insertAdjacentHTML("beforeend", '<p class="hint">👉 Geser kartu ke samping atau tekan tombol panah.</p>');

    blk("diagram", "📊", "Diagram", diagram(b.no));
    var vs = blk("video", "🎬", "Video & Audio", videoBlock(b.no));
    var aud = h('<div class="card audio-card"><div><b>🎧 Versi audio</b><p class="small muted" style="margin:2px 0 0">Contoh situasi + rangkuman</p></div></div>');
    aud.appendChild(speakBtn(function () { return b.cerita.judul + ". " + b.cerita.teks.join(" ") + " Rangkuman. " + C.ringkasan[b.no].join(" "); }, "Putar"));
    vs.appendChild(aud);
    blk("cerita", "📱", "Contoh Situasi", '<div class="story"><div class="st-h">' + esc(b.cerita.judul) + '</div><div class="st-b">' + b.cerita.teks.map(function (t, i) { return '<p class="panel"><span>' + (i ? "⏱️" : "📍") + "</span>" + esc(t) + "</p>"; }).join("") + '<div class="st-q">🤔 ' + esc(b.cerita.tanya) + "</div></div></div>");
    blk("aktivitas", "🕹️", "Aktivitas", ACT[b.aktivitas]());
    blk("refleksi", "✍️", "Refleksi Pribadi", reflBlock("b" + b.no, b.refleksi));
    blk("rangkuman", "📌", "Rangkuman", '<div class="summ-grid">' + C.ringkasan[b.no].map(function (x, i) { return '<div class="summ-c"><span>' + (i + 1) + "</span><p>" + esc(x) + "</p></div>"; }).join("") + "</div>");
    var qwrap = h('<div><div class="quiz-head"><span class="qic">🧠</span><span>' + b.kuis.length + " soal · pilih jawaban, lalu baca penjelasannya</span></div></div>");
    qwrap.appendChild(quizBlock(b.kuis, "b" + b.no));
    blk("kuis", "✅", "Kuis Bagian " + b.no, qwrap);

    var secs = $$(".step", body), btns = $$(".stepper button"), cur = 0;
    var prev = $(".pg-prev"), next = $(".pg-next"), info = $(".pg-info"), bar = $(".stepper .sbar i");
    function show(i, scroll) {
      cur = Math.max(0, Math.min(secs.length - 1, i)); stopSpeak();
      secs.forEach(function (s, j) { s.classList.toggle("on", j === cur); });
      btns.forEach(function (x, j) { x.classList.toggle("on", j === cur); x.classList.toggle("past", j < cur); x.setAttribute("aria-current", j === cur ? "step" : "false"); });
      var ab = btns[cur]; ab.parentNode.parentNode.scrollTo({ left: ab.parentNode.offsetLeft - 40, behavior: "smooth" });
      bar.style.width = ((cur + 1) / secs.length * 100) + "%";
      info.textContent = (cur + 1) + " / " + secs.length;
      prev.disabled = false; prev.textContent = cur === 0 ? (no > 1 ? "← Bagian " + (no - 1) : "← Beranda") : "←";
      next.textContent = cur === secs.length - 1 ? (S.done[no] ? "Bagian berikutnya →" : "Selesai ✓") : "Lanjut →";
      S.pos[no] = cur; save(S);
      if (scroll) { var top = $(".stepper").getBoundingClientRect().top + window.scrollY - 60; window.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); }
    }
    btns.forEach(function (x) { x.onclick = function () { show(+x.dataset.i, true); }; });
    prev.onclick = function () { if (cur === 0) { location.hash = no > 1 ? "#bagian-" + (no - 1) : "#beranda"; } else show(cur - 1, true); };
    next.onclick = function () {
      if (cur < secs.length - 1) return show(cur + 1, true);
      S.done[no] = true; save(S); updChip(); location.hash = no < 5 ? "#bagian-" + (no + 1) : "#rangkuman";
    };
    show(S.pos[no] || 0, false);
  }

  function rangkuman() {
    app.innerHTML = '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Rangkuman</p><span class="pnum">🗺️ Pertemuan 4</span><h1>Empat Pilar, Satu Kendali</h1><p class="sub">Hubungan nilai Al-‘Ashr dengan pengendalian doomscrolling</p></div></section>' +
      '<section class="sec"><div class="wrap"><div class="map">' + C.pilar.map(function (p) {
        return '<div class="m" data-tone="' + p.no + '"><div class="ic">' + p.ikon + '</div><div><p class="ar-s" lang="ar">' + p.arab + "</p><h3>" + esc(p.nama) + "</h3><p>" + esc(p.ringkas) + "</p></div></div>";
      }).join("") + '</div>' +
      '<div class="card ask" style="margin-top:18px"><span class="lbl">Intinya</span><p>Waktu adalah modal. Iman menjadi rem dari dalam diri, amal saleh menjadi arah, tabayyun menjaga kebenaran, dan kesabaran yang saling dikuatkan membuat kita mampu berhenti.</p></div>' +
      '<h2 style="margin-top:34px">Rencana Kecilku</h2><p class="muted">Pilih langkah yang ingin kamu coba minggu ini. Cukup dua atau tiga saja agar realistis.</p><div class="pledge" id="pledge"></div>' +
      '<div id="pledgeMsg" class="card" style="display:none;margin-top:12px"></div>' +
      '<h2 style="margin-top:34px">Refleksi Akhir</h2><div id="rf"></div>' +
      '<div class="next"><a class="btn btn-ghost" href="#bagian-5">← Bagian 5</a><a class="btn btn-main" href="#kuis-akhir">Kuis Akhir →</a></div></div></section>';
    var pl = $("#pledge"), msg = $("#pledgeMsg");
    function showMsg() {
      if (!S.plan.length) { msg.style.display = "none"; return; }
      msg.style.display = "block";
      msg.innerHTML = "<b>Komitmenku minggu ini:</b><ul style='margin:6px 0 0'>" + S.plan.map(function (i) { return "<li>" + esc(C.rencana[i]) + "</li>"; }).join("") + "</ul><p class='small muted' style='margin:8px 0 0'>Kamu bisa memotret layar ini sebagai pengingat.</p>";
    }
    C.rencana.forEach(function (r, i) {
      var lb = h('<label><input type="checkbox"' + (S.plan.indexOf(i) > -1 ? " checked" : "") + "><span>" + esc(r) + "</span></label>");
      $("input", lb).addEventListener("change", function (e) {
        var k = S.plan.indexOf(i); if (e.target.checked && k < 0) S.plan.push(i); if (!e.target.checked && k > -1) S.plan.splice(k, 1);
        save(S); showMsg();
      });
      pl.appendChild(lb);
    });
    showMsg();
    $("#rf").appendChild(reflBlock("akhir", "Dengan bahasamu sendiri, jelaskan bagaimana keempat pilar Al-‘Ashr membantumu mengendalikan kebiasaan menggulir konten negatif."));
  }

  function kuisAkhir() {
    var list = C.kuisAkhir, i = 0, score = 0;
    app.innerHTML = '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Kuis Akhir</p><span class="pnum">🏁 Latihan</span><h1>Kuis Akhir</h1><p class="sub">' + list.length + " soal tentang seluruh nilai Al-‘Ashr</p></div></section>" +
      '<section class="sec"><div class="wrap"><div class="fq-bar"><i id="bar" style="width:0"></i></div><div id="fq"></div></div></section>';
    var fq = $("#fq");
    function show() {
      $("#bar").style.width = (i / list.length * 100) + "%";
      if (i >= list.length) {
        var pct = Math.round(score / list.length * 100);
        S.quiz.akhir = Math.max(S.quiz.akhir || 0, score); S.quizLast.akhir = score; save(S);
        fq.innerHTML = '<div class="card result"><p class="muted" style="margin:0">Skormu</p><div class="big">' + score + "/" + list.length + '</div><p style="font-weight:700">' +
          (pct >= 80 ? "Masyaallah, pemahamanmu sudah kuat! 🌟" : pct >= 60 ? "Bagus! Ulangi bagian yang masih ragu, ya." : "Tidak apa-apa. Baca ulang bagian-bagiannya, lalu coba lagi.") +
          '</p><div class="row"><button class="btn btn-main" id="again" type="button">Ulangi kuis</button><a class="btn btn-ghost" href="#rangkuman">Kembali ke rangkuman</a></div></div>';
        $("#again").onclick = function () { i = 0; score = 0; show(); };
        return;
      }
      var it = list[i];
      fq.innerHTML = '<p class="muted small" style="margin:0 0 6px">Soal ' + (i + 1) + " dari " + list.length + "</p>";
      var q = h('<div class="q"><p class="qt">' + esc(it.q) + "</p></div>");
      it.o.forEach(function (op, oi) {
        var b = h('<button class="opt" type="button">' + String.fromCharCode(65 + oi) + ". " + esc(op) + "</button>");
        b.onclick = function () {
          $$(".opt", q).forEach(function (x, xi) { x.disabled = true; if (xi === it.a) x.classList.add("right"); });
          var ok = oi === it.a; if (ok) score++; else b.classList.add("wrong");
          q.appendChild(h('<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "Tepat! " : "Belum tepat. ") + "</b>" + esc(it.w) + "</div>"));
          var nb = h('<button class="btn btn-dark" type="button" style="margin-top:12px">' + (i < list.length - 1 ? "Soal berikutnya →" : "Lihat hasil") + "</button>");
          nb.onclick = function () { i++; show(); window.scrollTo(0, 0); };
          q.appendChild(nb); nb.focus();
        };
        q.appendChild(b);
      });
      fq.appendChild(q);
    }
    show();
  }

  var guruOK = false;
  function guru() {
    app.innerHTML = '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Guru</p><span class="pnum">👩‍🏫 Untuk guru PAI</span><h1>Panduan Guru</h1><p class="sub">Skenario empat pertemuan dan catatan pelaksanaan</p></div></section><section class="sec"><div class="wrap" id="gw"></div></section>';
    var gw = $("#gw");
    if (!guruOK) {
      gw.innerHTML = '<div class="card gate"><p style="margin-top:0">Masukkan kata sandi guru.</p><input type="password" id="pw" aria-label="Kata sandi"><button class="btn btn-dark" id="go" type="button">Masuk</button><p class="small muted" id="pwm"></p></div>';
      function tryIn() { if ($("#pw").value === CFG.GURU_PASSWORD) { guruOK = true; guru(); } else { $("#pwm").textContent = "Kata sandi belum tepat."; } }
      $("#go").onclick = tryIn; $("#pw").addEventListener("keydown", function (e) { if (e.key === "Enter") tryIn(); });
      return;
    }
    var g = C.guru;
    gw.innerHTML = '<div class="warn">Rancangan ini bersifat awal dan dapat disesuaikan dengan alur tujuan pembelajaran sekolah. Pretest dan posttest dikerjakan di kertas, terpisah dari website.</div>' +
      g.pertemuan.map(function (p) {
        return '<div class="card" style="margin-top:14px"><p class="kicker" style="margin:0">Pertemuan ' + p.no + ' · ±2 JP</p><h3 style="margin:4px 0 6px;font-family:var(--serif)">' + esc(p.fokus) + "</h3><p><b>Tujuan:</b> " + esc(p.tujuan) + "</p><p style='margin-bottom:4px'><b>Kegiatan:</b></p><ol style='margin-top:0'>" + p.kegiatan.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ol><p style='margin:0'><b>Halaman:</b> " + p.bagian.map(function (n) { return '<a href="#bagian-' + n + '">Bagian ' + n + "</a>"; }).join(", ") + (p.no === 4 ? ', <a href="#rangkuman">Rangkuman</a>, <a href="#kuis-akhir">Kuis Akhir</a>' : "") + "</p></div>";
      }).join("") +
      '<h2 style="margin-top:30px">Catatan pelaksanaan</h2><div class="card mat"><ul style="margin:0">' + g.catatan.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" +
      '<h2 style="margin-top:30px">Kunci kuis per bagian</h2><div class="card" style="overflow-x:auto"><table><tr><th>Bagian</th><th>Kunci</th></tr>' +
      C.bagian.map(function (b) { return "<tr><td>" + b.no + ". " + esc(b.judul) + "</td><td>" + b.kuis.map(function (q, i) { return (i + 1) + "-" + String.fromCharCode(65 + q.a); }).join(", ") + "</td></tr>"; }).join("") +
      "<tr><td>Kuis akhir</td><td>" + C.kuisAkhir.map(function (q, i) { return (i + 1) + "-" + String.fromCharCode(65 + q.a); }).join(", ") + "</td></tr></table></div>" +
      '<div class="row" style="margin-top:22px"><button class="btn btn-ghost" id="reset" type="button">Hapus progres di perangkat ini</button></div>';
    var rs = $("#reset"), armed = false;
    rs.onclick = function () {
      if (!armed) { armed = true; rs.textContent = "Yakin? Klik sekali lagi untuk menghapus"; return; }
      S = { done: {}, refl: {}, quiz: {}, plan: [] }; save(S); updChip(); location.hash = "#beranda";
    };
  }

  function pengembang() {
    var D = C.pengembang;
    app.innerHTML = '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / Profil Pengembang</p><span class="pnum">👤 Tentang pengembang</span><h1>Profil Pengembang</h1><p class="sub">Orang di balik media pembelajaran ini</p></div></section>' +
      '<section class="sec"><div class="wrap"><div class="card"><div class="dev"><div class="avatar">KB</div><div><span class="role">' + esc(D.peran) + "</span><h2>" + esc(D.nama) + '</h2><p class="muted" style="margin:0">' + esc(D.kampus) + "</p><p>" + esc(D.bio) + "</p></div></div>" +
      '<div class="facts">' + D.fakta.map(function (f) { return '<div><span class="fi">' + f[0] + "</span><span><small>" + esc(f[1]) + "</small>" + esc(f[2]) + "</span></div>"; }).join("") + "</div></div>" +
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0;font-family:var(--serif)">Ucapan terima kasih</h3><p style="margin:0">' + esc(D.terimakasih) + "</p></div>" +
      '<div class="row" style="margin-top:22px"><a class="btn btn-main" href="#beranda">← Kembali ke beranda</a></div></div></section>';
  }


  function tgl(s) { var b = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"], p = s.split("-"); return +p[2] + " " + b[+p[1] - 1] + " " + p[0]; }
  function head(crumb, pill, title, sub) {
    return '<section class="phead"><div class="wrap"><p class="crumb"><a href="#beranda">Beranda</a> / ' + esc(crumb) + '</p><span class="pnum">' + pill + "</span><h1>" + esc(title) + '</h1><p class="sub">' + esc(sub) + "</p></div></section>";
  }

  function materi() {
    var groups = {};
    C.bagian.forEach(function (b) { (groups[b.pertemuan] = groups[b.pertemuan] || []).push(b); });
    app.innerHTML = head("Daftar Materi", "📚 Daftar materi", "Daftar Materi", C.mapel.nama + " · " + C.mapel.kelas) +
      '<section class="sec"><div class="wrap"><div class="card meta"><div><small>Mata pelajaran</small><b>' + esc(C.mapel.nama) + '</b></div><div><small>Kelas</small><b>' + esc(C.mapel.kelas) + '</b></div><div><small>Elemen</small><b>' + esc(C.mapel.elemen) + '</b></div><div><small>Topik</small><b>QS. Al-‘Ashr & pengendalian doomscrolling</b></div></div>' +
      '<div class="filter" role="group" aria-label="Kelompokkan"><button type="button" class="on" data-g="pertemuan">Per pertemuan</button><button type="button" data-g="topik">Per pilar/topik</button></div><div id="mlist"></div></div></section>';
    function item(b) {
      return '<a class="mitem" data-tone="' + b.no + '" href="#bagian-' + b.no + '"><span class="ic">' + b.ikon + "</span><span><b>Bagian " + b.no + ": " + esc(b.judul) + "</b><small>" + esc(b.sub) + "</small></span>" +
        (S.done[b.no] ? '<span class="badge done">✓</span>' : S.opened[b.no] ? '<span class="badge">Dibuka</span>' : '<span class="badge">Baru</span>') + "</a>";
    }
    function render(g) {
      var out = "";
      if (g === "pertemuan") {
        Object.keys(groups).forEach(function (k) { out += '<h3 class="grp">Pertemuan ' + k + "</h3>" + groups[k].map(item).join(""); });
        out += '<h3 class="grp">Pertemuan 4 (lanjutan)</h3><a class="mitem" href="#rangkuman"><span class="ic">🗺️</span><span><b>Rangkuman empat pilar</b><small>Peta nilai Al-‘Ashr dan Rencana Kecilku</small></span></a><a class="mitem" href="#kuis-akhir"><span class="ic">🏁</span><span><b>Kuis akhir</b><small>10 soal dengan pembahasan</small></span></a>';
      } else {
        out += '<h3 class="grp">Elemen Al-Qur’an Hadis</h3>' + [1, 2].map(function (n) { return item(C.bagian[n - 1]); }).join("");
        out += '<h3 class="grp">Elemen Akhlak (bermedia)</h3>' + [3, 4, 5].map(function (n) { return item(C.bagian[n - 1]); }).join("");
        out += '<h3 class="grp">Penunjang</h3><a class="mitem" href="#glosarium"><span class="ic">🔤</span><span><b>Glosarium</b><small>Istilah penting</small></span></a><a class="mitem" href="#unduhan"><span class="ic">⬇️</span><span><b>Unduhan</b><small>Ringkasan PDF dan lembar kerja</small></span></a>';
      }
      $("#mlist").innerHTML = out;
    }
    $$(".filter button").forEach(function (bt) { bt.onclick = function () { $$(".filter button").forEach(function (x) { x.classList.remove("on"); }); bt.classList.add("on"); render(bt.dataset.g); }; });
    render("pertemuan");
  }

  function progres() {
    var opened = Object.keys(S.opened).length, done = Object.keys(S.done).length;
    var ulang = C.bagian.filter(function (b) { return S.quizLast["b" + b.no] != null && S.quizLast["b" + b.no] < 2; });
    var belum = C.bagian.filter(function (b) { return S.opened[b.no] && S.quizLast["b" + b.no] == null; });
    var pct = Math.round((done / 5) * 100);
    app.innerHTML = head("Progres", "📈 Progres belajar", "Progres Belajarku", "Tersimpan di perangkat ini saja") +
      '<section class="sec"><div class="wrap"><div class="card prog-top"><div class="ring" style="--p:' + pct + '"><span>' + pct + '%</span></div><div><b>' + done + " dari 5 bagian selesai</b><p class='muted small' style='margin:2px 0 0'>" + opened + " bagian sudah dibuka · kuis akhir: " + (S.quizLast.akhir != null ? S.quizLast.akhir + "/10" : "belum") + "</p></div></div>" +
      '<h2 style="margin-top:28px">Rincian per bagian</h2><div class="ptable">' + C.bagian.map(function (b) {
        return '<div class="prow" data-tone="' + b.no + '"><span class="ic">' + b.ikon + '</span><span class="pt"><b>' + b.no + ". " + esc(b.judul) + "</b><small>" + (S.opened[b.no] ? "Dibuka " + new Date(S.opened[b.no]).toLocaleDateString("id-ID") : "Belum dibuka") + (S.done[b.no] ? " · selesai" : "") + "</small></span>" + lastScoreLabel("b" + b.no, 3) + "</div>";
      }).join("") + '<div class="prow"><span class="ic">🏁</span><span class="pt"><b>Kuis akhir</b><small>10 soal</small></span>' + lastScoreLabel("akhir", 10) + "</div></div>" +
      '<h2 style="margin-top:28px">Topik yang perlu diulang</h2>' +
      (ulang.length || belum.length || (S.quizLast.akhir != null && S.quizLast.akhir < 7) ?
        '<div class="card"><ul class="todo">' + ulang.map(function (b) { return '<li>🔁 <a href="#bagian-' + b.no + '">' + esc(b.judul) + "</a>: skor kuis terakhir " + S.quizLast["b" + b.no] + "/3. Baca lagi bagian Penjelasan dan Rangkuman.</li>"; }).join("") +
        belum.map(function (b) { return '<li>✏️ <a href="#bagian-' + b.no + '">' + esc(b.judul) + "</a>: kuisnya belum dikerjakan.</li>"; }).join("") +
        (S.quizLast.akhir != null && S.quizLast.akhir < 7 ? '<li>🏁 <a href="#kuis-akhir">Kuis akhir</a>: skor ' + S.quizLast.akhir + "/10, coba lagi setelah membaca rangkuman.</li>" : "") + "</ul></div>"
        : '<div class="card"><p style="margin:0">' + (opened ? "🌟 Belum ada topik yang perlu diulang. Pertahankan!" : "Mulai dari Bagian 1, lalu kerjakan kuisnya. Rekomendasi akan muncul di sini.") + "</p></div>") +
      '<div class="row" style="margin-top:22px"><a class="btn btn-main" href="#bagian-' + (C.bagian.filter(function (b) { return !S.done[b.no]; })[0] || { no: 1 }).no + '">Lanjut belajar →</a></div></div></section>';
  }

  function glosarium() {
    app.innerHTML = head("Glosarium", "🔤 Istilah penting", "Glosarium", C.glosarium.length + " istilah yang dipakai dalam materi") +
      '<section class="sec"><div class="wrap"><input class="search" id="gq" type="search" placeholder="Cari istilah, misalnya tabayyun…" aria-label="Cari istilah"><dl class="gloss" id="gl"></dl><p class="muted" id="gn" hidden>Istilah tidak ditemukan.</p></div></section>';
    function render(q) {
      q = (q || "").toLowerCase();
      var list = C.glosarium.slice().sort(function (x, y) { return x[0].localeCompare(y[0], "id"); }).filter(function (g) { return !q || (g[0] + " " + g[1]).toLowerCase().indexOf(q) > -1; });
      $("#gl").innerHTML = list.map(function (g) { return "<div><dt>" + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd></div>"; }).join("");
      $("#gn").hidden = list.length > 0;
    }
    $("#gq").addEventListener("input", function (e) { render(e.target.value); }); render("");
  }

  function unduhan() {
    app.innerHTML = head("Unduhan", "⬇️ Unduhan", "Unduhan", "Berkas PDF untuk dibaca atau dicetak") +
      '<section class="sec"><div class="wrap"><div class="dl">' + C.unduhan.map(function (u) {
        return '<a class="card dlc" href="' + u.file + '" download><span class="ic">' + u.ikon + '</span><span><b>' + esc(u.judul) + '</b><small>' + esc(u.ket) + '</small></span><span class="btn btn-main">PDF ↓</span></a>';
      }).join("") + '</div><p class="small muted">Berkas juga bisa dibuka langsung di browser lalu dicetak.</p></div></section>';
  }

  function tanya() {
    var T = CFG.TANYA || {};
    var form = "";
    if (T.googleForm) {
      var src = T.googleForm + (T.googleForm.indexOf("?") > -1 ? "&" : "?") + "embedded=true";
      form = '<div class="card"><h3 style="margin-top:0">Kirim pertanyaan</h3><iframe class="gform" src="' + esc(src) + '" title="Formulir pertanyaan" loading="lazy"></iframe></div>';
    } else if (T.whatsapp) {
      form = '<div class="card"><h3 style="margin-top:0">Kirim pertanyaan ke ' + esc(T.namaGuru || "guru") + '</h3><label class="lbl" for="tq">Pertanyaanmu</label><textarea id="tq" placeholder="Tulis pertanyaan tentang materi…"></textarea><label class="lbl" for="tb">Bagian yang ditanyakan</label><select id="tb"><option>Umum</option>' + C.bagian.map(function (b) { return "<option>Bagian " + b.no + ": " + esc(b.judul) + "</option>"; }).join("") + '</select><div class="row" style="justify-content:flex-start;margin-top:12px"><button class="btn btn-main" id="tsend" type="button">Kirim lewat WhatsApp</button></div><p class="small muted">Pesan dikirim lewat aplikasi WhatsApp milikmu ke nomor guru. Website tidak menyimpan pertanyaan.</p></div>';
    } else {
      form = '<div class="card warn-soft"><b>Formulir pertanyaan belum diaktifkan.</b><p class="small" style="margin:4px 0 0">Guru dapat mengaktifkannya dengan mengisi tautan Google Form atau nomor WhatsApp di <code>js/config.js</code>. Sementara itu, tuliskan pertanyaanmu di bawah dan sampaikan kepada guru PAI di kelas.</p><textarea id="tq" style="margin-top:10px" placeholder="Catat pertanyaanmu di sini (tersimpan di perangkatmu)…"></textarea></div>';
    }
    app.innerHTML = head("Tanya Jawab", "💬 Tanya jawab", "Tanya Jawab", "Bertanya dan berdiskusi bersama guru") +
      '<section class="sec"><div class="wrap">' + form +
      (T.grupDiskusi ? '<a class="card dlc" href="' + esc(T.grupDiskusi) + '" target="_blank" rel="noopener"><span class="ic">👥</span><span><b>Gabung ruang diskusi kelas</b><small>Diskusi bersama teman dan guru</small></span><span class="btn btn-dark">Buka</span></a>' : "") +
      '<h2 style="margin-top:28px">Pertanyaan diskusi</h2><div class="card"><ol style="margin:0">' + C.bagian.map(function (b) { return "<li>" + esc(b.cerita.tanya) + ' <a class="small" href="#bagian-' + b.no + '">(Bagian ' + b.no + ")</a></li>"; }).join("") + "</ol></div>" +
      '<h2 style="margin-top:28px">Pertanyaan yang sering diajukan</h2><div class="faq">' + C.faq.map(function (f) { return "<details><summary>" + esc(f[0]) + "</summary><p>" + esc(f[1]) + "</p></details>"; }).join("") + "</div></div></section>";
    var ta = $("#tq");
    if (ta) { ta.value = S.tanya || ""; ta.addEventListener("input", function () { S.tanya = ta.value; save(S); }); }
    var sb = $("#tsend");
    if (sb) sb.onclick = function () {
      var q = ta.value.trim(); if (!q) { ta.focus(); return; }
      var msg = "Assalamu’alaikum, " + (T.namaGuru || "Bu/Pak Guru") + ". Saya ingin bertanya tentang " + $("#tb").value + " (website Demi Masa):\n\n" + q;
      window.location.href = "https://wa.me/" + encodeURIComponent(T.whatsapp) + "?text=" + encodeURIComponent(msg);
    };
  }

  function notFound() { app.innerHTML = '<section class="sec"><div class="wrap"><h2>Halaman tidak ditemukan</h2><a class="btn btn-dark" href="#beranda">Kembali ke beranda</a></div></section>'; }

  /* ---------- router ---------- */
  function route() {
    var p = (location.hash || "#beranda").slice(1) || "beranda";
    stopSpeak(); drawer.hidden = true; document.body.classList.toggle("has-pager", /^bagian-/.test(p)); menuBtn.setAttribute("aria-expanded", "false");
    $$(".drawer a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + p); });
    var m = p.match(/^bagian-(\d)$/);
    app.removeAttribute("data-tone"); if (m) app.setAttribute("data-tone", m[1]);
    if (p === "beranda") home();
    else if (p === "petunjuk") petunjuk();
    else if (m) part(+m[1]);
    else if (p === "rangkuman") rangkuman();
    else if (p === "kuis-akhir") kuisAkhir();
    else if (p === "guru") guru();
    else if (p === "pengembang") pengembang();
    else if (p === "materi") materi();
    else if (p === "progres") progres();
    else if (p === "glosarium") glosarium();
    else if (p === "unduhan") unduhan();
    else if (p === "tanya") tanya();
    else notFound();
    window.scrollTo(0, 0); updChip();
    var t = $("h1", app); document.title = (t ? t.textContent + " · " : "") + "Demi Masa";
  }
  window.addEventListener("hashchange", route);
  route();
})();
