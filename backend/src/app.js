import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'
import session from "express-session";
import router from './routes/auth/userAuth.routes.js'
import verifyUserToken from "./middlewares/verifyUserToken.js";
import verifyAdminToken from './middlewares/verifyAdmin.js'
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import "./config/passport.js";
import adminAuthRoutes from "./routes/auth/adminAuth.routes.js";
import userProductsRoutes from "./routes/user/user.products.routes.js";
import productDetailsRoutes from "./routes/user/productDetails.routes.js";
import shoppingRoutes from "./routes/user/shopping.routes.js";
import usermanagementRoutes from "./routes/admin/userManagment.router.js";
import userProfileRoutes from "./routes/user/userProfile.js";
import categoryManagementRoutes from "./routes/admin/categoryManagement.router.js";
import productManagementRoutes from "./routes/admin/productManagement.router.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Allow the frontend, whether served from the Express app or VS Code Live Server,
// to call the protected cart and user APIs with credentials.
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.path.startsWith('/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, "../../frontend")));


app.use('/user', router);
app.use('/user', userProfileRoutes);
app.use('/user/products', userProductsRoutes);
app.use('/user', productDetailsRoutes);
app.use('/user', shoppingRoutes);

app.use('/admin', adminAuthRoutes);
app.use('/admin',verifyAdminToken, usermanagementRoutes);
app.use('/admin',verifyAdminToken,categoryManagementRoutes)
app.use('/admin',verifyAdminToken,productManagementRoutes)




export default app;
