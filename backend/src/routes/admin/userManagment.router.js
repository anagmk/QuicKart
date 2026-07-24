import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { allUsers, getUserById, blockUser, sortUsers, paginateUsers, searchUsersByName } from "../../controllers/admin/userController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendAllUsersPage = (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../../frontend/pages/admin/allUsers.html"),
  );
};

router.get("/users/allUsers", sendAllUsersPage);
router.get("/users", allUsers);
router.get("/users/search", searchUsersByName);
router.get("/users/latest", sortUsers);
router.get("/users/paginated", paginateUsers);

router.get("/users/:id", getUserById);
router.patch("/users/:id/block", blockUser);



export default router;