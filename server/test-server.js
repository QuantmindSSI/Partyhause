import express from 'express';

const app = express();
const port = 3001;

app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Test server running at http://localhost:${port}`);
  console.log(`✅ Press Ctrl+C to stop`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

console.log('📝 Server script loaded successfully');
