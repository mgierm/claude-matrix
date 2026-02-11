import * as pty from 'node-pty';
import { execFileSync } from 'node:child_process';

const MIN_ROWS_FOR_MATRIX = 25;

function findClaude() {
  try {
    return execFileSync('which', ['claude'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('Could not find "claude" in PATH. Is Claude Code installed?');
  }
}

export class PtyManager {
  #ptyProcess;
  #matrixRows;

  constructor(matrixRows) {
    this.#matrixRows = matrixRows;
  }

  get matrixEnabled() {
    return process.stdout.rows >= MIN_ROWS_FOR_MATRIX;
  }

  #effectiveRows(totalRows) {
    return totalRows >= MIN_ROWS_FOR_MATRIX
      ? totalRows - this.#matrixRows
      : totalRows;
  }

  spawn(args) {
    const claudePath = findClaude();
    const totalRows = process.stdout.rows || 24;
    const totalCols = process.stdout.columns || 80;

    this.#ptyProcess = pty.spawn(claudePath, args, {
      name: 'xterm-256color',
      rows: this.#effectiveRows(totalRows),
      cols: totalCols,
      env: process.env,
    });

    return this.#ptyProcess;
  }

  resize(totalCols, totalRows) {
    if (this.#ptyProcess) {
      try {
        this.#ptyProcess.resize(
          totalCols,
          this.#effectiveRows(totalRows),
        );
      } catch {
        // PTY may already be dead
      }
    }
  }

  write(data) {
    if (this.#ptyProcess) {
      this.#ptyProcess.write(data);
    }
  }

  kill() {
    if (this.#ptyProcess) {
      try {
        this.#ptyProcess.kill();
      } catch {
        // Already dead
      }
    }
  }
}
