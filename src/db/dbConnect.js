import mongoose from 'mongoose';

const DBConnect = async () => {
    await mongoose.connect(process.env.DB_URL, {
        dbName: process.env.DB_NAME
    })
        .then((db) => {
            console.log(`Connected to MongoDB , ${db.connection.host}`);
        }).catch((error) => {
            console.log("Failed to connect to MongoDB ", error);
        })
}

export default DBConnect