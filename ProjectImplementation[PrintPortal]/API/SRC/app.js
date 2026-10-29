const express = require('express');
const path = require('node:path');

const app = express();

app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'PrintPortal API'
    });
});

// Serve the frontend HTML, CSS and JavaScript
const frontendPath = path.join(__dirname, '../../Frontend/Public');

app.use(express.static(frontendPath));

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found'
    });
});

module.exports = app;
