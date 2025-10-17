# Bass Test Tool

An in-browser utility that helps you exercise and inspect the low-frequency response of your speakers or headphones. Adjust the oscillator, perform automated sweeps, and watch the waveform in real time to spot distortion or rattling artifacts.

## Features
- Interactive tone generator covering 20–200 Hz with live frequency readout.
- Smooth volume envelope to avoid harsh pops when starting or stopping playback.
- Multiple waveform types (sine, square, triangle, sawtooth) for varied stress tests.
- Automated 12-second bass sweep to surface cabinet or room resonance issues.
- Visual feedback via animated pulse meter and waveform oscilloscope.

## Quick Start
1. Clone the repository and open the project folder:
   ```bash
   git clone https://github.com/yannolaf/bass.git
   cd bass
   ```
2. Open `index.html` in a modern desktop browser (Chrome, Edge, Firefox, or Safari).
3. Keep your playback device volume low on first launch, then increase gradually.

## Usage Tips
- Start with a sine wave around 40–60 Hz to confirm the tone is clean before exploring deeper bass.
- Use the sweep button to catch rattles caused by room resonance or loose objects.
- Square or sawtooth waves introduce additional harmonics—handy for stress testing but louder at the same gain level.
- If you are using sensitive gear, lower the system volume before pressing Stop to avoid sudden level changes.

## Development
Project structure:
```
index.html  # UI markup and layout
style.css   # Glassmorphism-inspired styling and responsive tweaks
app.js      # Web Audio logic, UI bindings, and visualizer rendering
```

To modify styles or behavior, update the respective file and refresh the browser. No build steps are required.

## Roadmap Ideas
- Add quick frequency presets (e.g., 30 Hz, 45 Hz, 60 Hz).
- Provide keyboard shortcuts for toggling playback and changing waveforms.
- Package the tool as a lightweight desktop app (Electron/Tauri) for easier launching.

## License
Choose and add a license file (e.g., MIT, Apache 2.0) to clarify usage rights.
