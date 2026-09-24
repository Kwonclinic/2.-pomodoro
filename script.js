const RING_CIRCUMFERENCE = 2 * Math.PI * 90;

const modeColors = {
  work: "#e07a5f",
  short: "#81b29a",
  long: "#3d5a80",
};

const modeLabels = {
  work: "Focus",
  short: "Short Break",
  long: "Long Break",
};

const els = {
  timeDisplay: document.getElementById("timeDisplay"),
  ringProgress: document.querySelector(".ring-progress"),
  startPauseBtn: document.getElementById("startPauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  modeBtns: document.querySelectorAll(".mode-btn"),
  sessionCount: document.getElementById("sessionCount"),
  sessionDots: document.getElementById("sessionDots"),
  workInput: document.getElementById("workInput"),
  shortInput: document.getElementById("shortInput"),
  longInput: document.getElementById("longInput"),
  cyclesInput: document.getElementById("cyclesInput"),
  autoStartInput: document.getElementById("autoStartInput"),
};

els.ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

const state = {
  mode: "work",
  secondsLeft: 25 * 60,
  totalSeconds: 25 * 60,
  isRunning: false,
  completedWork: 0,
  intervalId: null,
};

function durationFor(mode) {
  const minutes =
    mode === "work"
      ? Number(els.workInput.value)
      : mode === "short"
      ? Number(els.shortInput.value)
      : Number(els.longInput.value);
  return Math.max(1, minutes) * 60;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateDisplay() {
  els.timeDisplay.textContent = formatTime(state.secondsLeft);
  const progress = 1 - state.secondsLeft / state.totalSeconds;
  els.ringProgress.style.strokeDashoffset = String(
    RING_CIRCUMFERENCE * (1 - progress)
  );
  document.title = `${formatTime(state.secondsLeft)} · ${modeLabels[state.mode]}`;
}

function renderDots() {
  const cycles = Math.max(1, Number(els.cyclesInput.value));
  const posInCycle = state.completedWork % cycles;
  els.sessionDots.innerHTML = "";
  for (let i = 0; i < cycles; i++) {
    const dot = document.createElement("span");
    dot.className = "dot" + (i < posInCycle ? " filled" : "");
    els.sessionDots.appendChild(dot);
  }
  els.sessionCount.textContent = `Session ${state.completedWork + 1}`;
}

function setMode(mode, { autoStart = false } = {}) {
  clearInterval(state.intervalId);
  state.isRunning = false;
  state.mode = mode;
  state.totalSeconds = durationFor(mode);
  state.secondsLeft = state.totalSeconds;

  document.documentElement.style.setProperty("--accent", modeColors[mode]);
  els.modeBtns.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.mode === mode)
  );
  els.startPauseBtn.textContent = "Start";
  updateDisplay();
  renderDots();

  if (autoStart) {
    startTimer();
  }
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.4);
    });
  } catch (e) {
    /* audio unsupported */
  }
}

function handleSessionEnd() {
  playChime();
  const cycles = Math.max(1, Number(els.cyclesInput.value));

  if (state.mode === "work") {
    state.completedWork += 1;
    const nextMode = state.completedWork % cycles === 0 ? "long" : "short";
    setMode(nextMode, { autoStart: els.autoStartInput.checked });
  } else {
    setMode("work", { autoStart: els.autoStartInput.checked });
  }
}

function tick() {
  state.secondsLeft -= 1;
  updateDisplay();
  if (state.secondsLeft <= 0) {
    handleSessionEnd();
  }
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  els.startPauseBtn.textContent = "Pause";
  state.intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  els.startPauseBtn.textContent = "Start";
  clearInterval(state.intervalId);
}

els.startPauseBtn.addEventListener("click", () => {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

els.resetBtn.addEventListener("click", () => {
  setMode(state.mode);
});

els.modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

[els.workInput, els.shortInput, els.longInput, els.cyclesInput].forEach(
  (input) => {
    input.addEventListener("change", () => {
      if (!state.isRunning) {
        setMode(state.mode);
      } else {
        renderDots();
      }
    });
  }
);

setMode("work");
