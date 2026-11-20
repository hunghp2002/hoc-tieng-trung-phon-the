/**
 * ============================================================================
 * MODULE 2: SCOPE FILTER & PROGRESS STORE
 * Manages active lessons (1..4), half-lesson parts, individual words, and stats
 * ============================================================================
 */
window.AppStore = (function () {
  "use strict";

  const STORAGE_KEY = "tocfl_dangdai1_clean_state_v2";
  const DB = window.CurriculumDB;

  const state = {
    activeLessons: [1, 2, 3, 4],
    activePart: "ALL", // "ALL" | 1 | 2
    disabledWordIds: new Set(),
    voiceGender: "female", // "female" | "male" | "duet"
    voiceRate: 1.0,
    comebackDismissed: false,
    comebackBroken: false,
    comebackTasks: [
      { id: "t1", label: "Nghe & lật 2 thẻ từ vựng Phồn thể ở Bước 1", done: false },
      { id: "t2", label: "Hoàn thành 1 câu ghép hoặc dịch ở Bước 2", done: false },
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
          voiceGender: state.voiceGender,
          voiceRate: state.voiceRate
        })
      );
    } catch (e) {}
  }

  function getVocab() {
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
      if (state.activeLessons.length === 1) return false; // Must keep at least 1 lesson
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
      // Keep at least 2 words enabled
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
    return `${lText}${pText} (${getVocab().length} từ)`;
  }

  load();

  return {
    state,
    save,
    getVocab,
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
