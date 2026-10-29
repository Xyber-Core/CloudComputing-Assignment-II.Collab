async function checkApi() {
    const status = document.getElementById('api-status');

    try {
        const response = await fetch('/api/health');

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();

        status.textContent =
            `${data.service} connection: ${data.status}`;
    } catch (error) {
        status.textContent = 'Unable to connect to the API.';
        console.error('API health check failed:', error);
    }
}

checkApi();
