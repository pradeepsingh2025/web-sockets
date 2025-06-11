function getNumberColor(num) {
  if (num === 0) return 'violet';
  if ([1, 3, 7, 9].includes(num)) return 'green';
  if ([2, 4, 6, 8].includes(num)) return 'red';
  return 'violet';
}

function getNumberSize(num) {
  return num >= 5 ? 'big' : 'small';
}

function generateRandomNumber() {
  return Math.floor(Math.random() * 10); // 0-9
}

module.exports = {
  getNumberColor,
  getNumberSize,
  generateRandomNumber
};