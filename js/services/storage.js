/**
 * ============================================================================
 * MODULE 2: SCOPE FILTER, SRS MASTERY & PROGRESS STORE
 * Manages active lessons (1..4), half-lesson parts, individual words,
 * SRS spaced-repetition mastery ('hard' | 'good' | 'easy'), bookmarks & search.
 * ============================================================================
 */
window.AppStore = (function () {
  "use strict";

  const STORAGE_KEY = "tocfl_dangdai1_clean_state_v3";
  const DB = window.CurriculumDB;

  const state = {
    activeLessons: [1, 2, 3, 4],
    activePart: "ALL", // "ALL" | 1 | 2
    disabledWordIds: new Set(),
    wordMastery: {}, // wordId -> "hard" | "good" | "easy"
    bookmarkedIds: new Set(),
    vocabFilterMode: "all", // "all" | "unmastered" | "hard"
    searchQuery: "",
    voiceGender: "female", // "female" | "male" | "duet"
    voiceRate: 1.0,
    comebackDismissed: false,
    comebackBroken: false,
    comebackTasks: [
      { id: "t1", label: "Nghe & đánh giá mức nhớ 2 thẻ từ vựng ở Bước 1", done: false },
      { id: "t2", label: "Hoàn thành 1 câu ghép, dịch hoặc nghe chép ở Bước 2", done: false },
      { id: "t3", label: "Thu âm & chấm phát âm 1 câu ở Bước 3", done: false }
    ],
    stats: {
      vocabReviewed: 0,
      sentencesDone: 0,
      speakScores: [],
      quizRight: 0,
      quizTotal: 0,
      focusSeconds: 15 * 60,
      focusRunning: false
    }
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.activeLessons) && parsed.activeLessons.length) {
        state.activeLessons = parsed.activeLessons;
      }
      if (parsed.activePart) state.activePart = parsed.activePart;
      if (Array.isArray(parsed.disabledWordIds)) {
        state.disabledWordIds = new Set(parsed.disabledWordIds);
      }
      if (parsed.wordMastery && typeof parsed.wordMastery === "object") {
        state.wordMastery = parsed.wordMastery;
      }
      if (Array.isArray(parsed.bookmarkedIds)) {
        state.bookmarkedIds = new Set(parsed.bookmarkedIds);
      }
      if (parsed.voiceGender) state.voiceGender = parsed.voiceGender;
      if (typeof parsed.voiceRate === "number") state.voiceRate = parsed.voiceRate;
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeLessons: state.activeLessons,
          activePart: state.activePart,
          disabledWordIds: Array.from(state.disabledWordIds),
          wordMastery: state.wordMastery,
          bookmarkedIds: Array.from(state.bookmarkedIds),
          voiceGender: state.voiceGender,
          voiceRate: state.voiceRate
        })
      );
    } catch (e) {}
  }

  function normalizeSearch(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getBaseScopedVocab() {
    const filtered = DB.VOCAB_DB.filter(
      (v) =>
        state.activeLessons.includes(v.lesson) &&
        (state.activePart === "ALL" || v.part === state.activePart) &&
        !state.disabledWordIds.has(v.id)
    );
    if (filtered.length > 0) return filtered;
    const byLesson = DB.VOCAB_DB.filter((v) => state.activeLessons.includes(v.lesson));
    return byLesson.length > 0 ? byLesson : DB.VOCAB_DB;
  }

  function getVocab() {
    let list = getBaseScopedVocab();

    if (state.vocabFilterMode === "unmastered") {
      const sub = list.filter((v) => state.wordMastery[v.id] !== "easy");
      if (sub.length > 0) list = sub;
    } else if (state.vocabFilterMode === "hard") {
      const sub = list.filter(
        (v) => state.wordMastery[v.id] === "hard" || state.bookmarkedIds.has(v.id)
      );
      if (sub.length > 0) list = sub;
    }

    const q = normalizeSearch(state.searchQuery.trim());
    if (q) {
      const searched = list.filter(
        (v) =>
          v.hz.includes(state.searchQuery.trim()) ||
          normalizeSearch(v.py).includes(q) ||
          normalizeSearch(v.hv).includes(q) ||
          normalizeSearch(v.vi).includes(q)
      );
      if (searched.length > 0) return searched;
    }
    return list;
  }

  function setWordMastery(wordId, level) {
    state.wordMastery[wordId] = level;
    if (level === "hard") state.bookmarkedIds.add(wordId);
    save();
  }

  function toggleBookmark(wordId) {
    if (state.bookmarkedIds.has(wordId)) state.bookmarkedIds.delete(wordId);
    else state.bookmarkedIds.add(wordId);
    save();
  }

  function getMasteryCounts() {
    const base = getBaseScopedVocab();
    let easy = 0;
    let hard = 0;
    base.forEach((v) => {
      if (state.wordMastery[v.id] === "easy") easy++;
      if (state.wordMastery[v.id] === "hard" || state.bookmarkedIds.has(v.id)) hard++;
    });
    return { total: base.length, easy, hard, unmastered: base.length - easy };
  }

  function getGrammar() {
    const filtered = DB.GRAMMAR_DB.filter(
      (g) =>
        state.activeLessons.includes(g.lesson) &&
        (state.activePart === "ALL" || g.part === state.activePart)
    );
    return filtered.length > 0 ? filtered : DB.GRAMMAR_DB;
  }

  function getSentences() {
    const filtered = DB.SENTENCES_DB.filter(
      (s) =>
        state.activeLessons.includes(s.lesson) &&
        (state.activePart === "ALL" || s.part === state.activePart)
    );
    return filtered.length > 0 ? filtered : DB.SENTENCES_DB;
  }

  function getRoleplay() {
    const filtered = DB.ROLEPLAY_DB.filter(
      (r) =>
        state.activeLessons.includes(r.lesson) &&
        (state.activePart === "ALL" || r.part === state.activePart)
    );
    return filtered.length > 0 ? filtered : DB.ROLEPLAY_DB;
  }

  function getDetective() {
    const filtered = DB.DETECTIVE_DB.filter(
      (d) =>
        state.activeLessons.includes(d.lesson) &&
        (state.activePart === "ALL" || d.part === state.activePart)
    );
    return filtered.length > 0 ? filtered : DB.DETECTIVE_DB;
  }

  function toggleLesson(lessonId) {
    const idx = state.activeLessons.indexOf(lessonId);
    if (idx >= 0) {
      if (state.activeLessons.length === 1) return false;
      state.activeLessons.splice(idx, 1);
    } else {
      state.activeLessons.push(lessonId);
      state.activeLessons.sort((a, b) => a - b);
    }
    save();
    return true;
  }

  function setOnlyLesson(lessonId) {
    state.activeLessons = [lessonId];
    state.activePart = "ALL";
    save();
  }

  function setAllLessons() {
    state.activeLessons = [1, 2, 3, 4];
    state.activePart = "ALL";
    state.disabledWordIds.clear();
    save();
  }

  function setPartFilter(part) {
    state.activePart = part;
    save();
  }

  function toggleWordId(wordId) {
    if (state.disabledWordIds.has(wordId)) {
      state.disabledWordIds.delete(wordId);
    } else {
      state.disabledWordIds.add(wordId);
    }
    save();
  }

  function setAllWordsInScope(enabled) {
    const inScope = DB.VOCAB_DB.filter(
      (v) =>
        state.activeLessons.includes(v.lesson) &&
        (state.activePart === "ALL" || v.part === state.activePart)
    );
    inScope.forEach((v) => {
      if (enabled) state.disabledWordIds.delete(v.id);
      else state.disabledWordIds.add(v.id);
    });
    if (!enabled && inScope.length > 0) {
      state.disabledWordIds.delete(inScope[0].id);
      if (inScope[1]) state.disabledWordIds.delete(inScope[1].id);
    }
    save();
  }

  function completeComebackTask(taskId) {
    const t = state.comebackTasks.find((x) => x.id === taskId);
    if (t && !t.done) {
      t.done = true;
      if (state.comebackTasks.every((x) => x.done)) {
        state.comebackBroken = true;
      }
    }
  }

  function getScopeSummaryText() {
    const lText =
      state.activeLessons.length === 4
        ? "Bài 1–4"
        : "Bài " + state.activeLessons.join(", ");
    const pText =
      state.activePart === "ALL"
        ? ""
        : state.activePart === 1
        ? " • Nửa đầu"
        : " • Nửa sau";
    return `${lText}${pText} (${getBaseScopedVocab().length} từ)`;
  }

  load();

  return {
    state,
    save,
    getBaseScopedVocab,
    getVocab,
    setWordMastery,
    toggleBookmark,
    getMasteryCounts,
    getGrammar,
    getSentences,
    getRoleplay,
    getDetective,
    toggleLesson,
    setOnlyLesson,
    setAllLessons,
    setPartFilter,
    toggleWordId,
    setAllWordsInScope,
    completeComebackTask,
    getScopeSummaryText
  };
})();
