// Example webpack application
console.log('Hello from webpack!');

// Simulate some code to create a meaningful bundle
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function greet(name) {
  return `Hello, ${name}!`;
}

export { fibonacci, greet };

// Dynamic import for code splitting
const loadLazy = () => import('./lazy.js');

document.addEventListener('DOMContentLoaded', () => {
  console.log(greet('Bundle Badger'));
  console.log('Fibonacci(10):', fibonacci(10));

  setTimeout(() => {
    loadLazy().then(module => {
      module.init();
    });
  }, 1000);
});
