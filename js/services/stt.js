/**
 * ============================================================================
 * MODULE 4: SPEECH RECOGNITION & PRONUNCIATION GRADING ENGINE (zh-TW)
 * Real Web Speech API + MediaRecorder Playback + Character/Tone Evaluator
 * ============================================================================
 */
window.SpeechService = (function () {
  "use strict";

  const DB = window.CurriculumDB;
  const PUBLIC_HTTPS_URL = "https://hunghp2002.github.io/hoc-tieng-trung-phon-the/";
  const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  let recognizer = null;
  let isRecording = false;
  let sessionDone = true;
  let stopMode = "";
  let fatalError = false;
  let lastErrorMsg = "";
  let finalText = "";
  let interimText = "";
  let startMs = 0;
  let maxDurMs = 12000;
  let countdownTimer = null;
  let silenceTimer = null;

  // Audio playback & level meter
  let micStream = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedUrl = null;
  let audioCtx = null;
  let levelTimer = null;

  const ERROR_MESSAGES = {
    "not-allowed":
      "Trình duyệt hoặc khung xem trước đang chặn quyền Micro. Hãy bấm nút 'Mở ở tab riêng (HTTPS)' để cấp quyền Micro trực tiếp, hoặc bấm phím 🎤 Micro trên bàn phím (Win+H / bàn phím điện thoại) để nói vào ô chữ Hán.",
    "service-not-allowed":
      "Dịch vụ nhận diện giọng nói bị chặn trong khung nhúng. Hãy mở ứng dụng ở tab riêng (HTTPS) bằng Chrome, Edge hoặc Safari.",
    "no-speech":
      "Chưa nghe thấy giọng nói. Hãy đặt micro gần hơn và đọc to, rõ từng chữ Hán.",
    "audio-capture":
      "Không tìm thấy thiết bị Micro hoặc Micro đang bị ứng dụng khác sử dụng.",
    "network":
      "Lỗi kết nối mạng khi gọi dịch vụ nhận diện giọng nói zh-TW.",
    "language-not-supported":
      "Trình duyệt chưa hỗ trợ gói nhận diện tiếng Trung (zh-TW). Hãy dùng Chrome, Edge hoặc Safari.",
    "unsupported":
      "Trình duyệt này chưa hỗ trợ Web Speech API (ví dụ Firefox). Hãy mở bằng Chrome/Edge/Safari hoặc dùng phím 🎤 Micro của bàn phím để nói vào ô bên dưới."
  };

  function isEmbedded() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function onPublicSite() {
    try {
      return location.href.indexOf("hunghp2002.github.io") >= 0;
    } catch (e) {
      return false;
    }
  }

  function cleanHanzi(str) {
    return DB.toTraditional(str || "").replace(
      /[，。？！、；：「」『』（）()\s,.?!;:"'—…\-]/g,
      ""
    );
  }

  function stripTone(py) {
    if (!py) return "";
    return py
      .toLowerCase()
      .replace(/[āáǎà]/g, "a")
      .replace(/[ēéěè]/g, "e")
      .replace(/[īíǐì]/g, "i")
      .replace(/[ōóǒò]/g, "o")
      .replace(/[ūúǔù]/g, "u")
      .replace(/[ǖǘǚǜü]/g, "v")
      .replace(/[^a-zv]/g, "");
  }

  function areCharsNearSound(tChar, sChar) {
    if (!tChar || !sChar) return false;
    if (tChar === sChar) return true;
    for (const grp of DB.HOMOPHONE_GROUPS) {
      if (grp.includes(tChar) && grp.includes(sChar)) return true;
    }
    const py1 = stripTone(DB.CHAR_PINYIN_MAP[tChar] || "");
    const py2 = stripTone(DB.CHAR_PINYIN_MAP[sChar] || "");
    if (py1 && py2) {
      if (py1 === py2) return true;
      const n1 = py1.replace(/^zh/, "z").replace(/^ch/, "c").replace(/^sh/, "s").replace(/^r/, "l").replace(/^n/, "l").replace(/ng$/, "n");
      const n2 = py2.replace(/^zh/, "z").replace(/^ch/, "c").replace(/^sh/, "s").replace(/^r/, "l").replace(/^n/, "l").replace(/ng$/, "n");
      if (n1 === n2) return true;
    }
    return false;
  }

  function similarityToTarget(text, targetChars) {
    const s = Array.from(cleanHanzi(text));
    let hit = 0;
    const used = new Set();
    targetChars.forEach((ch) => {
      const idx = s.findIndex((c, k) => !used.has(k) && c === ch);
      if (idx >= 0) {
        used.add(idx);
        hit++;
      }
    });
    return hit - Math.max(0, s.length - targetChars.length) * 0.3;
  }

  function gradeSpeech(targetZh, spokenRaw, overrides = {}) {
    const spokenTrad = DB.toTraditional((spokenRaw || "").trim());
    if (!spokenTrad) return null;

    const targetChars = Array.from(cleanHanzi(targetZh));
    const spokenChars = Array.from(cleanHanzi(spokenTrad));
    const usedSpoken = new Set();

    let exactCount = 0;
    let nearCount = 0;
    let missingCount = 0;
    const charResults = [];
    const nearNotes = [];
    const missingNotes = [];

    targetChars.forEach((tChar, tIdx) => {
      const tPy = DB.CHAR_PINYIN_MAP[tChar] || "";
      let matchedIdx = -1;
      let status = "missing";
      let spokenFound = "";

      for (let offset = 0; offset <= 3; offset++) {
        for (const dir of [0, -1, 1]) {
          const cand = tIdx + dir * offset;
          if (cand >= 0 && cand < spokenChars.length && !usedSpoken.has(cand)) {
            if (spokenChars[cand] === tChar) {
              matchedIdx = cand;
              status = "exact";
              spokenFound = spokenChars[cand];
              break;
            }
          }
        }
        if (matchedIdx !== -1) break;
      }

      if (matchedIdx === -1) {
        for (let offset = 0; offset <= 2; offset++) {
          for (const dir of [0, -1, 1]) {
            const cand = tIdx + dir * offset;
            if (cand >= 0 && cand < spokenChars.length && !usedSpoken.has(cand)) {
              if (areCharsNearSound(tChar, spokenChars[cand])) {
                matchedIdx = cand;
                status = "near";
                spokenFound = spokenChars[cand];
                break;
              }
            }
          }
          if (matchedIdx !== -1) break;
        }
      }

      if (matchedIdx !== -1) usedSpoken.add(matchedIdx);

      if (overrides[tIdx]) {
        status = overrides[tIdx];
        if (status === "near" && (!spokenFound || spokenFound === tChar)) {
          const grp = DB.HOMOPHONE_GROUPS.find((g) => g.includes(tChar));
          spokenFound = grp ? grp.find((c) => c !== tChar) || tChar : "lệch thanh";
        }
      }

      if (status === "exact") {
        exactCount++;
        charResults.push({ idx: tIdx, target: tChar, py: tPy, status: "exact", spoken: tChar });
      } else if (status === "near") {
        nearCount++;
        const spkPy = DB.CHAR_PINYIN_MAP[spokenFound] || "lệch thanh";
        nearNotes.push(`『${tChar}』(${tPy}) nghe thành 『${spokenFound}』(${spkPy})`);
        charResults.push({ idx: tIdx, target: tChar, py: tPy, status: "near", spoken: spokenFound });
      } else {
        missingCount++;
        missingNotes.push(`『${tChar}』(${tPy || "—"})`);
        charResults.push({ idx: tIdx, target: tChar, py: tPy, status: "missing", spoken: "—" });
      }
    });

    const extraChars = spokenChars.filter((_, idx) => !usedSpoken.has(idx));
    const totalTarget = Math.max(1, targetChars.length);
    const charScore = Math.round(((exactCount + nearCount * 0.55) / totalTarget) * 100);
    const toneScore = Math.max(
      0,
      Math.min(100, Math.round(((exactCount + nearCount * 0.45) / totalTarget) * 100))
    );
    const penalty = Math.min(25, extraChars.length * 8 + missingCount * 10);
    const fluencyScore = Math.max(15, Math.min(100, Math.round(100 - penalty - nearCount * 6)));
    const totalScore = Math.max(
      0,
      Math.min(100, Math.round(charScore * 0.45 + toneScore * 0.35 + fluencyScore * 0.2))
    );

    return {
      spokenTrad,
      totalScore,
      charScore,
      toneScore,
      fluencyScore,
      exactCount,
      nearCount,
      missingCount,
      totalTarget,
      charResults,
      extraChars,
      nearNotes,
      missingNotes
    };
  }

  function releaseAudioResources() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (levelTimer) {
      clearInterval(levelTimer);
      levelTimer = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch (e) {}
    } else if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }
    micStream = null;
  }

  function startPlaybackCapture(stream, onLevel, onAudioReady) {
    micStream = stream;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && onLevel) {
        audioCtx = new Ctx();
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        levelTimer = setInterval(() => {
          analyser.getByteTimeDomainData(buf);
          let peak = 0;
          for (let i = 0; i < buf.length; i++) {
            peak = Math.max(peak, Math.abs(buf[i] - 128));
          }
          onLevel(Math.min(1, peak / 55));
        }, 75);
      }
    } catch (e) {}

    try {
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (audioChunks.length > 0) {
          const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
          if (recordedUrl) URL.revokeObjectURL(recordedUrl);
          recordedUrl = URL.createObjectURL(blob);
          if (onAudioReady) onAudioReady(recordedUrl);
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
    } catch (e) {}
  }

  function startRecording(callbacks) {
    const { targetZh, onStateChange, onLiveUpdate, onLevel, onAudioReady, onFinish, onError } =
      callbacks;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      lastErrorMsg = ERROR_MESSAGES.unsupported;
      if (onError) onError(lastErrorMsg, true);
      return;
    }

    const targetChars = Array.from(cleanHanzi(targetZh));
    finalText = "";
    interimText = "";
    lastErrorMsg = "";
    fatalError = false;
    stopMode = "";
    sessionDone = false;
    isRecording = true;
    startMs = Date.now();
    maxDurMs = Math.max(9000, Math.min(20000, targetChars.length * 1200 + 5000));

    if (onStateChange) onStateChange("starting", Math.round(maxDurMs / 1000));

    function finalize(shouldGrade) {
      if (sessionDone) return;
      sessionDone = true;
      isRecording = false;
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      releaseAudioResources();
      recognizer = null;
      const transcript = DB.toTraditional((finalText + interimText).trim());
      if (onFinish) onFinish({ shouldGrade, transcript, error: lastErrorMsg, fatalError });
    }

    try {
      recognizer = new SpeechRec();
      recognizer.lang = "zh-TW";
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 5;
      recognizer.continuous = !IS_MOBILE;

      recognizer.onstart = () => {
        if (onStateChange) onStateChange("listening", Math.round(maxDurMs / 1000));
        if (!IS_MOBILE && !micStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              if (!isRecording) {
                stream.getTracks().forEach((t) => t.stop());
                return;
              }
              startPlaybackCapture(stream, onLevel, onAudioReady);
            })
            .catch(() => {});
        }
      };

      recognizer.onresult = (event) => {
        let finals = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          let best = res[0].transcript;
          if (res.isFinal && res.length > 1) {
            let bestSc = -Infinity;
            for (let a = 0; a < res.length; a++) {
              const sc = similarityToTarget(res[a].transcript, targetChars);
              if (sc > bestSc) {
                bestSc = sc;
                best = res[a].transcript;
              }
            }
          }
          if (res.isFinal) finals += best;
          else interim += best;
        }
        if (finals) finalText = DB.toTraditional(finals);
        interimText = DB.toTraditional(interim);
        const live = DB.toTraditional((finalText + interimText).trim());
        if (onLiveUpdate) onLiveUpdate(live);

        const heard = Array.from(cleanHanzi(live));
        if (
          heard.length >= targetChars.length &&
          similarityToTarget(live, targetChars) >= targetChars.length - 0.5
        ) {
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => stopRecording(true), 450);
          return;
        }
        if (silenceTimer) clearTimeout(silenceTimer);
        if (live.length > 0) {
          silenceTimer = setTimeout(() => {
            if (isRecording) stopRecording(true);
          }, 2200);
        }
      };

      recognizer.onerror = (event) => {
        const code = event && event.error ? event.error : "unknown";
        if (code === "aborted" && stopMode) return;
        if (code === "no-speech" && !stopMode && Date.now() - startMs < maxDurMs - 1500) {
          return;
        }
        lastErrorMsg = ERROR_MESSAGES[code] || `Lỗi nhận diện: ${code}`;
        if (
          code === "not-allowed" ||
          code === "service-not-allowed" ||
          code === "audio-capture" ||
          code === "language-not-supported"
        ) {
          fatalError = true;
          if (onError) onError(lastErrorMsg, true);
        }
      };

      recognizer.onend = () => {
        if (sessionDone) return;
        const live = DB.toTraditional((finalText + interimText).trim());
        const withinTime = Date.now() - startMs < maxDurMs - 1000;
        if (isRecording && !stopMode && !fatalError && !live && withinTime) {
          try {
            recognizer.start();
            return;
          } catch (e) {}
        }
        finalize(stopMode !== "cancel");
      };

      recognizer.start();
    } catch (e) {
      fatalError = true;
      lastErrorMsg = `Không khởi động được Micro: ${e && e.message ? e.message : e}`;
      if (onError) onError(lastErrorMsg, true);
      finalize(false);
      return;
    }

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (!isRecording) return;
      const remain = Math.max(0, Math.ceil((maxDurMs - (Date.now() - startMs)) / 1000));
      if (onStateChange) onStateChange("tick", remain);
      if (remain <= 0) stopRecording(true);
    }, 300);
  }

  function stopRecording(shouldGrade = true) {
    if (!isRecording) return;
    stopMode = shouldGrade ? "grade" : "cancel";
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (recognizer) {
      try {
        if (shouldGrade) recognizer.stop();
        else recognizer.abort();
      } catch (e) {}
    }
  }

  function playLastRecording() {
    if (!recordedUrl) return;
    const audio = new Audio(recordedUrl);
    audio.play().catch(() => {});
  }

  return {
    PUBLIC_HTTPS_URL,
    isEmbedded,
    onPublicSite,
    cleanHanzi,
    gradeSpeech,
    startRecording,
    stopRecording,
    playLastRecording,
    getIsRecording: () => isRecording,
    getLastError: () => lastErrorMsg
  };
})();
