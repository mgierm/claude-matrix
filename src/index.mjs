#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { PtyManager } from './pty-manager.mjs';
import { ActivityDetector } from './activity-detector.mjs';
import { MatrixRenderer } from './matrix-renderer.mjs';
import { cursorShow, reset } from './ansi.mjs';

// If stdout is not a TTY (pipe mode), exec claude directly
if (!process.stdout.isTTY) {
  const claudePath = execFileSync('which', ['claude'], { encoding: 'utf8' }).trim();
  const { execFileSync: execSync } = await import('node:child_process');
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(claudePath, process.argv.slice(2), {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

const renderer = new MatrixRenderer(process.stdout);
const detector = new ActivityDetector();
const ptyManager = new PtyManager(renderer.matrixRows);

// Spawn Claude with all CLI args forwarded
const ptyProcess = ptyManager.spawn(process.argv.slice(2));

// Initialize renderer with current terminal size
const totalCols = process.stdout.columns || 80;
const totalRows = process.stdout.rows || 24;
renderer.resize(totalCols, totalRows);

// Forward PTY output to stdout and feed activity detector
ptyProcess.onData((data) => {
  process.stdout.write(data);
  if (ptyManager.matrixEnabled) {
    detector.onData();
  }
});

// Forward stdin to PTY
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data) => {
  // Tell detector user is typing - so PTY echo is ignored
  detector.onInput();
  // Forward everything including Ctrl+C (\x03) - Claude handles it
  ptyManager.write(data);
});

// Activity detection -> matrix animation
detector.on('active', () => {
  if (ptyManager.matrixEnabled) {
    renderer.start();
  }
});

detector.on('idle', () => {
  renderer.stop();
});

detector.start();

// Handle terminal resize
process.stdout.on('resize', () => {
  const cols = process.stdout.columns;
  const rows = process.stdout.rows;
  ptyManager.resize(cols, rows);
  renderer.resize(cols, rows);

  if (!ptyManager.matrixEnabled) {
    renderer.stop();
  }
});

// Cleanup on exit
function cleanup() {
  renderer.stop();
  detector.stop();
  process.stdout.write(reset + cursorShow);
  if (process.stdin.isTTY && process.stdin.isRaw) {
    process.stdin.setRawMode(false);
  }
}

ptyProcess.onExit(({ exitCode }) => {
  cleanup();
  process.exit(exitCode ?? 0);
});

process.on('SIGTERM', () => {
  cleanup();
  ptyManager.kill();
  process.exit(0);
});
