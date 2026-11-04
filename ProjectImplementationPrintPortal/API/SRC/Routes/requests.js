const express = require('express');
const router = express.Router();

// Temporary example data
const requests = [];

router.get('/', (req, res) => {
    res.status(200).json(requests);
});

router.post('/', (req, res) => {
    const request = {
        id: Date.now().toString(),
        userId: req.headers['x-user-id'],
        ...req.body
    };

    requests.push(request);

    res.status(201).json(request);
});

module.exports = router;