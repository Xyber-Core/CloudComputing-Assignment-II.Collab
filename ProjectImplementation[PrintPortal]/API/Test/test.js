const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../SRC/app');

test('GET /api/health returns a healthy status', async () => {
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });

        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/health`
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            status: 'ok',
            service: 'PrintPortal API'
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});
