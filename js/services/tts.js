/**
 * ============================================================================
 * MODULE 3: TAIWANESE MANDARIN VOICE ENGINE (zh-TW)
 * Supports Female (雅婷), Male (雲哲), Duet (Song thanh), and completion callbacks
 * for Shadowing Mode & Hands-Free Auto-Play.
 * ============================================================================
 */
window.VoiceService = (function () {
  "use strict";

  const Store = window.AppStore;
  let cachedVoices = [];

  function refreshVoices() {
    try {
      if (window.speechSynthesis) {
        cachedVoices = window.speechSynthesis.getVoices() || [];
      }
    } catch (e) {}
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function pickVoice(gender) {
    if (!cachedVoices.length) refreshVoices();
    const zhVoices = cachedVoices.filter((v) => /zh|cmn|chinese/i.test(v.lang + " " + v.name));
    const twVoices = zhVoices.filter((v) => /TW|Taiwan|Hant/i.test(v.lang + " " + v.name));
    const pool = twVoices.length ? twVoices : zhVoices;
    if (!pool.length) return null;

    if (gender === "male") {
      return (
        pool.find((v) => /YunJhe|Kangkang|Male|Danny|Zhiwei|雲哲/i.test(v.name)) ||
        pool[pool.length - 1]
      );
    }
    return (
      pool.find((v) => /Yating|HsiaoChen|Meijia|Hanhan|Female|雅婷|曉臻/i.test(v.name)) ||
      pool[0]
    );
  }

  function speakSingle(text, gender, rateOverride, onDone) {
    if (!text || !window.speechSynthesis) {
      if (onDone) setTimeout(onDone, 300);
      return;
    }
    try {
      let called = false;
      const finish = () => {
        if (called) return;
        called = true;
        if (onDone) onDone();
      };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-TW";
      const v = pickVoice(gender);
      if (v) u.voice = v;
      u.rate = rateOverride || Store.state.voiceRate || 1.0;
      u.pitch = gender === "male" ? 0.84 : 1.08;
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
      // Fallback timer in case browser speechSynthesis doesn't fire onend
      const estMs = Math.max(1400, text.length * 360);
      setTimeout(finish, estMs + 800);
    } catch (e) {
      if (onDone) setTimeout(onDone, 300);
    }
  }

  function speak(text, modeOverride, rateOverride, onDone) {
    if (!text) {
      if (onDone) onDone();
      return;
    }
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}

    const mode = modeOverride || Store.state.voiceGender || "female";
    if (mode === "duet") {
      speakSingle(text, "female", rateOverride, () => {
        setTimeout(() => speakSingle(text, "male", rateOverride, onDone), 220);
      });
    } else {
      speakSingle(text, mode, rateOverride, onDone);
    }
  }

  function playEffect(type) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(175, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
      setTimeout(() => {
        try { ctx.close(); } catch (e) {}
      }, 450);
    } catch (e) {}
  }

  return {
    speak,
    playEffect
  };
})();
