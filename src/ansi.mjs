const ESC = '\x1b';
const CSI = `${ESC}[`;

export const cursorTo = (row, col) => `${CSI}${row};${col}H`;
export const cursorSave = `${ESC}7`;
export const cursorRestore = `${ESC}8`;
export const cursorHide = `${CSI}?25l`;
export const cursorShow = `${CSI}?25h`;
export const eraseLine = `${CSI}2K`;
export const reset = `${CSI}0m`;

// 256-color palette
export const brightWhite = `${CSI}1;38;5;15m`;
export const brightGreen = `${CSI}38;5;46m`;
export const medGreen = `${CSI}38;5;34m`;
export const darkGreen = `${CSI}38;5;22m`;
export const dimGreen = `${CSI}2;38;5;28m`;
export const bgBlack = `${CSI}48;5;0m`;
