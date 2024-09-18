import 'dotenv/config';
import connectDB from './db/index.js';
import { app } from './app.js';

connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => console.log(`app is listening at port ${process.env.PORT}`));
}).catch(err => console.log('failed to start server:: ', err));

app.get('/', (req, res) => {
    res.send('hello world new');
})