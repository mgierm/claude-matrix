# claude-matrix

> **Note:** This is a proof of concept generated entirely by Claude Code.

Matrix rain animation wrapper for Claude Code. Displays a Matrix-style falling character animation in the bottom 6 rows of your terminal while Claude is working.

<video src="https://github.com/user-attachments/assets/cb99e9f6-18fb-4c40-ba66-d198213ee6d9" controls></video>

```
┌──────────────────────────────────────┐
│  Claude Code renders here            │
│  (PTY with reduced height)           │
│                                      │
├──────────────────────────────────────┤
│  ░░▓ Matrix Rain (6 rows) ▓░░       │
│  ﾊ 3 ﾐ   ｳ   ﾏ 7 ﾗ   ﾇ   ｹ       │
│    ﾋ   ｼ ﾓ     ｹ   ｾ ﾍ   ﾑ       │
└──────────────────────────────────────┘
```

## How it works

- Spawns `claude` in a pseudo-terminal (PTY) with height reduced by 6 rows
- Renders Matrix rain animation in the reserved bottom rows
- Animation appears when Claude is actively producing output
- Animation disappears when Claude is waiting for user input
- If terminal is too small (<10 rows), animation is disabled automatically

## Install

```bash
cd claude-matrix
npm install
npm link
```

## Usage

```bash
claude-matrix           # interactive session
claude-matrix -p "hi"   # non-interactive, with animation
claude-matrix -p "hi" | grep something   # pipe mode, no animation
```

## Requirements

- Node.js >= 18
- Claude Code (`claude`) installed and available in PATH
- A terminal emulator with 256-color support
