import { EventEmitter } from 'node:events';

const IDLE_THRESHOLD = 1000; // ms without output before considered idle
const CHECK_INTERVAL = 200; // ms between idle checks
const INPUT_COOLDOWN = 150; // ms to ignore PTY output after user keystroke

export class ActivityDetector extends EventEmitter {
  #lastDataTime = 0;
  #lastInputTime = 0;
  #isActive = false;
  #interval = null;

  start() {
    this.#interval = setInterval(() => {
      if (this.#isActive && Date.now() - this.#lastDataTime > IDLE_THRESHOLD) {
        this.#isActive = false;
        this.emit('idle');
      }
    }, CHECK_INTERVAL);
  }

  // Called when user types (stdin data)
  onInput() {
    this.#lastInputTime = Date.now();
  }

  // Called when PTY produces output
  onData() {
    const now = Date.now();

    // Ignore output that's likely just echo of user keystrokes
    if (now - this.#lastInputTime < INPUT_COOLDOWN) {
      return;
    }

    this.#lastDataTime = now;
    if (!this.#isActive) {
      this.#isActive = true;
      this.emit('active');
    }
  }

  stop() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }
}
