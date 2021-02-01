import express from 'express';
import mongoose from 'mongoose';
import accountsRouter from './routes/accountsRouter.js';
import dotenv from 'dotenv';

dotenv.config();

const { DB_SELECTED, DB_USER, DB_PASSWORD, PORT } = process.env;

const app = express();
console.log(DB_SELECTED, DB_USER, DB_PASSWORD);
app.use(express.json());
app.use('/accounts', accountsRouter);

app.listen(PORT, () => console.log('API started'));

mongoose
  .connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.ttb4d.mongodb.net/${DB_SELECTED}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(() => console.log('Connected to MongoDB Atlas.'))
  .catch((err) => console.log("Couldn't connect to MongoDB Atlas: " + err));
