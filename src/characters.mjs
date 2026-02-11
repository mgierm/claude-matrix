// Half-width katakana (single-column width)
const KATAKANA = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
const DIGITS = '0123456789';
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const POOL = KATAKANA + DIGITS + LATIN;

export function randomChar() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}
