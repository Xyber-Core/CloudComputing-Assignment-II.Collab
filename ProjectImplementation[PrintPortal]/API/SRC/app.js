
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const app = express();

app.use(express.json());

// Configuration
const frontendPath = path.join(__dirname, '../../Frontend/Public');
const dataPath = path.join(__dirname, '../Data/requests.json');

const statuses = ['Submitted', 'Assigned', 'In Progress', 'Completed'];
const categories = ['Posters', 'Flyers', 'Booklets'];
const priorities = ['Low', 'Normal', 'High'];
const staff = ['Aroha Ngata', 'Sam Patel', 'Leilani Fono'];

// Initialise storage
fs.mkdirSync(path.dirname(dataPath), { recursive: true });

if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
}

function readRequests() {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveRequests(requests) {
    fs.writeFileSync(dataPath, JSON.stringify(requests, null, 2));
}

// Demo identity from the frontend
function getUser(req, res, next) {
    const userId = req.get('X-User-Id');

    const users = {
        'customer-a': 'Customer',
        'customer-b': 'Customer',
        coordinator: 'Coordinator'
    };

    if (!userId || !users[userId]) {
        return res.status(401).json({ error: 'Invalid user.' });
    }

    req.user = {
        id: userId,
        role: users[userId]
    };

    next();
}

function canAccess(request, user) {
    return user.role === 'Coordinator' ||
        request.customerId === user.id;
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'PrintPortal API'
    });
});

// Retrieve requests
app.get('/api/requests', getUser, (req, res) => {
    let requests = readRequests();

    if (req.user.role !== 'Coordinator') {
        requests = requests.filter(r =>
            r.customerId === req.user.id
        );
    }

    const { status, category, priority } = req.query;

    if (status) {
        requests = requests.filter(r => r.status === status);
    }

    if (category) {
        requests = requests.filter(r => r.category === category);
    }

    if (priority) {
        requests = requests.filter(r => r.priority === priority);
    }

    res.json(requests);
});

// Retrieve an individual request
app.get('/api/requests/:id', getUser, (req, res) => {
    const request = readRequests().find(r =>
        String(r.id) === req.params.id
    );

    if (!request || !canAccess(request, req.user)) {
        return res.status(404).json({
            error: 'Request not found.'
        });
    }

    res.json(request);
});

// Create a new request
app.post('/api/requests', getUser, (req, res) => {
    const {
        campaignReference,
        category,
        priority,
        description
    } = req.body;

    if (
        !campaignReference?.trim() ||
        !categories.includes(category) ||
        !priorities.includes(priority) ||
        !description?.trim()
    ) {
        return res.status(400).json({
            error: 'Please provide valid request details.'
        });
    }

    const requests = readRequests();

    const now = new Date().toISOString();

    const newRequest = {
        id: String(Date.now()),
        customerId: req.user.id,
        campaignReference: campaignReference.trim(),
        category,
        priority,
        description: description.trim(),
        status: 'Submitted',
        assignee: null,
        createdAt: now,
        updatedAt: now,
        history: [
            {
                changedAt: now,
                previousStatus: null,
                newStatus: 'Submitted',
                actor: req.user.id
            }
        ]
    };

    requests.push(newRequest);
    saveRequests(requests);

    res.status(201).json(newRequest);
});

// Update a request
app.patch('/api/requests/:id', getUser, (req, res) => {
    if (req.user.role !== 'Coordinator') {
        return res.status(403).json({
            error: 'Only the coordinator can update requests.'
        });
    }

    const requests = readRequests();

    const request = requests.find(r =>
        String(r.id) === req.params.id
    );

    if (!request) {
        return res.status(404).json({
            error: 'Request not found.'
        });
    }

    const { assignee, status } = req.body;

    if (assignee !== undefined &&
        assignee !== '' &&
        !staff.includes(assignee)) {
        return res.status(400).json({
            error: 'Invalid staff member.'
        });
    }

    if (status !== undefined) {
        const currentIndex = statuses.indexOf(request.status);
        const nextIndex = statuses.indexOf(status);

        if (nextIndex !== currentIndex + 1) {
            return res.status(400).json({
                error: 'Invalid status progression.'
            });
        }

        const now = new Date().toISOString();

        request.history.push({
            changedAt: now,
            previousStatus: request.status,
            newStatus: status,
            actor: req.user.id
        });

        request.status = status;
    }

    if (assignee !== undefined) {
        request.assignee = assignee || null;
    }

    request.updatedAt = new Date().toISOString();

    saveRequests(requests);

    res.json(request);
});

// Serve frontend
app.use(express.static(frontendPath));

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found'
    });
});

module.exports = app;
