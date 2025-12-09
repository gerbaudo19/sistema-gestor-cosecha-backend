export function generateCode() {
  // código legible corto: 6 caracteres alfanumérico
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) res += chars[Math.floor(Math.random() * chars.length)];
  return res;
}
