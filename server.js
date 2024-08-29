const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const dbConnect = require('./config/dbConnect');
const route = require('./routes/index');

dotenv.config();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

dbConnect();

route(app);

app.use('/', (req, res) => {
    res.send('Welcome to my Threads!');
});

app.listen(port, () => {
    console.log(`Server is running at port ${port} in Threads`);
});
