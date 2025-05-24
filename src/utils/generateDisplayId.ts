// utils/generateDisplayId.ts

const ALPHANUMERIC = 'ABCDEFGHJKLMNPRSTUVWXYZ012345678'; // I Q O 9 を除外

export function generateDisplayId(length: number = 7): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ALPHANUMERIC.length);
    id += ALPHANUMERIC[index];
  }
  return id;
}
