import { capitalize } from '../utils/helpers.js';
import { factorial } from '../utils/math.js';

export function initAdvancedFeature() {
  console.log(capitalize('advanced feature loaded'));
  console.log('Factorial of 10:', factorial(10));

  // Some heavy computation to demonstrate lazy loading
  const data = generateLargeDataset();
  console.log('Generated dataset with', data.length, 'items');
}

function generateLargeDataset() {
  const dataset = [];
  for (let i = 0; i < 1000; i++) {
    dataset.push({
      id: i,
      value: Math.random() * 100,
      timestamp: Date.now(),
      metadata: {
        index: i,
        processed: false,
      },
    });
  }
  return dataset;
}

export function processData(data) {
  return data
    .filter(item => item.value > 50)
    .map(item => ({
      ...item,
      metadata: {
        ...item.metadata,
        processed: true,
      },
    }));
}
