// Simulated vendor code that would be split into its own chunk
export function createGreeting(name) {
  return `<p>Hello, ${name}! This is from the vendor chunk.</p>`;
}

export function utilityFunction(data) {
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now(),
  }));
}

export const constants = {
  APP_NAME: 'Vite Example',
  VERSION: '1.0.0',
  API_URL: 'https://api.example.com',
};
