const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
