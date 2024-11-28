const express = require('express');
// const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const { app, server } = require('./socket/socket.js');

const dbConnect = require('./config/dbConnect');
const route = require('./routes/index');

dotenv.config();
const port = process.env.PORT || 5000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use(
    cors({
        origin: ['http://localhost:5731', 'http://localhost:3000'], // Add both ports here
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

dbConnect();

route(app);

app.use('/', (req, res) => {
    res.send('Welcome to my Threads!');
});

server.listen(port, () => {
    console.log(`Server is running at port ${port} in Threads`);
});
