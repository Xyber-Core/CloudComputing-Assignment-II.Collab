
const { createApp } = require('./SRC/app');
const { createMemoryRepo } = require('./SRC/repoMemory');

const PORT = process.env.PORT || 3000;

const app = createApp({
    repo: createMemoryRepo()
});

app.listen(PORT, () => {
    console.log(`PrintPortal API running on port ${PORT}`);
});
