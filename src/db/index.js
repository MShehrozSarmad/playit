import mongoose from 'mongoose';
import {DB_NAME} from  '../contants.js';


const connectDB = async () => {
    try {
        const connectionInst = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n mongodb connected ✅ DB_Host: ${connectionInst.connection.host}`);
    } catch (error) {
        console.error('mongodb connection error:: ', error);
        process.exit(1);
    }
}

export default connectDB;