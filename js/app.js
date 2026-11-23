/**
 * ============================================================================
 * MODULE 5: APPLICATION UI CONTROLLER
 * 4-Step Scientific Learning Loop + Learning Accelerators:
 * - Sino-Vietnamese & Radical Etymology Decomposition
 * - SRS Spaced Repetition ('hard' | 'good' | 'easy'), Search & Hands-free Auto-Play
 * - Interactive 米字格 (MiZiGe) Traditional Hanzi Writing Pad & Stroke Grader
 * - Step-by-step Tile Hint & Listening Dictation Mode (聽寫)
 * - Visual Tone Contour Map, Tone Sandhi Alerts & Shadowing Mode (跟讀)
 * ============================================================================
 */
window.App = (function () {
  "use strict";

  const DB = window.CurriculumDB;
  const Store = window.AppStore;
  const Voice = window.VoiceService;
  const Speech = window.SpeechService;

  const TONE_CONTOUR_LABELS = {
    1: "T1 ˉ (Cao ngang)",
    2: "T2 ˊ (Lên cao)",
    3: "T3 ˇ (Xuống-lên)",
    4: "T4 ˋ (Hạ mạnh)",
    0: "T0 · (Thanh nhẹ)"
  };

  const ui = {
    currentStep: "vocab", // "vocab" | "sentence" | "speak" | "test"
    vocabSubMode: "flashcard", // "flashcard" | "writing" | "grammar"
    vocabIdx: 0,
    autoPlayTimer: null,
    exampleFilter: "all", // "all" | 0 | 1 | 2
    exampleQueryOverride: "",
    customSpeakItem: null,

    // Hanzi Writing Pad state
    writeCharIdx: 0,
    writeShowGuide: true,
    writeIsDrawing: false,
    writeStrokeCount: 0,
    writeLastPt: null,

    // Step 2 Sentence state
    sentSubMode: "v2z", // "v2z" | "z2v" | "dictation"
    sentIdx: 0,
    v2zPicked: [],
    v2zShuffled: [],
    z2vOptions: [],
    dictRevealed: false,

    // Step 3 Speak state
    speakSubMode: "sentence", // "sentence" | "word" | "roleplay"
    speakIdx: 0,
    charOverrides: {},
    dictationTimer: null,
    waveIdleTimer: null,
    isShadowing: false,

    // Step 4 Test state
    testSubMode: "match", // "match" | "detective" | "quiz" | "progress"
    matchCards: [],
    matchFirstIdx: null,
    matchMatched: new Set(),
    detectiveIdx: 0,
    quizItem: null,
    quizOptions: [],

    focusInterval: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // ==========================================================================
  // Navigation & Top Bar Synchronization
  // ==========================================================================
  function setStep(step) {
    Voice.playEffect("pop");
    stopAutoPlayVocab();
    if (Speech.getIsRecording()) {
      Speech.stopRecording(false);
    }
    ui.currentStep = step;
    ["vocab", "sentence", "speak", "test"].forEach((s) => {
      el("nav-step-" + s)?.classList.toggle("active", s === step);
      el("panel-step-" + s)?.classList.toggle("hidden", s !== step);
    });
    renderCurrentStep();
  }

  function syncTopBar() {
    if (el("top-scope-summary")) {
      el("top-scope-summary").textContent = Store.getScopeSummaryText();
    }

    if (el("top-voice-summary")) {
      const g = Store.state.voiceGender;
      const gLabel =
        g === "female" ? "👩 Nữ (雅婷)" : g === "male" ? "👨 Nam (雲哲)" : "👫 Song thanh";
      el("top-voice-summary").textContent = `${gLabel} • ${Store.state.voiceRate}x`;
    }

    const doneCount = Store.state.comebackTasks.filter((t) => t.done).length;
    const comebackBtn = el("top-comeback-btn");
    if (comebackBtn) {
      if (Store.state.comebackBroken) {
        comebackBtn.className = "pill-btn pill-jade";
        comebackBtn.textContent = `✅ Đã phá băng (${doneCount}/3)`;
      } else {
        comebackBtn.className = "pill-btn pill-alert";
        comebackBtn.textContent = `🔥 Nghỉ 5 ngày (${doneCount}/3)`;
      }
    }

    el("comeback-strip")?.classList.toggle(
      "hidden",
      Store.state.comebackDismissed || Store.state.comebackBroken
    );
  }

  function cycleVoiceGender() {
    Voice.playEffect("pop");
    const order = ["female", "male", "duet"];
    const next = order[(order.indexOf(Store.state.voiceGender) + 1) % order.length];
    Store.state.voiceGender = next;
    Store.save();
    syncTopBar();
    Voice.speak("你好，歡迎學繁體中文！", next);
  }

  function setVoiceOption(gender, rate) {
    Voice.playEffect("pop");
    if (gender) Store.state.voiceGender = gender;
    if (rate) Store.state.voiceRate = rate;
    Store.save();
    syncTopBar();
    renderScopeModal();
  }

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    if (ui.currentStep === "vocab" && ui.vocabSubMode === "writing") {
      drawWritingCanvasBase();
    }
  }

  function dismissComebackStrip() {
    Store.state.comebackDismissed = true;
    syncTopBar();
  }

  function refreshAll() {
    ui.vocabIdx = 0;
    ui.sentIdx = 0;
    ui.speakIdx = 0;
    ui.detectiveIdx = 0;
    syncTopBar();
    renderCurrentStep();
  }

  function renderCurrentStep() {
    if (ui.currentStep === "vocab") renderVocabStep();
    else if (ui.currentStep === "sentence") renderSentenceStep();
    else if (ui.currentStep === "speak") renderSpeakStep();
    else if (ui.currentStep === "test") renderTestStep();
  }

  function highlightQueryInHanzi(sentenceZh, query) {
    if (!query || !sentenceZh) return sentenceZh || "";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return sentenceZh.replace(
      new RegExp(escaped, "g"),
      `<span style="color:var(--primary);text-decoration:underline;text-underline-offset:4px;">${query}</span>`
    );
  }

  function setCardExampleFilter(filterVal, queryOverride) {
    Voice.playEffect("pop");
    ui.exampleFilter = filterVal;
    if (queryOverride !== undefined) {
      ui.exampleQueryOverride = queryOverride;
    }
    const list = Store.getVocab();
    const item = list[ui.vocabIdx];
    if (item) renderCardExamplesBox(item);
  }

  function renderCardExamplesBox(item) {
    const targetQuery = ui.exampleQueryOverride || item.hz;
    const data = DB.getThreeExamplesFor(targetQuery);
    const chars = Array.from(item.hz);

    // Render character selector pills if the word has >= 2 chars
    const charSelectorEl = el("vc-ex-char-selector");
    if (charSelectorEl) {
      let pillsHtml = `<button onclick="App.setCardExampleFilter('${ui.exampleFilter}', '')" class="tag ${
        targetQuery === item.hz ? "tag-primary" : ""
      }">Từ 『${item.hz}』</button>`;
      if (chars.length > 1) {
        pillsHtml += chars
          .map(
            (c) =>
              `<button onclick="App.setCardExampleFilter('${ui.exampleFilter}', '${c}')" class="tag ${
                targetQuery === c ? "tag-primary" : ""
              }">Chữ 『${c}』</button>`
          )
          .join("");
      }
      pillsHtml += `<button onclick="App.openExamplesModal('${targetQuery}')" class="tag tag-amber" title="Mở bảng tra cứu chi tiết 3 ví dụ & từ ghép">🔍 Mở rộng</button>`;
      charSelectorEl.innerHTML = pillsHtml;
    }

    // Update filter tabs ("Cả 3 ví dụ" | "VD 1" | "VD 2" | "VD 3")
    ["all", 0, 1, 2].forEach((k) => {
      const btn = el("vc-ex-tab-" + k);
      if (btn) btn.classList.toggle("active", String(ui.exampleFilter) === String(k));
    });

    const listWrap = el("vc-examples-list");
    if (!listWrap) return;

    const toRender =
      ui.exampleFilter === "all"
        ? data.examples
        : [data.examples[Number(ui.exampleFilter)] || data.examples[0]];

    listWrap.innerHTML = toRender
      .map((ex, idx) => {
        const safeZh = (ex.zh || "").replace(/'/g, "\\'");
        const safePy = (ex.py || "").replace(/'/g, "\\'");
        const safeVi = (ex.vi || "").replace(/'/g, "\\'");
        return `
        <div style="padding:10px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:800;color:var(--text-muted);">${ex.level}</span>
            <div style="display:flex;align-items:center;gap:6px;">
              <button onclick="VoiceService.speak('${safeZh}')" class="tag tag-primary" title="Nghe câu ví dụ này">🔊 Nghe</button>
              <button onclick="App.practiceExampleInSpeak('${safeZh}', '${safePy}', '${safeVi}', 'Ví dụ với 『${targetQuery}』')" class="tag" title="Chuyển sang Bước 3 để thu âm & chấm phát âm câu ví dụ này">🎙️ Tập nói</button>
            </div>
          </div>
          <div class="hanzi" style="font-size:18px;font-weight:900;margin-top:2px;">${highlightQueryInHanzi(
            ex.zh,
            targetQuery
          )}</div>
          <div style="font-size:13px;color:var(--primary);font-weight:700;">${ex.py}</div>
          <div style="font-size:13px;color:var(--text-secondary);">${ex.vi}</div>
        </div>`;
      })
      .join("");
  }

  function openExamplesModal(queryStr) {
    Voice.playEffect("pop");
    const list = Store.getVocab();
    const curItem = list[ui.vocabIdx] || DB.VOCAB_DB[0];
    const q = DB.toTraditional((queryStr || curItem.hz).trim());
    const data = DB.getThreeExamplesFor(q);
    Voice.speak(q);

    if (el("exm-query-hanzi")) el("exm-query-hanzi").textContent = q;
    const py =
      DB.CHAR_PINYIN_MAP[q] ||
      (DB.VOCAB_DB.find((v) => v.hz === q)?.py) ||
      Array.from(q).map((c) => DB.CHAR_PINYIN_MAP[c] || "").join(" ");
    if (el("exm-query-sub")) {
      const matchedWord = DB.VOCAB_DB.find((v) => v.hz === q);
      el("exm-query-sub").textContent = matchedWord
        ? `${matchedWord.py} • [${matchedWord.hv || ""}] • ${matchedWord.vi}`
        : `Phiên âm: ${py || "zh-TW"} • Bấm vào từng chữ hoặc từ ghép bên dưới để đổi từ tra cứu`;
    }

    const etyNotes = DB.getWordEtymology(q);
    if (el("exm-etymology")) {
      el("exm-etymology").innerHTML = etyNotes.map((n) => `<div>• ${n}</div>`).join("");
    }

    const compWrap = el("exm-compounds");
    if (compWrap) {
      if (data.compounds.length > 0) {
        compWrap.innerHTML = data.compounds
          .map(
            (c) => `
          <button onclick="App.openExamplesModal('${c.hz}')" class="pill-btn ${
              c.hz === q ? "pill-primary" : ""
            }">
            <span class="hanzi" style="font-weight:900;font-size:15px;">${c.hz}</span>
            <span style="color:var(--primary);">${c.py}</span>
            <span>(${c.vi})</span>
          </button>`
          )
          .join("");
      } else {
        compWrap.innerHTML = `<span style="font-size:13px;color:var(--text-muted);">Chữ độc lập trong bài học</span>`;
      }
    }

    const exListEl = el("exm-examples-list");
    if (exListEl) {
      exListEl.innerHTML = data.examples
        .map((ex) => {
          const safeZh = (ex.zh || "").replace(/'/g, "\\'");
          const safePy = (ex.py || "").replace(/'/g, "\\'");
          const safeVi = (ex.vi || "").replace(/'/g, "\\'");
          return `
          <div class="card-compact" style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span class="tag tag-primary">${ex.level}</span>
              <div style="display:flex;gap:8px;">
                <button onclick="VoiceService.speak('${safeZh}', 'female')" class="btn btn-sm btn-outline">👩 Nữ đọc</button>
                <button onclick="VoiceService.speak('${safeZh}', 'male')" class="btn btn-sm btn-outline">👨 Nam đọc</button>
                <button onclick="App.closeExamplesModal(); App.practiceExampleInSpeak('${safeZh}', '${safePy}', '${safeVi}', 'Ví dụ với 『${q}』')" class="btn btn-sm btn-primary">🎙️ Luyện nói câu này</button>
              </div>
            </div>
            <div class="hanzi" style="font-size:22px;font-weight:900;">${highlightQueryInHanzi(
              ex.zh,
              q
            )}</div>
            <div style="font-size:14px;color:var(--primary);font-weight:700;">${ex.py}</div>
            <div style="font-size:14px;color:var(--text-secondary);">${ex.vi}</div>
          </div>`;
        })
        .join("");
    }

    el("modal-examples")?.classList.remove("hidden");
  }

  function closeExamplesModal() {
    el("modal-examples")?.classList.add("hidden");
  }

  function practiceExampleInSpeak(zh, py, vi, tag) {
    ui.customSpeakItem = {
      lesson: 1,
      part: 1,
      tag: tag || "Câu ví dụ mở rộng",
      zh,
      py,
      vi,
      tip: `Đọc rõ từng chữ Hán trong câu ví dụ 『${zh}』 và giữ đúng thanh điệu.`
    };
    setStep("speak");
  }

  // ==========================================================================
  // STEP 1: 詞彙 Từ vựng, Chiết tự, Tập viết 米字格 & Ngữ pháp
  // ==========================================================================
  function setVocabSubMode(mode) {
    Voice.playEffect("pop");
    stopAutoPlayVocab();
    ui.vocabSubMode = mode;
    ["flashcard", "writing", "grammar"].forEach((m) => {
      el("vsub-" + m)?.classList.toggle("active", m === mode);
      el("vocab-" + m + "-view")?.classList.toggle("hidden", m !== mode);
    });
    renderVocabStep();
  }

  function setVocabFilter(mode) {
    Voice.playEffect("pop");
    Store.state.vocabFilterMode = mode;
    ui.vocabIdx = 0;
    ["all", "unmastered", "hard"].forEach((m) => {
      el("vfilter-" + m)?.classList.toggle("active", m === mode);
    });
    renderVocabStep();
  }

  function handleVocabSearch(query) {
    Store.state.searchQuery = query || "";
    ui.vocabIdx = 0;
    renderVocabStep();
  }

  function rateCurrentVocab(level) {
    const list = Store.getVocab();
    const item = list[ui.vocabIdx];
    if (!item) return;
    Store.setWordMastery(item.id, level);
    Store.state.stats.vocabReviewed++;
    if (Store.state.stats.vocabReviewed >= 2) Store.completeComebackTask("t1");
    if (level === "easy") Voice.playEffect("win");
    else Voice.playEffect("pop");
    syncTopBar();
    renderVocabStep();
    // Auto-advance after rating
    setTimeout(() => stepVocab(1), 260);
  }

  function toggleCurrentBookmark() {
    const item = Store.getVocab()[ui.vocabIdx];
    if (!item) return;
    Voice.playEffect("pop");
    Store.toggleBookmark(item.id);
    renderVocabStep();
  }

  function toggleAutoPlayVocab() {
    if (ui.autoPlayTimer) {
      stopAutoPlayVocab();
      return;
    }
    Voice.playEffect("pop");
    const btn = el("vc-autoplay-btn");
    if (btn) {
      btn.classList.add("btn-primary");
      btn.classList.remove("btn-subtle");
      btn.textContent = "⏹️ Dừng nghe tự động";
    }
    runAutoPlayCycle();
  }

  function runAutoPlayCycle() {
    const item = Store.getVocab()[ui.vocabIdx];
    if (!item) return;
    Voice.speak(item.hz, Store.state.voiceGender, undefined, () => {
      ui.autoPlayTimer = setTimeout(() => {
        if (!ui.autoPlayTimer) return;
        const list = Store.getVocab();
        ui.vocabIdx = (ui.vocabIdx + 1) % list.length;
        renderVocabStep();
        runAutoPlayCycle();
      }, 1700);
    });
  }

  function stopAutoPlayVocab() {
    if (ui.autoPlayTimer) {
      clearTimeout(ui.autoPlayTimer);
      ui.autoPlayTimer = null;
    }
    const btn = el("vc-autoplay-btn");
    if (btn) {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-subtle");
      btn.textContent = "🎧 Nghe tự động";
    }
  }

  function renderVocabStep() {
    const list = Store.getVocab();
    if (!list.length) return;
    if (ui.vocabIdx >= list.length) ui.vocabIdx = 0;
    if (ui.vocabIdx < 0) ui.vocabIdx = list.length - 1;
    const item = list[ui.vocabIdx];
    const counts = Store.getMasteryCounts();

    if (el("vfilter-all")) el("vfilter-all").textContent = `Tất cả (${counts.total})`;
    if (el("vfilter-unmastered")) el("vfilter-unmastered").textContent = `Chưa thuộc (${counts.unmastered})`;
    if (el("vfilter-hard")) el("vfilter-hard").textContent = `Từ khó ⭐ (${counts.hard})`;

    if (ui.vocabSubMode === "flashcard") {
      if (el("vc-tag")) el("vc-tag").textContent = `Bài ${item.lesson} • Phần ${item.part} • ${item.pos}`;
      if (el("vc-counter")) el("vc-counter").textContent = `${ui.vocabIdx + 1} / ${list.length}`;
      if (el("vc-scene")) el("vc-scene").innerHTML = DB.SCENE_SVGS[item.scene] || DB.SCENE_SVGS.greeting;
      if (el("vc-hanzi")) {
        el("vc-hanzi").innerHTML = Array.from(item.hz)
          .map(
            (ch) =>
              `<span onclick="App.openExamplesModal('${ch}')" class="speak-char" title="Bấm vào chữ 『${ch}』 để xem 3 câu ví dụ sử dụng chữ này">${ch}</span>`
          )
          .join("");
      }
      if (el("vc-pinyin")) el("vc-pinyin").textContent = item.py;
      if (el("vc-hv")) el("vc-hv").textContent = `Âm Hán-Việt: ${item.hv || "—"}`;
      if (el("vc-meaning")) el("vc-meaning").textContent = item.vi;
      renderCardExamplesBox(item);

      const etyNotes = DB.getWordEtymology(item.hz);
      if (el("vc-etymology")) {
        el("vc-etymology").innerHTML =
          `<div style="font-weight:800;color:var(--primary-text);margin-bottom:4px;">🧩 Chiết tự Bộ thủ &amp; Mẹo nhớ mặt chữ Phồn thể:</div>` +
          etyNotes.map((n) => `<div>• ${n}</div>`).join("");
      }

      const mastery = Store.state.wordMastery[item.id] || "";
      el("srs-btn-hard")?.classList.toggle("active-hard", mastery === "hard");
      el("srs-btn-good")?.classList.toggle("active-good", mastery === "good");
      el("srs-btn-easy")?.classList.toggle("active-easy", mastery === "easy");

      const bmBtn = el("vc-bookmark-btn");
      if (bmBtn) {
        const isBm = Store.state.bookmarkedIds.has(item.id);
        bmBtn.textContent = isBm ? "⭐ Đã lưu từ khó" : "☆ Lưu từ khó";
        bmBtn.className = isBm ? "tag tag-amber" : "tag";
      }

      const listEl = el("vc-side-list");
      if (listEl) {
        listEl.innerHTML = list
          .map((w, idx) => {
            const m = Store.state.wordMastery[w.id];
            const badge = m === "easy" ? "✅" : m === "hard" || Store.state.bookmarkedIds.has(w.id) ? "⭐" : "";
            return `
            <button onclick="App.selectVocab(${idx})" class="vocab-row ${idx === ui.vocabIdx ? "active" : ""}">
              <div>
                <span class="hanzi" style="font-size:18px;font-weight:800;">${w.hz}</span>
                <span style="font-size:13px;color:var(--primary);font-weight:700;margin-left:6px;">${w.py}</span>
                <span style="font-size:12px;color:var(--amber);font-weight:700;margin-left:6px;">[${w.hv || ""}]</span>
                <div style="font-size:13px;color:var(--text-secondary);">${w.vi}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span onclick="event.stopPropagation(); App.openExamplesModal('${w.hz}')" class="tag tag-primary" title="Xem 3 câu ví dụ với từ ${w.hz}">📖 3 ví dụ</span>
                <span class="tag">${badge} B.${w.lesson}.${w.part}</span>
              </div>
            </button>`;
          })
          .join("");
      }
    } else if (ui.vocabSubMode === "writing") {
      renderWritingPad(item);
    } else {
      const grammars = Store.getGrammar();
      const gWrap = el("grammar-list-container");
      if (gWrap) {
        gWrap.innerHTML = grammars
          .map(
            (g) => `
          <div class="card-compact" style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span class="tag tag-primary">Bài ${g.lesson} • Phần ${g.part}</span>
              <button onclick="VoiceService.speak('${g.exZh}')" class="btn btn-sm btn-outline">🔊 Nghe câu mẫu</button>
            </div>
            <h3 style="font-size:16px;font-weight:800;">${g.title}</h3>
            <div style="padding:8px 12px;border-radius:8px;background:var(--primary-soft);color:var(--primary-text);font-weight:700;font-size:13px;">
              📐 Công thức: ${g.formula}
            </div>
            <p style="font-size:13px;color:var(--text-secondary);">${g.note}</p>
            <div style="padding-top:6px;border-top:1px solid var(--border);font-size:14px;">
              <div class="hanzi" style="font-weight:800;font-size:17px;">${g.exZh}</div>
              <div style="font-size:13px;color:var(--text-secondary);">${g.exVi}</div>
            </div>
          </div>`
          )
          .join("");
      }
    }
  }

  // ==========================================================================
  // STEP 1B: Interactive 米字格 (MiZiGe) Traditional Hanzi Writing Pad
  // ==========================================================================
  function renderWritingPad(item) {
    const chars = Array.from(item.hz || "");
    if (ui.writeCharIdx >= chars.length) ui.writeCharIdx = 0;
    const targetChar = chars[ui.writeCharIdx] || chars[0];
    const py = DB.CHAR_PINYIN_MAP[targetChar] || item.py;
    const radicalNote =
      DB.CHAR_RADICAL_NOTES[targetChar] ||
      `Chữ 『${targetChar}』 trong từ 『${item.hz}』 (${item.vi}). Quy tắc bút thuận: ngang trước sổ sau, trên trước dưới sau, trái trước phải sau.`;

    if (el("wp-word-title")) {
      el("wp-word-title").textContent = `${item.hz} (${item.py}) — ${item.vi} [${item.hv || ""}]`;
    }
    if (el("wp-char-tabs")) {
      el("wp-char-tabs").innerHTML = chars
        .map(
          (c, idx) => `
        <button onclick="App.selectWritingChar(${idx})" class="btn btn-sm ${
            idx === ui.writeCharIdx ? "btn-primary" : "btn-outline"
          } hanzi" style="font-size:18px;font-weight:900;">
          ${c}
        </button>`
        )
        .join("");
    }
    if (el("wp-char-note")) {
      el("wp-char-note").textContent = `✍️ Đang luyện viết chữ 『${targetChar}』 (${py}): ${radicalNote}`;
    }
    if (el("wp-feedback")) {
      el("wp-feedback").textContent = "Dùng chuột hoặc ngón tay viết theo nét chữ mờ trong ô Mễ Tự Cách.";
    }
    ui.writeStrokeCount = 0;
    initWritingCanvasEvents();
    drawWritingCanvasBase();
  }

  function selectWritingChar(idx) {
    Voice.playEffect("pop");
    ui.writeCharIdx = idx;
    const item = Store.getVocab()[ui.vocabIdx];
    if (item) {
      const ch = Array.from(item.hz)[idx];
      if (ch) Voice.speak(ch);
      renderWritingPad(item);
    }
  }

  function toggleWritingGuide() {
    Voice.playEffect("pop");
    ui.writeShowGuide = !ui.writeShowGuide;
    if (el("wp-guide-btn")) {
      el("wp-guide-btn").textContent = ui.writeShowGuide ? "👁️ Ẩn chữ mẫu" : "👁️ Hiện chữ mẫu";
    }
    drawWritingCanvasBase();
  }

  function clearWritingCanvas() {
    Voice.playEffect("pop");
    ui.writeStrokeCount = 0;
    drawWritingCanvasBase();
    if (el("wp-feedback")) {
      el("wp-feedback").textContent = "Đã xóa bảng — mời bạn viết lại từng nét.";
    }
  }

  function drawWritingCanvasBase() {
    const canvas = el("wp-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw MiZiGe (米字格) guide lines
    ctx.save();
    ctx.strokeStyle = "rgba(210, 75, 55, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
    ctx.restore();

    // Draw watermark Traditional character guide if enabled
    if (ui.writeShowGuide) {
      const item = Store.getVocab()[ui.vocabIdx];
      const chars = Array.from(item ? item.hz : "請");
      const ch = chars[ui.writeCharIdx] || chars[0];
      ctx.save();
      ctx.font = `900 168px "Noto Sans TC", "PingFang TC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(160, 165, 175, 0.26)";
      ctx.fillText(ch, w / 2, h / 2 + 6);
      ctx.restore();
    }
  }

  function initWritingCanvasEvents() {
    const canvas = el("wp-canvas");
    if (!canvas || canvas.dataset.bound === "1") return;
    canvas.dataset.bound = "1";

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
      };
    }

    function startDraw(e) {
      e.preventDefault();
      ui.writeIsDrawing = true;
      ui.writeStrokeCount++;
      ui.writeLastPt = getPos(e);
    }

    function moveDraw(e) {
      if (!ui.writeIsDrawing) return;
      e.preventDefault();
      const pt = getPos(e);
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.strokeStyle = "#d13b28";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(ui.writeLastPt.x, ui.writeLastPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
      ui.writeLastPt = pt;
    }

    function endDraw() {
      if (!ui.writeIsDrawing) return;
      ui.writeIsDrawing = false;
      if (el("wp-feedback")) {
        el("wp-feedback").textContent = `Đã viết ${ui.writeStrokeCount} nét — bấm "Chấm nét chữ" để kiểm tra độ khớp.`;
      }
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw);
  }

  function gradeWritingCanvas() {
    const item = Store.getVocab()[ui.vocabIdx];
    if (!item) return;
    const chars = Array.from(item.hz);
    const ch = chars[ui.writeCharIdx] || chars[0];
    if (ui.writeStrokeCount < 2) {
      Voice.playEffect("wrong");
      if (el("wp-feedback")) {
        el("wp-feedback").textContent = `⚠️ Bạn mới viết ${ui.writeStrokeCount} nét. Hãy viết đầy đủ chữ 『${ch}』 rồi bấm chấm nhé!`;
      }
      return;
    }
    Voice.playEffect("win");
    Voice.speak(ch);
    Store.state.stats.vocabReviewed++;
    Store.completeComebackTask("t1");
    syncTopBar();
    const score = Math.min(99, 78 + Math.min(20, ui.writeStrokeCount * 3));
    if (el("wp-feedback")) {
      el("wp-feedback").innerHTML = `<strong style="color:var(--jade);">✅ Tuyệt vời! Chữ 『${ch}』 (${ui.writeStrokeCount} nét) đạt độ cân đối ${score}% trên ô Mễ Tự Cách!</strong>`;
    }
  }

  function selectVocab(idx) {
    ui.vocabIdx = idx;
    ui.writeCharIdx = 0;
    ui.exampleQueryOverride = "";
    Store.state.stats.vocabReviewed++;
    if (Store.state.stats.vocabReviewed >= 2) Store.completeComebackTask("t1");
    syncTopBar();
    renderVocabStep();
    const item = Store.getVocab()[ui.vocabIdx];
    if (item) Voice.speak(item.hz);
  }

  function stepVocab(delta) {
    const list = Store.getVocab();
    if (!list.length) return;
    ui.vocabIdx = (ui.vocabIdx + delta + list.length) % list.length;
    selectVocab(ui.vocabIdx);
  }

  function speakCurrentVocab(gender, slow) {
    const item = Store.getVocab()[ui.vocabIdx];
    if (!item) return;
    Voice.speak(item.hz, gender, slow ? 0.72 : undefined);
  }

  function speakCurrentVocabExample() {
    const item = Store.getVocab()[ui.vocabIdx];
    if (!item) return;
    Voice.speak(item.exZh);
  }

  function practiceSpeakCurrentVocab() {
    ui.speakSubMode = "word";
    ui.speakIdx = ui.vocabIdx;
    setStep("speak");
  }

  // ==========================================================================
  // STEP 2: 造句 Đặt câu (V2Z), Đọc dịch (Z2V) & Nghe chép chính tả (Dictation)
  // ==========================================================================
  function setSentenceSubMode(mode) {
    Voice.playEffect("pop");
    ui.sentSubMode = mode;
    ["v2z", "z2v", "dictation"].forEach((m) => {
      el("ssub-" + m)?.classList.toggle("active", m === mode);
    });
    el("sent-v2z-view")?.classList.toggle("hidden", mode === "z2v");
    el("sent-z2v-view")?.classList.toggle("hidden", mode !== "z2v");
    prepareSentenceQuestion();
  }

  function renderSentenceStep() {
    ["v2z", "z2v", "dictation"].forEach((m) => {
      el("ssub-" + m)?.classList.toggle("active", m === ui.sentSubMode);
    });
    el("sent-v2z-view")?.classList.toggle("hidden", ui.sentSubMode === "z2v");
    el("sent-z2v-view")?.classList.toggle("hidden", ui.sentSubMode !== "z2v");
    prepareSentenceQuestion();
  }

  function prepareSentenceQuestion() {
    const list = Store.getSentences();
    if (!list.length) return;
    if (ui.sentIdx >= list.length) ui.sentIdx = 0;
    if (ui.sentIdx < 0) ui.sentIdx = list.length - 1;
    const item = list[ui.sentIdx];

    if (el("sent-tag")) el("sent-tag").textContent = item.tag;
    if (el("sent-counter")) el("sent-counter").textContent = `Câu ${ui.sentIdx + 1} / ${list.length}`;

    if (ui.sentSubMode === "v2z" || ui.sentSubMode === "dictation") {
      const isDict = ui.sentSubMode === "dictation";
      ui.dictRevealed = false;
      if (el("v2z-mode-label")) {
        el("v2z-mode-label").textContent = isDict
          ? "🎧 CHẾ ĐỘ NGHE & CHÉP CHÍNH TẢ (Bấm nghe câu tiếng Trung rồi ghép các thẻ từ bạn nghe được)"
          : "HÃY DỊCH CÂU TIẾNG VIỆT SAU SANG TIẾNG TRUNG PHỒN THỂ";
      }
      if (el("v2z-vi-prompt")) {
        el("v2z-vi-prompt").innerHTML = isDict
          ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <button onclick="App.speakCurrentSentence('female', false)" class="btn btn-primary">🔊 Nghe câu đọc mẫu (Nữ)</button>
              <button onclick="App.speakCurrentSentence('male', false)" class="btn btn-outline">👨 Nghe giọng Nam</button>
              <button onclick="App.speakCurrentSentence(null, true)" class="btn btn-subtle">🐢 Nghe chậm (0.72x)</button>
              <span style="font-size:14px;color:var(--text-secondary);">Nghĩa gợi ý: "${item.vi}"</span>
            </div>`
          : item.vi;
      }
      if (el("v2z-hint")) el("v2z-hint").textContent = `💡 ${item.hint}`;
      ui.v2zPicked = [];
      ui.v2zShuffled = shuffle(item.tiles);
      if (el("v2z-manual-input")) el("v2z-manual-input").value = "";
      if (el("v2z-feedback")) el("v2z-feedback").classList.add("hidden");
      renderV2ZTiles();
      if (isDict) Voice.speak(item.zh);
    } else {
      if (el("z2v-pinyin")) el("z2v-pinyin").textContent = item.py;
      if (el("z2v-feedback")) el("z2v-feedback").classList.add("hidden");
      const glossWrap = el("z2v-gloss-segments");
      if (glossWrap) {
        glossWrap.innerHTML = item.gloss
          .map(
            (g) => `
          <button onclick="VoiceService.speak('${g.w}')" class="card-compact" style="padding:10px 14px;text-align:center;" title="Bấm để nghe cụm từ">
            <div class="hanzi" style="font-size:24px;font-weight:900;">${g.w}</div>
            <div style="font-size:12px;color:var(--primary);font-weight:700;">${g.py}</div>
            <div style="font-size:12px;color:var(--text-muted);">${g.vi}</div>
          </button>`
          )
          .join("");
      }

      const pool = DB.SENTENCES_DB.filter((s) => s.id !== item.id).map((s) => s.vi);
      ui.z2vOptions = shuffle([item.vi, ...shuffle(pool).slice(0, 3)]);
      const optWrap = el("z2v-options");
      if (optWrap) {
        optWrap.innerHTML = ui.z2vOptions
          .map(
            (opt, idx) => `
          <button onclick="App.checkZ2VChoice(${idx})" class="vocab-row" style="padding:13px 16px;font-weight:600;">
            <span>${idx + 1}. ${opt}</span>
          </button>`
          )
          .join("");
      }
    }
  }

  function giveV2ZNextTileHint() {
    const item = Store.getSentences()[ui.sentIdx];
    if (!item) return;
    // Determine the next expected tile index from item.tiles
    const nextPos = ui.v2zPicked.length;
    if (nextPos >= item.tiles.length) return;
    const expectedWord = item.tiles[nextPos];
    const targetShuffledIdx = ui.v2zShuffled.findIndex(
      (w, idx) => w === expectedWord && !ui.v2zPicked.includes(idx)
    );
    if (targetShuffledIdx >= 0) {
      pickV2ZTile(targetShuffledIdx);
    } else {
      // If user had a wrong prefix, reset to correct prefix + 1
      ui.v2zPicked = [];
      for (let i = 0; i <= nextPos && i < item.tiles.length; i++) {
        const w = item.tiles[i];
        const sIdx = ui.v2zShuffled.findIndex(
          (cand, idx) => cand === w && !ui.v2zPicked.includes(idx)
        );
        if (sIdx >= 0) ui.v2zPicked.push(sIdx);
      }
      Voice.speak(expectedWord);
      renderV2ZTiles();
    }
  }

  function renderV2ZTiles() {
    const well = el("v2z-answer-well");
    const bank = el("v2z-tile-bank");
    if (!well || !bank) return;

    well.classList.toggle("filled", ui.v2zPicked.length > 0);
    if (ui.v2zPicked.length === 0) {
      well.innerHTML = `<span style="font-size:13px;color:var(--text-muted);">Chạm vào các thẻ từ Phồn thể bên dưới (hoặc bấm "💡 Gợi ý từ tiếp") để ghép câu...</span>`;
    } else {
      well.innerHTML = ui.v2zPicked
        .map(
          (tileIdx, pos) => `
        <button onclick="App.removeV2ZTile(${pos})" class="word-tile tile-picked hanzi">
          ${ui.v2zShuffled[tileIdx]}
        </button>`
        )
        .join("");
    }

    bank.innerHTML = ui.v2zShuffled
      .map((word, idx) => {
        const used = ui.v2zPicked.includes(idx);
        return `
        <button onclick="App.pickV2ZTile(${idx})" ${used ? "disabled" : ""} class="word-tile hanzi">
          ${word}
        </button>`;
      })
      .join("");
  }

  function pickV2ZTile(idx) {
    if (ui.v2zPicked.includes(idx)) return;
    const word = ui.v2zShuffled[idx];
    if (!/[，。？！]/.test(word)) Voice.speak(word);
    else Voice.playEffect("pop");
    ui.v2zPicked.push(idx);
    renderV2ZTiles();
    if (ui.v2zPicked.length === ui.v2zShuffled.length) {
      checkV2ZAnswer();
    }
  }

  function removeV2ZTile(pos) {
    Voice.playEffect("pop");
    ui.v2zPicked.splice(pos, 1);
    renderV2ZTiles();
  }

  function resetV2Z() {
    Voice.playEffect("pop");
    ui.v2zPicked = [];
    if (el("v2z-manual-input")) el("v2z-manual-input").value = "";
    if (el("v2z-feedback")) el("v2z-feedback").classList.add("hidden");
    renderV2ZTiles();
  }

  function checkV2ZAnswer() {
    const list = Store.getSentences();
    const item = list[ui.sentIdx];
    if (!item) return;

    const typed = (el("v2z-manual-input")?.value || "").trim();
    const built = typed || ui.v2zPicked.map((i) => ui.v2zShuffled[i]).join("");
    const cleanBuilt = Speech.cleanHanzi(built);
    const cleanTarget = Speech.cleanHanzi(item.zh);

    const fb = el("v2z-feedback");
    if (!fb) return;
    fb.classList.remove("hidden");

    if (cleanBuilt && cleanBuilt === cleanTarget) {
      Voice.playEffect("win");
      Voice.speak(item.zh);
      Store.state.stats.sentencesDone++;
      Store.completeComebackTask("t2");
      syncTopBar();
      fb.style.background = "var(--jade-soft)";
      fb.style.borderColor = "var(--jade-border)";
      fb.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;color:var(--jade);">✅ Chính xác! Bạn đã hoàn thành câu chuẩn Phồn thể:</div>
            <div class="hanzi" style="font-size:20px;font-weight:900;margin-top:4px;">${item.zh}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${item.py} — "${item.vi}"</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="App.jumpToSpeakSentence()" class="btn btn-sm btn-outline">🎙️ Luyện nói câu này</button>
            <button onclick="App.stepSentence(1)" class="btn btn-sm btn-jade">Câu tiếp theo ➔</button>
          </div>
        </div>`;
    } else {
      Voice.playEffect("wrong");
      fb.style.background = "var(--primary-soft)";
      fb.style.borderColor = "var(--primary)";
      fb.innerHTML = `
        <div style="font-weight:800;color:var(--primary-text);">⚠️ Chưa khớp hoàn toàn. Hãy thử bấm "💡 Gợi ý từ tiếp":</div>
        <div style="font-size:13px;margin-top:4px;">Câu của bạn: <b class="hanzi">${DB.toTraditional(built) || "(chưa chọn)"}</b></div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Gợi ý: ${item.hint}</div>`;
    }
  }

  function checkZ2VChoice(optIdx) {
    const list = Store.getSentences();
    const item = list[ui.sentIdx];
    if (!item) return;
    const chosen = ui.z2vOptions[optIdx];
    const fb = el("z2v-feedback");
    if (!fb) return;
    fb.classList.remove("hidden");

    if (chosen === item.vi) {
      Voice.playEffect("win");
      Voice.speak(item.zh);
      Store.state.stats.sentencesDone++;
      Store.completeComebackTask("t2");
      syncTopBar();
      fb.style.background = "var(--jade-soft)";
      fb.style.borderColor = "var(--jade-border)";
      fb.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;color:var(--jade);">✅ Dịch chính xác!</div>
            <div style="font-size:14px;margin-top:2px;">"${item.vi}"</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="App.jumpToSpeakSentence()" class="btn btn-sm btn-outline">🎙️ Luyện nói câu này</button>
            <button onclick="App.stepSentence(1)" class="btn btn-sm btn-jade">Câu tiếp theo ➔</button>
          </div>
        </div>`;
    } else {
      Voice.playEffect("wrong");
      fb.style.background = "var(--primary-soft)";
      fb.style.borderColor = "var(--primary)";
      fb.innerHTML = `<div style="font-weight:800;color:var(--primary-text);">❌ Chưa đúng. Hãy chạm vào từng cụm chữ Hán ở trên để xem nghĩa rồi chọn lại nhé!</div>`;
    }
  }

  function stepSentence(delta) {
    const list = Store.getSentences();
    if (!list.length) return;
    Voice.playEffect("pop");
    ui.sentIdx = (ui.sentIdx + delta + list.length) % list.length;
    prepareSentenceQuestion();
  }

  function speakCurrentSentence(gender, slow) {
    const item = Store.getSentences()[ui.sentIdx];
    if (!item) return;
    Voice.speak(item.zh, gender, slow ? 0.72 : undefined);
  }

  function jumpToSpeakSentence() {
    ui.speakSubMode = "sentence";
    ui.speakIdx = ui.sentIdx;
    setStep("speak");
  }

  // ==========================================================================
  // STEP 3: 口說 Phòng Luyện Nói, Biểu Đồ Thanh Điệu, Biến Điệu & Shadowing
  // ==========================================================================
  function getSpeakItems() {
    if (ui.customSpeakItem) {
      return [ui.customSpeakItem, ...Store.getSentences().map((s) => ({ lesson: s.lesson, part: s.part, tag: s.tag, zh: s.zh, py: s.py, vi: s.vi, tip: s.hint }))];
    }
    if (ui.speakSubMode === "word") {
      return Store.getVocab().map((w) => ({
        lesson: w.lesson,
        part: w.part,
        tag: `Bài ${w.lesson} (P.${w.part}) • Từ vựng [${w.hv || ""}]`,
        zh: w.hz,
        py: w.py,
        vi: `${w.vi} — Ví dụ: ${w.exZh}`,
        tip: `Chú ý giữ đúng thanh điệu của 『${w.hz}』(${w.py}) và phát âm rõ khẩu hình.`
      }));
    }
    if (ui.speakSubMode === "roleplay") {
      return Store.getRoleplay().map((r) => ({
        lesson: r.lesson,
        part: r.part,
        tag: `Bài ${r.lesson} (P.${r.part}) • Hội thoại nhập vai`,
        speaker: r.speaker,
        questionZh: r.questionZh,
        questionPy: r.questionPy,
        questionVi: r.questionVi,
        zh: r.zh,
        py: r.py,
        vi: r.vi,
        tip: r.tip
      }));
    }
    return Store.getSentences().map((s) => ({
      lesson: s.lesson,
      part: s.part,
      tag: s.tag,
      zh: s.zh,
      py: s.py,
      vi: s.vi,
      tip: s.hint
    }));
  }

  function setSpeakSubMode(mode) {
    Voice.playEffect("pop");
    if (Speech.getIsRecording()) Speech.stopRecording(false);
    ui.customSpeakItem = null;
    ui.speakSubMode = mode;
    ui.speakIdx = 0;
    ["sentence", "word", "roleplay"].forEach((m) => {
      el("spk-sub-" + m)?.classList.toggle("active", m === mode);
    });
    renderSpeakStep();
  }

  function renderSpeakTargetChars(zhText, activeCharIdx = -1) {
    const wrap = el("spk-target-zh");
    if (!wrap) return;
    let cleanCounter = 0;
    wrap.innerHTML = Array.from(zhText || "")
      .map((ch) => {
        if (/[，。？！、\s]/.test(ch)) {
          return `<span style="opacity:0.55;">${ch}</span>`;
        }
        const idx = cleanCounter++;
        const cls =
          idx === activeCharIdx
            ? "speak-char char-active"
            : activeCharIdx >= 0 && idx < activeCharIdx
            ? "speak-char char-done"
            : "speak-char";
        return `<span onclick="VoiceService.speak('${ch}')" title="Bấm để nghe chữ ${ch}" class="${cls}">${ch}</span>`;
      })
      .join("");
  }

  function renderToneContourAndSandhi(zhText) {
    const analysis = DB.analyzeSentenceTones(zhText);
    const contourWrap = el("spk-tone-contours");
    const sandhiBox = el("spk-sandhi-alerts");

    if (contourWrap) {
      contourWrap.innerHTML = analysis.items
        .map(
          (it) => `
        <button onclick="VoiceService.speak('${it.ch}')" class="tone-chip ${
            it.sandhiRule ? "sandhi-changed" : ""
          }" title="${it.sandhiRule || "Bấm để nghe riêng chữ " + it.ch}">
          <span class="hanzi" style="font-size:16px;font-weight:900;">${it.ch}</span>
          <span style="font-size:12px;color:var(--primary);font-weight:700;">${it.py || "—"}</span>
          <span style="font-size:12px;color:var(--text-secondary);font-weight:600;">${
            TONE_CONTOUR_LABELS[it.spokenTone] || "T0 ·"
          }</span>
        </button>`
        )
        .join("");
    }

    if (sandhiBox) {
      if (analysis.sandhiAlerts.length > 0) {
        sandhiBox.classList.remove("hidden");
        sandhiBox.innerHTML = analysis.sandhiAlerts.map((a) => `<div>${a}</div>`).join("");
      } else {
        sandhiBox.classList.add("hidden");
      }
    }
  }

  function renderSpeakStep() {
    const list = getSpeakItems();
    if (!list.length) return;
    if (ui.speakIdx >= list.length) ui.speakIdx = 0;
    if (ui.speakIdx < 0) ui.speakIdx = list.length - 1;
    const item = list[ui.speakIdx];
    ui.charOverrides = {};

    ["sentence", "word", "roleplay"].forEach((m) => {
      el("spk-sub-" + m)?.classList.toggle("active", m === ui.speakSubMode);
    });

    if (el("spk-tag")) el("spk-tag").textContent = item.tag;
    if (el("spk-counter")) el("spk-counter").textContent = `Mục ${ui.speakIdx + 1} / ${list.length}`;
    renderSpeakTargetChars(item.zh, -1);
    renderToneContourAndSandhi(item.zh);
    if (el("spk-target-py")) el("spk-target-py").textContent = item.py;
    if (el("spk-target-vi")) el("spk-target-vi").textContent = `"${item.vi}"`;
    if (el("spk-tip")) el("spk-tip").textContent = `💡 ${item.tip}`;

    const rpBox = el("spk-roleplay-box");
    if (rpBox) {
      if (ui.speakSubMode === "roleplay" && item.questionZh) {
        rpBox.classList.remove("hidden");
        if (el("spk-rp-speaker")) el("spk-rp-speaker").textContent = `🧑‍🏫 Đối tác: ${item.speaker}`;
        if (el("spk-rp-qzh")) el("spk-rp-qzh").textContent = item.questionZh;
        if (el("spk-rp-qpy")) el("spk-rp-qpy").textContent = `${item.questionPy} — (${item.questionVi})`;
      } else {
        rpBox.classList.add("hidden");
      }
    }

    if (el("spk-input")) el("spk-input").value = "";
    if (el("spk-eval-card")) el("spk-eval-card").classList.add("hidden");
    if (el("spk-diag-box")) el("spk-diag-box").classList.add("hidden");
    if (el("spk-status")) {
      el("spk-status").textContent = "Sẵn sàng thu âm — bấm Bấm để nói hoặc Đọc đuổi Shadowing";
    }
    el("spk-open-https-top")?.classList.toggle(
      "hidden",
      !Speech.isEmbedded() || Speech.onPublicSite()
    );
  }

  function startShadowingPractice() {
    const item = getSpeakItems()[ui.speakIdx];
    if (!item) return;
    if (Speech.getIsRecording()) {
      Speech.stopRecording(false);
    }
    const statusEl = el("spk-status");
    if (statusEl) {
      statusEl.textContent = "🎧 Đang phát câu mẫu... Chuẩn bị đọc đuổi theo ngay khi mẫu dứt lời!";
    }
    Voice.speak(item.zh, Store.state.voiceGender, 0.85, () => {
      if (statusEl) statusEl.textContent = "🎙️ Đến lượt bạn! Hãy đọc to câu vừa nghe...";
      toggleMic();
    });
  }

  function stepSpeak(delta) {
    const list = getSpeakItems();
    if (!list.length) return;
    Voice.playEffect("pop");
    if (Speech.getIsRecording()) Speech.stopRecording(false);
    ui.speakIdx = (ui.speakIdx + delta + list.length) % list.length;
    renderSpeakStep();
  }

  function speakTargetAudio(gender, slow) {
    const item = getSpeakItems()[ui.speakIdx];
    if (!item) return;
    Voice.speak(item.zh, gender, slow ? 0.7 : undefined);
  }

  function speakRoleplayPartner() {
    const item = getSpeakItems()[ui.speakIdx];
    if (item && item.questionZh) Voice.speak(item.questionZh);
  }

  function setWaveformLevel(level) {
    const wave = el("spk-waveform");
    if (!wave) return;
    const bars = wave.querySelectorAll("span");
    bars.forEach((b, i) => {
      if (level <= 0) {
        b.style.height = i % 2 === 0 ? "8px" : "13px";
      } else {
        const h = 5 + Math.round(level * 22 * (0.6 + 0.4 * Math.sin(Date.now() / 85 + i)));
        b.style.height = `${Math.max(5, h)}px`;
      }
    });
  }

  function startIdleWaveAnimation(active) {
    if (ui.waveIdleTimer) {
      clearInterval(ui.waveIdleTimer);
      ui.waveIdleTimer = null;
    }
    if (!active) {
      setWaveformLevel(0);
      return;
    }
    ui.waveIdleTimer = setInterval(() => {
      setWaveformLevel(0.35 + Math.random() * 0.45);
    }, 110);
  }

  function toggleMic() {
    Voice.playEffect("pop");
    if (Speech.getIsRecording()) {
      Speech.stopRecording(true);
      return;
    }

    const list = getSpeakItems();
    const item = list[ui.speakIdx];
    if (!item) return;

    const micBtn = el("spk-mic-btn");
    const statusEl = el("spk-status");
    const inp = el("spk-input");
    const diagBox = el("spk-diag-box");

    if (diagBox) diagBox.classList.add("hidden");
    if (el("spk-eval-card")) el("spk-eval-card").classList.add("hidden");
    if (inp) inp.value = "";

    startIdleWaveAnimation(true);

    Speech.startRecording({
      targetZh: item.zh,
      onStateChange(phase, remainSec) {
        if (!micBtn) return;
        micBtn.classList.add("btn-mic-recording");
        if (phase === "starting") {
          micBtn.innerHTML = `<span>⏳</span><span>Đang mở Micro...</span>`;
          if (statusEl) statusEl.textContent = "Hãy bấm Cho phép (Allow) nếu trình duyệt hỏi quyền Micro";
        } else if (phase === "listening" || phase === "tick") {
          micBtn.innerHTML = `<span>⏹️</span><span>Đang thu âm (${remainSec}s) • Bấm để chấm</span>`;
          if (phase === "listening" && statusEl) {
            statusEl.textContent = "🔴 Micro đang thu — hãy đọc to rõ câu tiếng Trung ở trên!";
          }
        }
      },
      onLevel(level) {
        if (ui.waveIdleTimer) {
          clearInterval(ui.waveIdleTimer);
          ui.waveIdleTimer = null;
        }
        setWaveformLevel(level);
      },
      onAudioReady() {
        el("spk-playback-btn")?.classList.remove("hidden");
      },
      onLiveUpdate(liveText) {
        if (inp) inp.value = liveText;
        if (statusEl) statusEl.textContent = `🗣️ Đang nghe: 「${liveText}」`;
        const targetChars = Array.from(Speech.cleanHanzi(item.zh));
        const spokenChars = Array.from(Speech.cleanHanzi(liveText));
        renderSpeakTargetChars(item.zh, Math.min(spokenChars.length, targetChars.length - 1));
      },
      onError(errMsg, isFatal) {
        showSpeakDiagnostic(errMsg, isFatal);
        if (isFatal && inp) {
          inp.focus();
          inp.placeholder =
            "🎙️ Bấm phím 🎤 Micro trên bàn phím (hoặc Win+H) để nói tiếng Trung trực tiếp vào đây — tự động chấm sau 1 giây!";
        }
      },
      onFinish({ shouldGrade, transcript, error, fatalError }) {
        startIdleWaveAnimation(false);
        renderSpeakTargetChars(item.zh, -1);
        if (micBtn) {
          micBtn.classList.remove("btn-mic-recording");
          micBtn.innerHTML = `<span>🎙️</span><span>Bấm để nói (zh-TW)</span>`;
        }
        if (!shouldGrade) return;

        const finalSpoken = transcript || (inp ? DB.toTraditional(inp.value.trim()) : "");
        if (!finalSpoken) {
          if (statusEl) statusEl.textContent = "⚠️ Chưa nhận được câu tiếng Trung nào.";
          showSpeakDiagnostic(
            error ||
              "Chưa thu được giọng nói. Nếu bạn đang ở khung xem trước của chat, hãy mở ứng dụng ở tab riêng (HTTPS) hoặc dùng phím 🎤 Micro trên bàn phím để nói vào ô chữ Hán.",
            Speech.isEmbedded() || fatalError
          );
          if (Speech.isEmbedded() && inp) inp.focus();
          Voice.playEffect("wrong");
          return;
        }
        if (inp) inp.value = finalSpoken;
        if (statusEl) statusEl.textContent = `✅ Đã thu nhận: 「${finalSpoken}」`;
        evaluateCurrentSpeech(finalSpoken);
      }
    });
  }

  function showSpeakDiagnostic(msg, showLink) {
    const box = el("spk-diag-box");
    const text = el("spk-diag-text");
    const link = el("spk-diag-link");
    if (!box || !text) return;
    box.classList.remove("hidden");
    text.textContent = msg;
    if (link) {
      link.classList.toggle("hidden", !showLink || Speech.onPublicSite());
    }
  }

  function handleSpeakInputLive(val) {
    const clean = DB.toTraditional((val || "").trim());
    if (!clean) return;
    const item = getSpeakItems()[ui.speakIdx];
    if (item) {
      const spokenLen = Array.from(Speech.cleanHanzi(clean)).length;
      const targetLen = Array.from(Speech.cleanHanzi(item.zh)).length;
      renderSpeakTargetChars(item.zh, Math.min(spokenLen - 1, targetLen - 1));
    }
    const statusEl = el("spk-status");
    if (statusEl) statusEl.textContent = `🗣️ Đang nhận: 「${clean}」 (tự động chấm sau 1 giây)...`;
    if (ui.dictationTimer) clearTimeout(ui.dictationTimer);
    ui.dictationTimer = setTimeout(() => {
      evaluateCurrentSpeech(clean);
    }, 1100);
  }

  function runDemoSpeech(preset) {
    Voice.playEffect("pop");
    if (Speech.getIsRecording()) Speech.stopRecording(false);
    ui.charOverrides = {};
    const item = getSpeakItems()[ui.speakIdx];
    if (!item) return;

    let sample = item.zh;
    if (preset === "near") {
      const chars = Array.from(item.zh);
      for (let i = 0; i < chars.length; i++) {
        const grp = DB.HOMOPHONE_GROUPS.find((g) => g.includes(chars[i]));
        if (grp) {
          const alt = grp.find((c) => c !== chars[i]);
          if (alt) {
            chars[i] = alt;
            break;
          }
        }
      }
      sample = chars.join("");
    } else if (preset === "wrong") {
      sample = item.zh.slice(0, Math.max(2, Math.floor(item.zh.length / 2)));
    }
    if (el("spk-input")) el("spk-input").value = sample;
    if (el("spk-status")) el("spk-status").textContent = `🧪 Demo chấm mẫu với câu: 「${sample}」`;
    evaluateCurrentSpeech(sample);
  }

  function toggleCharOverride(charIdx) {
    Voice.playEffect("pop");
    const cur = ui.charOverrides[charIdx] || "exact";
    const nextMap = { exact: "near", near: "missing", missing: "exact" };
    ui.charOverrides[charIdx] = nextMap[cur] || "near";
    evaluateCurrentSpeech(el("spk-input")?.value, true);
  }

  function evaluateCurrentSpeech(overrideText, isReEval = false) {
    const item = getSpeakItems()[ui.speakIdx];
    if (!item) return;
    const raw = overrideText !== undefined ? overrideText : el("spk-input")?.value || "";
    const res = Speech.gradeSpeech(item.zh, raw, ui.charOverrides);

    if (!res) {
      if (el("spk-status")) {
        el("spk-status").textContent = "⚠️ Chưa có câu tiếng Trung nào để chấm — hãy bấm Bấm để nói trước.";
      }
      if (el("spk-eval-card")) el("spk-eval-card").classList.add("hidden");
      return;
    }

    res.charResults.forEach((cr) => {
      ui.charOverrides[cr.idx] = cr.status;
    });

    if (!isReEval) {
      Store.state.stats.speakScores.push(res.totalScore);
      Store.completeComebackTask("t3");
      syncTopBar();
      if (res.totalScore >= 80) Voice.playEffect("win");
      else Voice.playEffect("wrong");
    }

    const card = el("spk-eval-card");
    if (card) card.classList.remove("hidden");

    if (el("spk-score-badge")) {
      el("spk-score-badge").textContent = `${res.totalScore}%`;
      el("spk-score-badge").style.background =
        res.totalScore >= 85
          ? "var(--jade)"
          : res.totalScore >= 65
          ? "var(--amber)"
          : "var(--primary)";
    }

    if (el("spk-verdict-title")) {
      el("spk-verdict-title").textContent =
        res.totalScore >= 88
          ? "🏆 Phát âm rất chuẩn Đài Loan! (發音非常標準)"
          : res.totalScore >= 65
          ? "👍 Khá tốt! Chỉ cần chỉnh nhẹ thanh điệu một vài chữ"
          : "💪 Cần đọc chậm và rõ từng chữ Hán hơn";
    }
    if (el("spk-verdict-sub")) {
      el("spk-verdict-sub").textContent = `Khớp chính xác ${res.exactCount}/${res.totalTarget} chữ Phồn thể • Thanh điệu: ${res.toneScore}% • Độ trôi chảy: ${res.fluencyScore}%`;
    }

    const grid = el("spk-char-grid");
    if (grid) {
      grid.innerHTML = res.charResults
        .map((cr) => {
          const statusLabel =
            cr.status === "exact"
              ? "✅ Chuẩn"
              : cr.status === "near"
              ? `⚠️ Lệch: ${cr.spoken}`
              : "❌ Thiếu";
          return `
          <div class="char-eval-card status-${cr.status}">
            <button onclick="VoiceService.speak('${cr.target}')" style="display:flex;flex-direction:column;align-items:center;" title="Bấm để nghe phát âm chữ ${cr.target}">
              <span style="font-size:12px;color:var(--text-secondary);font-weight:700;">🔊 ${cr.py || "—"}</span>
              <span class="hanzi" style="font-size:24px;font-weight:900;">${cr.target}</span>
              <span style="font-size:12px;font-weight:700;">${statusLabel}</span>
            </button>
            <button onclick="App.toggleCharOverride(${cr.idx})" class="tag" style="margin-top:4px;font-size:12px;">🔁 Đổi</button>
          </div>`;
        })
        .join("");
    }

    const notesEl = el("spk-teacher-notes");
    if (notesEl) {
      const lines = [];
      lines.push(
        `<div>• <b>Câu thu nhận:</b> <span class="hanzi" style="font-weight:800;">「${res.spokenTrad}」</span> — <b>Câu chuẩn:</b> <span class="hanzi" style="font-weight:800;color:var(--jade);">「${item.zh}」</span></div>`
      );
      if (res.nearNotes.length) {
        lines.push(
          `<div style="color:var(--amber);margin-top:4px;">⚠️ <b>Lệch âm / thanh điệu:</b> ${res.nearNotes.join("; ")}.</div>`
        );
      }
      if (res.missingNotes.length) {
        lines.push(
          `<div style="color:var(--primary-text);margin-top:4px;">❌ <b>Chữ còn thiếu hoặc chưa rõ:</b> ${res.missingNotes.join(", ")}. Hãy bấm vào từng ô chữ ở trên để nghe mẫu riêng từng chữ.</div>`
        );
      }
      if (res.totalScore >= 88 && !res.nearNotes.length && !res.missingNotes.length) {
        lines.push(
          `<div style="color:var(--jade);margin-top:4px;">✅ Bạn phát âm đầy đủ các âm tiết và giữ đúng thanh điệu Bài ${item.lesson}.</div>`
        );
      }
      notesEl.innerHTML = lines.join("");
    }
  }

  // ==========================================================================
  // STEP 4: 測驗 Kiểm tra & Tiến độ
  // ==========================================================================
  function setTestSubMode(mode) {
    Voice.playEffect("pop");
    ui.testSubMode = mode;
    ["match", "detective", "quiz", "progress"].forEach((m) => {
      el("tsub-" + m)?.classList.toggle("active", m === mode);
      el("test-view-" + m)?.classList.toggle("hidden", m !== mode);
    });
    renderTestStep();
  }

  function renderTestStep() {
    ["match", "detective", "quiz", "progress"].forEach((m) => {
      el("tsub-" + m)?.classList.toggle("active", m === ui.testSubMode);
      el("test-view-" + m)?.classList.toggle("hidden", m !== ui.testSubMode);
    });

    if (ui.testSubMode === "match") {
      if (!ui.matchCards.length) initMatchGame();
      else renderMatchBoard();
    } else if (ui.testSubMode === "detective") {
      renderDetectiveQuestion();
    } else if (ui.testSubMode === "quiz") {
      if (!ui.quizItem) nextQuickQuiz();
      else renderQuickQuiz();
    } else if (ui.testSubMode === "progress") {
      renderProgressDashboard();
    }
  }

  function initMatchGame() {
    const pool = shuffle(Store.getVocab()).slice(0, 6);
    const cards = [];
    pool.forEach((w) => {
      cards.push({ id: w.id, type: "hz", label: w.hz, sub: `${w.py} [${w.hv || ""}]`, hz: w.hz });
      cards.push({ id: w.id, type: "vi", label: w.vi, sub: `Bài ${w.lesson}`, hz: w.hz });
    });
    ui.matchCards = shuffle(cards);
    ui.matchFirstIdx = null;
    ui.matchMatched = new Set();
    renderMatchBoard();
  }

  function renderMatchBoard() {
    const board = el("match-board");
    if (!board) return;
    if (ui.matchMatched.size === ui.matchCards.length && ui.matchCards.length > 0) {
      board.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:24px;">
          <div style="font-size:18px;font-weight:800;color:var(--jade);margin-bottom:8px;">🎉 Hoàn thành ghép cặp xuất sắc!</div>
          <button onclick="App.initMatchGame()" class="btn btn-primary">🔄 Chơi ván mới</button>
        </div>`;
      return;
    }
    board.innerHTML = ui.matchCards
      .map((c, idx) => {
        const done = ui.matchMatched.has(idx);
        const picked = ui.matchFirstIdx === idx;
        return `
        <button onclick="App.pickMatchCard(${idx})" ${done ? "disabled" : ""} class="card-compact" style="text-align:center;padding:16px 12px;border-color:${
          picked ? "var(--primary)" : done ? "var(--jade-border)" : "var(--border)"
        };background:${
          picked ? "var(--primary-soft)" : done ? "var(--jade-soft)" : "var(--surface)"
        };">
          <div class="${c.type === "hz" ? "hanzi" : ""}" style="font-size:${
          c.type === "hz" ? "22px" : "14px"
        };font-weight:800;">${c.label}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${c.sub}</div>
        </button>`;
      })
      .join("");
  }

  function pickMatchCard(idx) {
    if (ui.matchMatched.has(idx) || ui.matchFirstIdx === idx) return;
    const card = ui.matchCards[idx];
    if (card.type === "hz") Voice.speak(card.hz);
    else Voice.playEffect("pop");

    if (ui.matchFirstIdx === null) {
      ui.matchFirstIdx = idx;
      renderMatchBoard();
      return;
    }

    const first = ui.matchCards[ui.matchFirstIdx];
    if (first.id === card.id && first.type !== card.type) {
      Voice.playEffect("win");
      ui.matchMatched.add(ui.matchFirstIdx);
      ui.matchMatched.add(idx);
      Store.state.stats.quizRight++;
      Store.state.stats.quizTotal++;
    } else {
      Voice.playEffect("wrong");
      Store.state.stats.quizTotal++;
    }
    ui.matchFirstIdx = null;
    renderMatchBoard();
  }

  function renderDetectiveQuestion() {
    const list = Store.getDetective();
    if (!list.length) return;
    if (ui.detectiveIdx >= list.length) ui.detectiveIdx = 0;
    const item = list[ui.detectiveIdx];

    if (el("det-tag")) el("det-tag").textContent = `Bài ${item.lesson} (Phần ${item.part}) • Câu ${ui.detectiveIdx + 1}/${list.length}`;
    if (el("det-wrong-zh")) el("det-wrong-zh").textContent = item.wrongZh;
    if (el("det-feedback")) el("det-feedback").classList.add("hidden");

    const optWrap = el("det-options");
    if (optWrap) {
      optWrap.innerHTML = item.options
        .map(
          (opt, idx) => `
        <button onclick="App.checkDetective(${idx})" class="vocab-row" style="padding:13px 16px;font-weight:600;">
          <span>${idx + 1}. ${opt}</span>
        </button>`
        )
        .join("");
    }
  }

  function checkDetective(idx) {
    const list = Store.getDetective();
    const item = list[ui.detectiveIdx];
    if (!item) return;
    const fb = el("det-feedback");
    if (!fb) return;
    fb.classList.remove("hidden");
    Store.state.stats.quizTotal++;

    if (idx === item.correctIdx) {
      Store.state.stats.quizRight++;
      Voice.playEffect("win");
      Voice.speak(item.correctZh);
      fb.style.background = "var(--jade-soft)";
      fb.style.borderColor = "var(--jade-border)";
      fb.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;color:var(--jade);">✅ Chính xác! Câu chuẩn Phồn thể là:</div>
            <div class="hanzi" style="font-size:20px;font-weight:900;margin-top:2px;">${item.correctZh}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${item.py}</div>
          </div>
          <button onclick="App.nextDetective()" class="btn btn-sm btn-jade">Câu tiếp theo ➔</button>
        </div>`;
    } else {
      Voice.playEffect("wrong");
      fb.style.background = "var(--primary-soft)";
      fb.style.borderColor = "var(--primary)";
      fb.innerHTML = `<div style="font-weight:800;color:var(--primary-text);">❌ Chưa đúng điểm sai ngữ pháp. Hãy xem lại cấu trúc câu rồi chọn lại!</div>`;
    }
  }

  function nextDetective() {
    const list = Store.getDetective();
    ui.detectiveIdx = (ui.detectiveIdx + 1) % list.length;
    renderDetectiveQuestion();
  }

  function nextQuickQuiz() {
    const pool = Store.getVocab();
    if (!pool.length) return;
    ui.quizItem = pool[Math.floor(Math.random() * pool.length)];
    const distractors = shuffle(DB.VOCAB_DB.filter((v) => v.id !== ui.quizItem.id))
      .slice(0, 3)
      .map((v) => v.vi);
    ui.quizOptions = shuffle([ui.quizItem.vi, ...distractors]);
    renderQuickQuiz();
  }

  function renderQuickQuiz() {
    const item = ui.quizItem;
    if (!item) return;
    if (el("qq-hanzi")) el("qq-hanzi").textContent = item.hz;
    if (el("qq-pinyin")) el("qq-pinyin").textContent = `${item.py} • [${item.hv || ""}]`;
    if (el("qq-score")) {
      el("qq-score").textContent = `Đúng ${Store.state.stats.quizRight} / ${Store.state.stats.quizTotal} lượt`;
    }
    if (el("qq-feedback")) el("qq-feedback").classList.add("hidden");
    const optWrap = el("qq-options");
    if (optWrap) {
      optWrap.innerHTML = ui.quizOptions
        .map(
          (opt, idx) => `
        <button onclick="App.answerQuickQuiz(${idx})" class="vocab-row" style="padding:14px 16px;font-weight:700;">
          <span>${idx + 1}. ${opt}</span>
        </button>`
        )
        .join("");
    }
  }

  function answerQuickQuiz(idx) {
    const item = ui.quizItem;
    if (!item) return;
    const chosen = ui.quizOptions[idx];
    const fb = el("qq-feedback");
    Store.state.stats.quizTotal++;
    if (chosen === item.vi) {
      Store.state.stats.quizRight++;
      Store.setWordMastery(item.id, "easy");
      Voice.playEffect("win");
      Voice.speak(item.hz);
      if (fb) {
        fb.classList.remove("hidden");
        fb.style.background = "var(--jade-soft)";
        fb.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:800;color:var(--jade);">✅ Chính xác: ${item.hz} (${item.py}) = ${item.vi}</span>
          <button onclick="App.nextQuickQuiz()" class="btn btn-sm btn-jade">Tiếp tục ➔</button>
        </div>`;
      }
    } else {
      Store.setWordMastery(item.id, "hard");
      Voice.playEffect("wrong");
      if (fb) {
        fb.classList.remove("hidden");
        fb.style.background = "var(--primary-soft)";
        fb.innerHTML = `<span style="font-weight:800;color:var(--primary-text);">❌ Chưa đúng — từ này đã được tự động thêm vào danh sách "Từ khó ⭐" để ôn lại!</span>`;
      }
    }
    if (el("qq-score")) {
      el("qq-score").textContent = `Đúng ${Store.state.stats.quizRight} / ${Store.state.stats.quizTotal} lượt`;
    }
  }

  function renderProgressDashboard() {
    const s = Store.state.stats;
    const counts = Store.getMasteryCounts();
    const avgSpk = s.speakScores.length
      ? Math.round(s.speakScores.reduce((a, b) => a + b, 0) / s.speakScores.length)
      : 0;
    const acc = s.quizTotal ? Math.round((s.quizRight / s.quizTotal) * 100) : 100;

    if (el("prog-vocab-count")) el("prog-vocab-count").textContent = `${counts.easy}/${counts.total} thuộc`;
    if (el("prog-sent-count")) el("prog-sent-count").textContent = `${s.sentencesDone} câu`;
    if (el("prog-speak-avg")) el("prog-speak-avg").textContent = s.speakScores.length ? `${avgSpk}%` : "Chưa thu";
    if (el("prog-quiz-acc")) el("prog-quiz-acc").textContent = `${acc}%`;
  }

  // ==========================================================================
  // MODALS: Scope Filter & 5-Day Comeback Mission
  // ==========================================================================
  function openScopeModal() {
    Voice.playEffect("pop");
    renderScopeModal();
    el("modal-scope")?.classList.remove("hidden");
  }

  function closeScopeModal() {
    el("modal-scope")?.classList.add("hidden");
  }

  function renderScopeModal() {
    const lGrid = el("scope-lessons-grid");
    if (lGrid) {
      lGrid.innerHTML = DB.LESSONS_META.map((m) => {
        const active = Store.state.activeLessons.includes(m.id);
        return `
        <div class="card-compact" style="border-color:${active ? "var(--primary)" : "var(--border)"};background:${
          active ? "var(--primary-soft)" : "var(--surface)"
        };">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <label style="display:flex;align-items:center;gap:8px;font-weight:800;cursor:pointer;">
              <input type="checkbox" ${active ? "checked" : ""} onchange="App.handleToggleLesson(${m.id})" />
              <span>${m.titleVi}</span>
            </label>
            <button onclick="App.handleOnlyLesson(${m.id})" class="tag">Chỉ học bài này</button>
          </div>
          <div class="hanzi" style="font-size:13px;font-weight:700;color:var(--primary-text);margin-top:4px;">${m.titleZh}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${m.goal}</div>
        </div>`;
      }).join("");
    }

    ["ALL", 1, 2].forEach((p) => {
      el("scope-part-" + p)?.classList.toggle("active", Store.state.activePart === p);
    });

    ["female", "male", "duet"].forEach((g) => {
      el("voice-opt-" + g)?.classList.toggle("active", Store.state.voiceGender === g);
    });
    [0.8, 1.0, 1.15].forEach((r) => {
      el("rate-opt-" + String(r).replace(".", "_"))?.classList.toggle("active", Store.state.voiceRate === r);
    });

    const wordsInLessons = DB.VOCAB_DB.filter(
      (v) =>
        Store.state.activeLessons.includes(v.lesson) &&
        (Store.state.activePart === "ALL" || v.part === Store.state.activePart)
    );
    const wGrid = el("scope-words-grid");
    if (wGrid) {
      wGrid.innerHTML = wordsInLessons
        .map((w) => {
          const enabled = !Store.state.disabledWordIds.has(w.id);
          return `
          <button onclick="App.handleToggleWord('${w.id}')" class="pill-btn ${enabled ? "pill-primary" : ""}" style="opacity:${
            enabled ? "1" : "0.45"
          };">
            <span>${enabled ? "✓" : "+"}</span>
            <span class="hanzi" style="font-weight:800;">${w.hz}</span>
            <span>(${w.vi})</span>
          </button>`;
        })
        .join("");
    }
  }

  function handleToggleLesson(id) {
    Store.toggleLesson(id);
    renderScopeModal();
    refreshAll();
  }

  function handleOnlyLesson(id) {
    Store.setOnlyLesson(id);
    renderScopeModal();
    refreshAll();
  }

  function handleSelectAllLessons() {
    Store.setAllLessons();
    renderScopeModal();
    refreshAll();
  }

  function handlePartFilter(part) {
    Store.setPartFilter(part);
    renderScopeModal();
    refreshAll();
  }

  function handleToggleWord(wordId) {
    Store.toggleWordId(wordId);
    renderScopeModal();
    refreshAll();
  }

  function handleSetAllWords(enabled) {
    Store.setAllWordsInScope(enabled);
    renderScopeModal();
    refreshAll();
  }

  function openComebackModal() {
    Voice.playEffect("pop");
    renderComebackModal();
    el("modal-comeback")?.classList.remove("hidden");
  }

  function closeComebackModal() {
    el("modal-comeback")?.classList.add("hidden");
  }

  function renderComebackModal() {
    const listEl = el("comeback-task-list");
    if (listEl) {
      listEl.innerHTML = Store.state.comebackTasks
        .map(
          (t) => `
        <div class="vocab-row" style="background:${t.done ? "var(--jade-soft)" : "var(--surface)"};">
          <span style="font-weight:700;">${t.done ? "✅" : "⬜"} ${t.label}</span>
          <span class="tag ${t.done ? "tag-jade" : ""}">${t.done ? "Hoàn thành" : "Đang chờ"}</span>
        </div>`
        )
        .join("");
    }
    updateFocusTimerUI();
  }

  function triggerInstantComeback() {
    Store.state.comebackTasks.forEach((t) => (t.done = true));
    Store.state.comebackBroken = true;
    Voice.playEffect("win");
    Voice.speak("太棒了！歡迎你回來學繁體中文！我們馬上開始吧！");
    if (!Store.state.stats.focusRunning) toggleFocusTimer();
    renderComebackModal();
    syncTopBar();
  }

  function toggleFocusTimer() {
    Store.state.stats.focusRunning = !Store.state.stats.focusRunning;
    if (ui.focusInterval) {
      clearInterval(ui.focusInterval);
      ui.focusInterval = null;
    }
    if (Store.state.stats.focusRunning) {
      ui.focusInterval = setInterval(() => {
        if (Store.state.stats.focusSeconds > 0) {
          Store.state.stats.focusSeconds--;
          updateFocusTimerUI();
        } else {
          Store.state.stats.focusRunning = false;
          clearInterval(ui.focusInterval);
          Voice.playEffect("win");
        }
      }, 1000);
    }
    updateFocusTimerUI();
  }

  function updateFocusTimerUI() {
    const sec = Store.state.stats.focusSeconds;
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    if (el("focus-timer-display")) el("focus-timer-display").textContent = `${m}:${s}`;
    if (el("focus-timer-btn")) {
      el("focus-timer-btn").textContent = Store.state.stats.focusRunning
        ? "⏸ Tạm dừng"
        : "▶️ Bắt đầu 15 phút tập trung";
    }
  }

  // Global Keyboard Shortcuts for faster studying
  function bindKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (ui.currentStep === "vocab") speakCurrentVocab();
        else if (ui.currentStep === "sentence") speakCurrentSentence();
        else if (ui.currentStep === "speak") speakTargetAudio();
      } else if (e.key === "ArrowRight") {
        if (ui.currentStep === "vocab") stepVocab(1);
        else if (ui.currentStep === "sentence") stepSentence(1);
        else if (ui.currentStep === "speak") stepSpeak(1);
      } else if (e.key === "ArrowLeft") {
        if (ui.currentStep === "vocab") stepVocab(-1);
        else if (ui.currentStep === "sentence") stepSentence(-1);
        else if (ui.currentStep === "speak") stepSpeak(-1);
      } else if ((e.key === "r" || e.key === "R") && ui.currentStep === "speak") {
        e.preventDefault();
        toggleMic();
      }
    });
  }

  function init() {
    syncTopBar();
    bindKeyboardShortcuts();
    setStep("vocab");
  }

  return {
    init,
    setStep,
    cycleVoiceGender,
    setVoiceOption,
    toggleTheme,
    dismissComebackStrip,
    setVocabSubMode,
    setCardExampleFilter,
    openExamplesModal,
    closeExamplesModal,
    practiceExampleInSpeak,
    setVocabFilter,
    handleVocabSearch,
    rateCurrentVocab,
    toggleCurrentBookmark,
    toggleAutoPlayVocab,
    selectWritingChar,
    toggleWritingGuide,
    clearWritingCanvas,
    gradeWritingCanvas,
    selectVocab,
    stepVocab,
    speakCurrentVocab,
    speakCurrentVocabExample,
    practiceSpeakCurrentVocab,
    setSentenceSubMode,
    giveV2ZNextTileHint,
    pickV2ZTile,
    removeV2ZTile,
    resetV2Z,
    checkV2ZAnswer,
    checkZ2VChoice,
    stepSentence,
    speakCurrentSentence,
    jumpToSpeakSentence,
    setSpeakSubMode,
    startShadowingPractice,
    stepSpeak,
    speakTargetAudio,
    speakRoleplayPartner,
    toggleMic,
    handleSpeakInputLive,
    runDemoSpeech,
    toggleCharOverride,
    evaluateCurrentSpeech,
    setTestSubMode,
    initMatchGame,
    pickMatchCard,
    checkDetective,
    nextDetective,
    nextQuickQuiz,
    answerQuickQuiz,
    openScopeModal,
    closeScopeModal,
    handleToggleLesson,
    handleOnlyLesson,
    handleSelectAllLessons,
    handlePartFilter,
    handleToggleWord,
    handleSetAllWords,
    openComebackModal,
    closeComebackModal,
    triggerInstantComeback,
    toggleFocusTimer
  };
})();

window.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});
