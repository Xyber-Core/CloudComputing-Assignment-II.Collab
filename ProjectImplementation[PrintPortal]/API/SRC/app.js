const express = require('express');

const app = express();

app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'PrintPortal API'
    });
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found'
    });
});

module.exports = app;
