
const express = require('express');
const path = require('node:path');

const { createMemoryRepo } = require('./repoMemory');
const {
    validateNewRequest,
    validateUpdate,
    validateFilters
} = require('./validation');

function createApp({ repo = createMemoryRepo() } = {}) {
    const app = express();

    const frontendPath = path.join(
        __dirname,
        '../../Frontend/Public'
    );

    // Parse JSON request bodies
    app.use(express.json());

    // Health check
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    // Authenticate the synthetic demo user
    app.use('/api/requests', async (req, res, next) => {
        try {
            const userId = req.get('X-User-Id');

            if (!userId) {
                return res.status(401).json({
                    error: 'User identification required.'
                });
            }

            const user = await repo.findUser(userId);

            if (!user) {
                return res.status(401).json({
                    error: 'Unknown user.'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    });

    // List requests and apply filters
    app.get('/api/requests', async (req, res, next) => {
        try {
            const { filters, errors } = validateFilters(req.query);

            if (errors.length) {
                return res.status(400).json({
                    error: errors.join(' ')
                });
            }

            // Customers can only see their own requests.
            if (req.user.role === 'Customer') {
                filters.customerId = req.user.id;
            }

            const requests = await repo.listRequests(filters);

            res.json(requests);
        } catch (error) {
            next(error);
        }
    });

    // Retrieve an individual request and its history
    app.get('/api/requests/:id', async (req, res, next) => {
        try {
            const id = Number(req.params.id);

            const request = await repo.getRequest(id);

            if (!request) {
                return res.status(404).json({
                    error: 'Request not found.'
                });
            }

            if (
                req.user.role === 'Customer' &&
                request.customerId !== req.user.id
            ) {
                return res.status(403).json({
                    error: 'You cannot access this request.'
                });
            }

            const history = await repo.getHistory(id);

            res.json({
                ...request,
                history
            });
        } catch (error) {
            next(error);
        }
    });

    // Submit a new request
    app.post('/api/requests', async (req, res, next) => {
        try {
            if (req.user.role !== 'Customer') {
                return res.status(403).json({
                    error: 'Only customers can submit requests.'
                });
            }

            const { value, errors } = validateNewRequest(req.body);

            if (errors.length) {
                return res.status(400).json({
                    error: errors.join(' ')
                });
            }

            const request = await repo.createRequest(
                {
                    ...value,
                    customerId: req.user.id
                },
                req.user.id
            );

            const history = await repo.getHistory(request.id);

            res.status(201).json({
                ...request,
                history
            });
        } catch (error) {
            next(error);
        }
    });

    // Assign staff or advance request status
    app.patch('/api/requests/:id', async (req, res, next) => {
        try {
            if (req.user.role !== 'Coordinator') {
                return res.status(403).json({
                    error: 'Only coordinators can update requests.'
                });
            }

            const id = Number(req.params.id);

            const current = await repo.getRequest(id);

            if (!current) {
                return res.status(404).json({
                    error: 'Request not found.'
                });
            }

            const { changes, errors } = validateUpdate(
                current,
                req.body
            );

            if (errors.length) {
                return res.status(400).json({
                    error: errors.join(' ')
                });
            }

            const updated = await repo.updateRequest(
                id,
                changes,
                req.user.id
            );

            const history = await repo.getHistory(id);

            res.json({
                ...updated,
                history
            });
        } catch (error) {
            next(error);
        }
    });

    // Serve frontend pages and assets
    app.use(express.static(frontendPath));

    // Handle malformed JSON
    app.use((err, req, res, next) => {
        if (
            err instanceof SyntaxError &&
            err.status === 400 &&
            'body' in err
        ) {
            return res.status(400).json({
                error: 'Malformed JSON.'
            });
        }

        next(err);
    });

    // Handle unexpected errors
    app.use((err, req, res, next) => {
        console.error(err);

        res.status(500).json({
            error: 'Internal server error.'
        });
    });

    // Unknown routes
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not found.'
        });
    });

    return app;
}

module.exports = { createApp };
