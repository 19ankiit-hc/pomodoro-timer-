/* ══════════════════════════════════════════
   POMODORO TIMER  —  script.js
   2 min focus / 1 min break with alerts
   ══════════════════════════════════════════ */

/* ── 1. Settings ───────────────────────── */
const FOCUS_SECS = 25 * 60;    // 2 minutes
const BREAK_SECS = 5 * 60;    // 1 minute
const RING_CIRC  = 753.98;    // 2 × π × 120

/* ── 2. State ──────────────────────────── */
let mode           = "focus";
let totalSecs      = FOCUS_SECS;
let remaining      = FOCUS_SECS;
let running        = false;
let intervalId     = null;
let pomodorosToday = 0;
let focusMinutes   = 0;
let toastTimer     = null;

/* ── 3. DOM Elements ───────────────────── */
const timeDigits   = document.getElementById("time-digits");
const timeStatus   = document.getElementById("time-status");
const ringProg     = document.getElementById("ring-prog");
const sessionLabel = document.getElementById("session-label");
const btnStart     = document.getElementById("btn-start");
const btnPause     = document.getElementById("btn-pause");
const tabStudy     = document.getElementById("tab-study");
const tabBreak     = document.getElementById("tab-break");
const statCount    = document.getElementById("stat-count");
const statTime     = document.getElementById("stat-time");
const toast        = document.getElementById("toast");
const toastText    = document.getElementById("toast-text");

/* ── 4. Helpers ────────────────────────── */

function toMMSS(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateRing(secs) {
  const fraction = secs / totalSecs;
  ringProg.style.strokeDashoffset = RING_CIRC * (1 - fraction);
}

function showToast(msg) {
  toastText.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

/* Play a beep using Web Audio API */
function playBeep(freq, duration) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* blocked — skip */ }
}

/* Play a 3-beep alarm */
function playAlarm(type) {
  const freq = type === "break" ? 880 : 660;
  playBeep(freq, 0.4);
  setTimeout(() => playBeep(freq, 0.4), 500);
  setTimeout(() => playBeep(freq, 0.6), 1000);
}

function updateStats() {
  statCount.textContent = pomodorosToday;
  statTime.textContent  = (pomodorosToday * 25) + "m";  // 2 min per session
}

/* ── 5. Mode Switch ────────────────────── */
function switchMode(newMode) {
  clearInterval(intervalId);
  running = false;

  mode      = newMode;
  totalSecs = mode === "focus" ? FOCUS_SECS : BREAK_SECS;
  remaining = totalSecs;

  tabStudy.classList.toggle("active", mode === "focus");
  tabBreak.classList.toggle("active", mode === "break");
  sessionLabel.textContent = mode === "focus" ? "STUDY SESSION" : "BREAK SESSION";

  timeDigits.textContent = toMMSS(remaining);
  timeStatus.textContent = "Ready";
  updateRing(remaining);

  btnStart.disabled = false;
  btnPause.disabled = true;
}

/* ── 6. Timer Controls ─────────────────── */
function startTimer() {
  if (running) return;
  running = true;
  timeStatus.textContent = mode === "focus" ? "Focusing…" : "On break…";
  btnStart.disabled = true;
  btnPause.disabled = false;
  intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!running) return;
  clearInterval(intervalId);
  running = false;
  timeStatus.textContent = "Paused";
  btnStart.disabled = false;
  btnPause.disabled = true;
}

function resetTimer() {
  clearInterval(intervalId);
  running   = false;
  remaining = totalSecs;
  timeDigits.textContent = toMMSS(remaining);
  timeStatus.textContent = "Ready";
  updateRing(remaining);
  btnStart.disabled = false;
  btnPause.disabled = true;
}

/* ── 7. Tick ────────────────────────────── */
function tick() {
  if (remaining <= 0) {
    clearInterval(intervalId);
    running = false;
    handleSessionEnd();
    return;
  }
  remaining--;
  timeDigits.textContent = toMMSS(remaining);
  updateRing(remaining);
}

/* ── 8. Session End — alarm + confirm ───── */
function handleSessionEnd() {
  timeDigits.textContent = "00:00";
  updateRing(0);
  btnStart.disabled = false;
  btnPause.disabled = true;

  if (mode === "focus") {
    /* ── Focus session finished ─────────────
       1. Count the pomodoro
       2. Play alarm
       3. Show alert — wait for OK
       4. Switch to break and auto-start      */
    pomodorosToday++;
    updateStats();

    playAlarm("break");

    // Small delay so the beep plays before the alert blocks the thread
    setTimeout(() => {
      alert("☕ Break Time!\n\nGreat work! Your 2-minute focus session is complete.\nClick OK to start your 1-minute break.");
      switchMode("break");
      startTimer();          // auto-start break countdown
    }, 400);

  } else {
    /* ── Break session finished ─────────────
       1. Play alarm
       2. Show alert — wait for OK
       3. Switch back to focus (don't auto-start — let user click Start) */
    playAlarm("focus");

    setTimeout(() => {
      alert("📚 Study Time!\n\nBreak is over. Time to focus again!\nClick OK to get back to work.");
      switchMode("focus");   // reset to focus, user clicks Start when ready
    }, 400);
  }
}

/* ── 9. Init ────────────────────────────── */
(function init() {
  timeDigits.textContent = toMMSS(remaining);
  updateRing(remaining);
  btnPause.disabled = true;
  updateStats();
})();
