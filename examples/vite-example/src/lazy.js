// Lazy-loaded module
export function showMessage() {
  const output = document.querySelector('#output');
  if (output) {
    output.innerHTML += '<p>Lazy module loaded successfully! 🎉</p>';
  }
  console.log('Lazy module initialized');
}

export function complexCalculation() {
  const matrix = [];
  for (let i = 0; i < 50; i++) {
    matrix[i] = [];
    for (let j = 0; j < 50; j++) {
      matrix[i][j] = Math.random() * 100;
    }
  }
  return matrix.flat().reduce((a, b) => a + b, 0);
}
