import './style.css';
import { createGreeting } from './vendor.js';

console.log('Vite app initialized');

const app = document.querySelector('#app');
const output = document.querySelector('#output');

output.innerHTML = createGreeting('Bundle Badger');

// Dynamic import for code splitting
document.querySelector('#loadLazy')?.addEventListener('click', async () => {
  const lazy = await import('./lazy.js');
  lazy.showMessage();
});

// Some example logic to create bundle size
function processData(items) {
  return items
    .filter(x => x > 0)
    .map(x => x * 2)
    .reduce((a, b) => a + b, 0);
}

const sampleData = Array.from({ length: 100 }, (_, i) => i);
console.log('Processed:', processData(sampleData));
