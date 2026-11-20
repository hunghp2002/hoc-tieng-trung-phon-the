/**
 * ============================================================================
 * MODULE 5: APPLICATION UI CONTROLLER
 * Implements the 4-Step Scientific Learning Loop (當代中文課程 1)
 * 1. 詞彙 Từ vựng & Ngữ pháp -> 2. 造句 Đặt câu & Dịch -> 3. 口說 Luyện nói -> 4. 測驗 Kiểm tra
 * ============================================================================
 */
window.App = (function () {
  "use strict";

  const DB = window.CurriculumDB;
  const Store = window.AppStore;
  const Voice = window.VoiceService;
  const Speech = window.SpeechService;

  const ui = {
    currentStep: "vocab", // "vocab" | "sentence" | "speak" | "test"
    vocabSubMode: "flashcard", // "flashcard" | "grammar"
    vocabIdx: 0,

    sentSubMode: "v2z", // "v2z" | "z2v"
    sentIdx: 0,
    v2zPicked: [],
    v2zShuffled: [],
    z2vOptions: [],

    speakSubMode: "sentence", // "sentence" | "word" | "roleplay"
    speakIdx: 0,
    charOverrides: {},
    dictationTimer: null,
    waveIdleTimer: null,

    testSubMode: "match", // "match" | "detective" | "quiz" | "progress"
    matchCards: [],
    matchFirstIdx: null,
    matchMatched: new Set(),
    detectiveIdx: 0,
    quizIdx: 0,
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
    if (Speech.getIsRecording()) {
      Speech.stopRecording(false);
    }
    ui.currentStep = step;
    ["vocab", "sentence", "speak", "test"].forEach((s) => {
      const tab = el("nav-step-" + s);
      const panel = el("panel-step-" + s);
      if (tab) tab.classList.toggle("active", s === step);
      if (panel) panel.classList.toggle("hidden", s !== step);
    });
    renderCurrentStep();
  }

  function syncTopBar() {
    const scopeBtn = el("top-scope-summary");
    if (scopeBtn) scopeBtn.textContent = Store.getScopeSummaryText();

    const voiceBtn = el("top-voice-summary");
    if (voiceBtn) {
      const g = Store.state.voiceGender;
      const gLabel = g === "female" ? "👩 Nữ (雅婷)" : g === "male" ? "👨 Nam (雲哲)" : "👫 Song thanh";
      voiceBtn.textContent = `${gLabel} • ${Store.state.voiceRate}x`;
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

    const strip = el("comeback-strip");
    if (strip) {
      strip.classList.toggle(
        "hidden",
        Store.state.comebackDismissed || Store.state.comebackBroken
      );
    }
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

  // ==========================================================================
  // STEP 1: 詞彙 Từ vựng & Ngữ pháp
  // ==========================================================================
  function setVocabSubMode(mode) {
    Voice.playEffect("pop");
    ui.vocabSubMode = mode;
    el("vsub-flashcard")?.classList.toggle("active", mode === "flashcard");
    el("vsub-grammar")?.classList.toggle("active", mode === "grammar");
    el("vocab-flashcard-view")?.classList.toggle("hidden", mode !== "flashcard");
    el("vocab-grammar-view")?.classList.toggle("hidden", mode !== "grammar");
    renderVocabStep();
  }

  function renderVocabStep() {
    const list = Store.getVocab();
    if (!list.length) return;
    if (ui.vocabIdx >= list.length) ui.vocabIdx = 0;
    if (ui.vocabIdx < 0) ui.vocabIdx = list.length - 1;
    const item = list[ui.vocabIdx];

    if (ui.vocabSubMode === "flashcard") {
      if (el("vc-tag")) el("vc-tag").textContent = `Bài ${item.lesson} • Phần ${item.part} • ${item.pos}`;
      if (el("vc-counter")) el("vc-counter").textContent = `${ui.vocabIdx + 1} / ${list.length}`;
      if (el("vc-scene")) el("vc-scene").innerHTML = DB.SCENE_SVGS[item.scene] || DB.SCENE_SVGS.greeting;
      if (el("vc-hanzi")) el("vc-hanzi").textContent = item.hz;
      if (el("vc-pinyin")) el("vc-pinyin").textContent = item.py;
      if (el("vc-meaning")) el("vc-meaning").textContent = item.vi;
      if (el("vc-ex-zh")) el("vc-ex-zh").textContent = item.exZh;
      if (el("vc-ex-py")) el("vc-ex-py").textContent = item.exPy;
      if (el("vc-ex-vi")) el("vc-ex-vi").textContent = item.exVi;

      const listEl = el("vc-side-list");
      if (listEl) {
        listEl.innerHTML = list
          .map(
            (w, idx) => `
          <button onclick="App.selectVocab(${idx})" class="vocab-row ${idx === ui.vocabIdx ? "active" : ""}">
            <div>
              <span class="hanzi" style="font-size:18px;font-weight:800;">${w.hz}</span>
              <span style="font-size:13px;color:var(--primary);font-weight:700;margin-left:8px;">${w.py}</span>
              <div style="font-size:13px;color:var(--text-secondary);">${w.vi}</div>
            </div>
            <span class="tag">B.${w.lesson}.${w.part}</span>
          </button>`
          )
          .join("");
      }
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

  function selectVocab(idx) {
    ui.vocabIdx = idx;
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
  // STEP 2: 造句 Đặt câu (Việt -> Trung) & Đọc dịch (Trung -> Việt)
  // ==========================================================================
  function setSentenceSubMode(mode) {
    Voice.playEffect("pop");
    ui.sentSubMode = mode;
    el("ssub-v2z")?.classList.toggle("active", mode === "v2z");
    el("ssub-z2v")?.classList.toggle("active", mode === "z2v");
    el("sent-v2z-view")?.classList.toggle("hidden", mode !== "v2z");
    el("sent-z2v-view")?.classList.toggle("hidden", mode !== "z2v");
    prepareSentenceQuestion();
  }

  function renderSentenceStep() {
    el("ssub-v2z")?.classList.toggle("active", ui.sentSubMode === "v2z");
    el("ssub-z2v")?.classList.toggle("active", ui.sentSubMode === "z2v");
    el("sent-v2z-view")?.classList.toggle("hidden", ui.sentSubMode !== "v2z");
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

    if (ui.sentSubMode === "v2z") {
      if (el("v2z-vi-prompt")) el("v2z-vi-prompt").textContent = item.vi;
      if (el("v2z-hint")) el("v2z-hint").textContent = `💡 ${item.hint}`;
      ui.v2zPicked = [];
      ui.v2zShuffled = shuffle(item.tiles);
      if (el("v2z-manual-input")) el("v2z-manual-input").value = "";
      if (el("v2z-feedback")) el("v2z-feedback").classList.add("hidden");
      renderV2ZTiles();
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

  function renderV2ZTiles() {
    const well = el("v2z-answer-well");
    const bank = el("v2z-tile-bank");
    if (!well || !bank) return;

    well.classList.toggle("filled", ui.v2zPicked.length > 0);
    if (ui.v2zPicked.length === 0) {
      well.innerHTML = `<span style="font-size:13px;color:var(--text-muted);">Chạm vào các thẻ từ Phồn thể bên dưới để ghép thành câu hoàn chỉnh...</span>`;
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
            <div style="font-weight:800;color:var(--jade);">✅ Chính xác! Bạn đã đặt câu chuẩn ngữ pháp Phồn thể:</div>
            <div class="hanzi" style="font-size:20px;font-weight:900;margin-top:4px;">${item.zh}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${item.py}</div>
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
        <div style="font-weight:800;color:var(--primary-text);">⚠️ Chưa khớp hoàn toàn. Hãy kiểm tra lại trật tự từ:</div>
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
  // STEP 3: 口說 Phòng Luyện Nói & Chấm Phát Âm (zh-TW)
  // ==========================================================================
  function getSpeakItems() {
    if (ui.speakSubMode === "word") {
      return Store.getVocab().map((w) => ({
        lesson: w.lesson,
        part: w.part,
        tag: `Bài ${w.lesson} (P.${w.part}) • Từ vựng`,
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
      el("spk-status").textContent = "Sẵn sàng thu âm — bấm nút Bấm để nói bên trái";
    }
    const openTop = el("spk-open-https-top");
    if (openTop) {
      openTop.classList.toggle("hidden", !Speech.isEmbedded() || Speech.onPublicSite());
    }
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
      cards.push({ id: w.id, type: "hz", label: w.hz, sub: w.py, hz: w.hz });
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
    if (el("qq-pinyin")) el("qq-pinyin").textContent = item.py;
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
          <span>${opt}</span>
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
      Voice.playEffect("wrong");
      if (fb) {
        fb.classList.remove("hidden");
        fb.style.background = "var(--primary-soft)";
        fb.innerHTML = `<span style="font-weight:800;color:var(--primary-text);">❌ Chưa đúng — hãy thử lại!</span>`;
      }
    }
    if (el("qq-score")) {
      el("qq-score").textContent = `Đúng ${Store.state.stats.quizRight} / ${Store.state.stats.quizTotal} lượt`;
    }
  }

  function renderProgressDashboard() {
    const s = Store.state.stats;
    const avgSpk = s.speakScores.length
      ? Math.round(s.speakScores.reduce((a, b) => a + b, 0) / s.speakScores.length)
      : 0;
    const acc = s.quizTotal ? Math.round((s.quizRight / s.quizTotal) * 100) : 100;

    if (el("prog-vocab-count")) el("prog-vocab-count").textContent = `${s.vocabReviewed} từ`;
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
      const btn = el("scope-part-" + p);
      if (btn) btn.classList.toggle("active", Store.state.activePart === p);
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
      el("focus-timer-btn").textContent = Store.state.stats.focusRunning ? "⏸ Tạm dừng" : "▶️ Bắt đầu 15 phút tập trung";
    }
  }

  function init() {
    syncTopBar();
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
    selectVocab,
    stepVocab,
    speakCurrentVocab,
    speakCurrentVocabExample,
    practiceSpeakCurrentVocab,
    setSentenceSubMode,
    pickV2ZTile,
    removeV2ZTile,
    resetV2Z,
    checkV2ZAnswer,
    checkZ2VChoice,
    stepSentence,
    speakCurrentSentence,
    jumpToSpeakSentence,
    setSpeakSubMode,
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
