const app = require('./SRC/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`PrintPortal API running on port ${PORT}`);
});

// cd "ProjectImplementation[PrintPortal]/API" npm start | http://localhost:3000/