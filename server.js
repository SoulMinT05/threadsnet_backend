const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

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

dbConnect();

route(app);

app.use('/', (req, res) => {
    res.send('Welcome to my Threads!');
});

app.listen(port, () => {
    console.log(`Server is running at port ${port} in Threads`);
});
