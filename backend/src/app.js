import express from "express";
import cookieParser from 'cookie-parser'
import session from "express-session";
import router from './routes/auth/userAuth.routes.js'
import verifyUserToken from "./middlewares/verifyUserToken.js";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import "./config/passport.js";
import adminAuthRoutes from "./routes/auth/adminAuth.routes.js";
import usermanagementRoutes from "./routes/admin/userManagment.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET || "quickart-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "../../frontend")));

app.use('/user', router);
app.use('/admin', adminAuthRoutes);
app.use('/admin', usermanagementRoutes);




export default app;
