import { greeting, formatDate } from './utils/helpers.js';
import { calculate } from './utils/math.js';

console.log('Rollup app started');
console.log(greeting('Bundle Badger'));
console.log('Today is:', formatDate(new Date()));

// Some calculation
const result = calculate([1, 2, 3, 4, 5]);
console.log('Calculation result:', result);

// Dynamic import for code splitting
const loadFeature = () => import('./features/advanced.js');

// Simulate user interaction
setTimeout(() => {
  loadFeature().then(module => {
    module.initAdvancedFeature();
  });
}, 1000);

// Export for potential library usage
export { greeting, formatDate, calculate };
