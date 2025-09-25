import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.model.js";

// Helpers
function genId() {
  return crypto.randomBytes(12).toString("hex"); // 12 bytes -> 24 hex chars
}

async function hashPassword(password) {
  const SALT_ROUNDS = 12;
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/////////////////////////////

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the users JSON file initially - loads into memory
// const usersFilePath = path.join(__dirname, "../dev-data/data/users.json");
// let users = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));

// Controllers
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No users found in the database",
      });
    }

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not retrieve the users",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: `User with id ${req.userId} not found`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not retrieve the user",
    });
  }
};

export const postUser = async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "New user data is missing",
      });
    }

    const alreadyExists = await User.findOne({ email: data.email });
    if (alreadyExists) {
      return res.status(400).json({
        status: "fail",
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await User.create({
      ...data,
      password: hashedPassword,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not create user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findById(req.userId);

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "User data is missing",
      });
    }

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true } // return updated doc & validate schema
    );

    res.status(200).json({
      status: "success",
      data: { updatedUser },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not update user",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // if (!index) doesnt work because findIndex returns -1 if nothing else
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    await User.deleteOne(user._id);

    res.status(200).json({
      status: "success",
      message: `User with ID ${req.userId} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Could not delete user",
    });
  }
};
