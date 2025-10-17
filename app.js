const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 200;

const frequencySlider = document.getElementById("frequency");
const volumeSlider = document.getElementById("volume");
const waveformSelect = document.getElementById("waveform");
const toggleButton = document.getElementById("toggle");
const sweepButton = document.getElementById("sweep");
const frequencyValue = document.getElementById("frequencyValue");
const volumeValue = document.getElementById("volumeValue");
const pulse = document.getElementById("pulse");
const canvas = document.getElementById("visualizer");
const canvasContext = canvas.getContext("2d");

let audioContext;
let oscillator;
let gainNode;
let analyser;
let animationFrame;
let lastDraw = 0;
let sweepActive = false;
let targetVolume = Number(volumeSlider.value) / 100;

const VOLUME_RAMP = 0.08;

const ensureAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  return audioContext;
};

const isPlaying = () => Boolean(oscillator);

const updateFrequencyLabel = (value) => {
  frequencyValue.textContent = `${Math.round(value)} Hz`;
};

const updateVolumeLabel = (value) => {
  const clamped = Math.min(Math.max(value, 0), 1);
  volumeValue.textContent = `${Math.round(clamped * 100)}%`;
};

const setFrequency = (value) => {
  const numericValue = Number(value);
  updateFrequencyLabel(numericValue);
  if (oscillator) {
    oscillator.frequency.setValueAtTime(numericValue, audioContext.currentTime);
  }
};

const setVolume = (value) => {
  const normalized = Number(value) / 100;
  targetVolume = normalized;
  updateVolumeLabel(normalized);
  if (gainNode && audioContext) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(normalized, now, VOLUME_RAMP);
  }
};

const setWaveform = (type) => {
  if (oscillator) {
    oscillator.type = type;
  }
};

const clearAudioGraph = () => {
  if (oscillator) {
    oscillator.onended = null;
    oscillator.disconnect();
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }
  sweepActive = false;
};

const stopTone = () => {
  if (!oscillator || !audioContext) {
    return;
  }
  const now = audioContext.currentTime;
  if (gainNode) {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, VOLUME_RAMP);
  }
  toggleButton.textContent = "Stopping...";
  sweepActive = false;

  const oscRef = oscillator;
  setTimeout(() => {
    if (oscillator === oscRef) {
      oscRef.stop();
    }
  }, 200);
};

const startTone = async () => {
  await ensureAudioContext();
  if (oscillator) {
    return;
  }

  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);

  setFrequency(frequencySlider.value);
  setVolume(volumeSlider.value);
  setWaveform(waveformSelect.value);

  oscillator.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  oscillator.onended = () => {
    clearAudioGraph();
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    pulse.style.transform = "scale(1)";
    toggleButton.textContent = "Start Tone";
  };

  oscillator.start();
  toggleButton.textContent = "Stop Tone";
  drawFrame();
};

const drawFrame = (timestamp = 0) => {
  if (!analyser) {
    return;
  }

  animationFrame = requestAnimationFrame(drawFrame);

  // Limit redraw rate for the canvas to ~60 fps
  if (timestamp - lastDraw < 16) {
    return;
  }
  lastDraw = timestamp;

  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  // Calculate average deviation from center to drive the pulse animation.
  const average =
    dataArray.reduce((acc, value) => {
      const normalized = value / 128 - 1;
      return acc + Math.abs(normalized);
    }, 0) / bufferLength;

  const pulseScale = 1 + Math.min(average * 3, 0.7);
  pulse.style.transform = `scale(${pulseScale.toFixed(3)})`;

  // Update the frequency label during sweeps so the UI mirrors the tone.
  if (oscillator && gainNode) {
    updateFrequencyLabel(oscillator.frequency.value);
    updateVolumeLabel(gainNode.gain.value);
  }

  // Draw waveform
  canvasContext.fillStyle = "rgba(15, 23, 42, 0.9)";
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = "#38bdf8";
  canvasContext.beginPath();

  const sliceWidth = (canvas.width * 1.0) / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i += 1) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
    x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height / 2);
  canvasContext.stroke();
};

const runSweep = async () => {
  await startTone();
  if (!oscillator) {
    return;
  }

  const duration = 12; // seconds
  const halfDuration = duration / 2;
  const now = audioContext.currentTime;
  sweepActive = true;

  oscillator.frequency.cancelScheduledValues(now);
  oscillator.frequency.setValueAtTime(MIN_FREQUENCY, now);
  oscillator.frequency.linearRampToValueAtTime(MAX_FREQUENCY, now + halfDuration);
  oscillator.frequency.linearRampToValueAtTime(MIN_FREQUENCY, now + duration);

  // Keep slider UI synced while sweep is active.
  const sweepUpdate = () => {
    if (!sweepActive || !oscillator) {
      return;
    }
    const currentFrequency = oscillator.frequency.value;
    frequencySlider.value = currentFrequency;
    updateFrequencyLabel(currentFrequency);
    requestAnimationFrame(sweepUpdate);
  };
  sweepUpdate();

  // Stop tracking sweep after it finishes.
  setTimeout(() => {
    sweepActive = false;
  }, duration * 1000);
};

// Event handlers
toggleButton.addEventListener("click", async () => {
  if (isPlaying()) {
    stopTone();
  } else {
    await startTone();
  }
});

sweepButton.addEventListener("click", runSweep);

frequencySlider.addEventListener("input", (event) => {
  sweepActive = false;
  setFrequency(event.target.value);
});

volumeSlider.addEventListener("input", (event) => {
  setVolume(event.target.value);
});

waveformSelect.addEventListener("change", (event) => {
  setWaveform(event.target.value);
});

// Initialize labels on load for clarity.
updateFrequencyLabel(frequencySlider.value);
updateVolumeLabel(targetVolume);
