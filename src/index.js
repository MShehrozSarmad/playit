import 'dotenv/config';
import express from 'express';
import connectDB from './db/index.js';

const app = express();

app.listen(process.env.PORT, () => console.log(`app is listening at port ${process.env.PORT}`));
connectDB();

app.get('/', (req, res) => {
    res.send('hello world new');
})