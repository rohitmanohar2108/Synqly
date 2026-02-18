const { io } = require('socket.io-client');

const times = [];

function testConnection(index) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = io('http://localhost:8000', {
      transports: ['websocket'],
      reconnectionAttempts: 1
    });
    
    socket.on('connect', () => {
      const elapsed = Date.now() - start;
      times.push(elapsed);
      console.log(`Connection ${index + 1}: ${elapsed}ms`);
      socket.close();
      resolve();
    });
    
    socket.on('connect_error', (err) => {
      console.error(`Connection ${index + 1} failed: ${err.message}`);
      resolve();
    });
    
    setTimeout(() => {
      socket.close();
      console.error(`Connection ${index + 1} timeout`);
      resolve();
    }, 5000);
  });
}

async function runTests() {
  for (let i = 0; i < 5; i++) {
    await testConnection(i);
  }
  
  if (times.length > 0) {
    const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`\nSummary (${times.length} successful connections):`);
    console.log(`Average: ${avg}ms`);
    console.log(`Min: ${min}ms`);
    console.log(`Max: ${max}ms`);
  }
  process.exit(0);
}

runTests();
