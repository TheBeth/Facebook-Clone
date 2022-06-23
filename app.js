require('dotenv').config();
require('./config/passport')
const express = require('express');
const cors = require('cors');
const userRoute = require('./routes/userRoutes');
const friendRoute = require('./routes/friendRoutes');
const postRoute = require('./routes/postRoutes');
const commentRoute = require('./routes/commetnRoutes');
const likeRoute = require('./routes/likeRoutes');

const app = express();

app.use(cors());
app.use(express.json()); // path body
app.use('/static', express.static('public/images')); // localhost:port/static/filename

app.use('/users', userRoute);
app.use('/friends', friendRoute);
app.use('/posts', postRoute);
app.use('/comments', commentRoute);
app.use('/likes', likeRoute);

app.use((req, res) => {
    res.status(404).json({ message : "resource not found on this server"});
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({ message : err.message});
});

const port = process.env.PORT || 8000;
app.listen(port, () => {console.log(`server running on port ${port}`)});