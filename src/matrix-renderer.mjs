import {
  cursorTo, cursorSave, cursorRestore,
  cursorHide, cursorShow,
  eraseLine, reset, bgBlack,
  brightWhite, brightGreen, medGreen, dimGreen, darkGreen,
} from './ansi.mjs';
import { randomChar } from './characters.mjs';

const MATRIX_ROWS = 15;
const FRAME_INTERVAL = 60; // ~16fps
const SPAWN_CHANCE = 0.03; // 3% per column per tick

// Gradient from head (index 0) to tail
const GRADIENT = [brightWhite, brightGreen, medGreen, dimGreen, darkGreen];

function colorForOffset(offset, length) {
  if (offset === 0) return GRADIENT[0]; // head is always bright white+bold
  const idx = Math.min(
    Math.floor((offset / length) * (GRADIENT.length - 1)) + 1,
    GRADIENT.length - 1,
  );
  return GRADIENT[idx];
}

function createDrop() {
  return {
    y: 0,
    speed: 1 + Math.floor(Math.random() * 3), // 1-3
    length: 5 + Math.floor(Math.random() * 8), // 5-12
    chars: [],
    active: false,
    tick: 0,
  };
}

export class MatrixRenderer {
  #cols = 0;
  #totalRows = 0;
  #drops = [];
  #interval = null;
  #running = false;
  #stream;

  constructor(stream) {
    this.#stream = stream;
  }

  get matrixRows() {
    return MATRIX_ROWS;
  }

  resize(cols, totalRows) {
    this.#cols = cols;
    this.#totalRows = totalRows;

    // Adjust drops array to match column count
    while (this.#drops.length < cols) {
      this.#drops.push(createDrop());
    }
    this.#drops.length = cols;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#interval = setInterval(() => this.#frame(), FRAME_INTERVAL);
  }

  stop() {
    if (!this.#running) return;
    this.#running = false;
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
    this.#clear();
  }

  #clear() {
    const startRow = this.#totalRows - MATRIX_ROWS + 1;
    let buf = cursorSave + cursorHide;
    for (let r = 0; r < MATRIX_ROWS; r++) {
      buf += cursorTo(startRow + r, 1) + eraseLine;
    }
    buf += reset + cursorRestore + cursorShow;
    this.#stream.write(buf);

    // Reset all drops
    for (let i = 0; i < this.#drops.length; i++) {
      this.#drops[i] = createDrop();
    }
  }

  #frame() {
    if (!this.#running) return;

    const startRow = this.#totalRows - MATRIX_ROWS + 1;
    // Build a 2D buffer: [row][col] = { char, color }
    const grid = Array.from({ length: MATRIX_ROWS }, () =>
      new Array(this.#cols).fill(null),
    );

    // Update and render each drop
    for (let col = 0; col < this.#cols; col++) {
      const drop = this.#drops[col];

      if (!drop.active) {
        // Chance to spawn
        if (Math.random() < SPAWN_CHANCE) {
          drop.active = true;
          drop.y = 0;
          drop.tick = 0;
          drop.speed = 1 + Math.floor(Math.random() * 3);
          drop.length = 3 + Math.floor(Math.random() * 4);
          drop.chars = [];
        }
        continue;
      }

      // Advance on tick
      drop.tick++;
      if (drop.tick >= drop.speed) {
        drop.tick = 0;
        drop.y++;
        drop.chars.unshift(randomChar());
        if (drop.chars.length > drop.length) {
          drop.chars.pop();
        }
      }

      // Draw the drop's visible characters onto grid
      for (let i = 0; i < drop.chars.length; i++) {
        const row = drop.y - i;
        if (row >= 0 && row < MATRIX_ROWS) {
          grid[row][col] = {
            char: drop.chars[i],
            color: colorForOffset(i, drop.length),
          };
        }
      }

      // Deactivate if tail has fully passed below the matrix area
      if (drop.y - drop.length >= MATRIX_ROWS) {
        drop.active = false;
      }
    }

    // Build output buffer
    let buf = cursorSave + cursorHide;

    for (let r = 0; r < MATRIX_ROWS; r++) {
      buf += cursorTo(startRow + r, 1) + bgBlack;
      for (let c = 0; c < this.#cols; c++) {
        const cell = grid[r][c];
        if (cell) {
          buf += cell.color + cell.char;
        } else {
          buf += ' ';
        }
      }
      buf += reset;
    }

    buf += cursorRestore + cursorShow;
    this.#stream.write(buf);
  }
}
