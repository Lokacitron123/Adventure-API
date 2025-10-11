import express from "express";
import {
  getUsers,
  getUser,
  postUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import {
  loginUser,
  signUpUser,
} from "../controllers/authentication.controller.js";

const router = express.Router();

router.param("id", (req, res, next, val) => {
  if (!/^[a-fA-F0-9]{24}$/.test(val)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid ID format",
    });
  }

  req.userId = val;
  next();
});

router.route("/signup").post(signUpUser);
router.route("/login").post(loginUser);

router.route("/").get(getUsers).post(postUser);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
