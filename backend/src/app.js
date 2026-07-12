import express from "express";
import cookieParser from 'cookie-parser'
import router from './routes/auth/userAuth.routes.js'

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/user',router)

export default app;