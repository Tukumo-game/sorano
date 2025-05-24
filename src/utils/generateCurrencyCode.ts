// Q, I, O, 9 を除外した文字セット
const CHAR_SET = 'ABCDEFGHJKLMNPRSTUVWXYZ012345678';

function getRandomChar() {
  return CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
}

export async function generateUniqueCurrencyCode(
  checkExists: (code: string) => Promise<boolean>
): Promise<string> {
  while (true) {
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += getRandomChar();
    }

    const exists = await checkExists(code);
    if (!exists) return code;
  }
}
