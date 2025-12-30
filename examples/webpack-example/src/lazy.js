// Lazy-loaded module
export function init() {
  console.log('Lazy module loaded!');
}

export function heavyComputation() {
  const data = [];
  for (let i = 0; i < 1000; i++) {
    data.push(Math.random());
  }
  return data.reduce((a, b) => a + b, 0) / data.length;
}
