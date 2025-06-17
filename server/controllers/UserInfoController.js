const {
  generateUserId,
  errorResponse,
  successResponse,
} = require("../utils/Helpers");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");

class UserInfoController {
  async createUser(req, res) {
    try {
      const userId = generateUserId();
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          error:
            "Phone and password are required at the time of creating a user",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long",
        });
      }

      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: "Please enter a valid 10-digit phone number",
        });
      }

      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(409).json({
          error: "User with this phone number already exists",
        });
      }

      // Create new user
      const user = new User({ userId, phone, password });
      await user.save();

      const token = generateToken(user.userId);

      // Return success response (don't send password)
      res.status(201).json({
        message: "Account created successfully",
        token,
        user: {
          id: user._id,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          error: "User with this phone number already exists(1)",
        });
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          error: errors.join(", "),
        });
      }

      res.status(500).json({
        error: "Internal server error. Please try again later.",
      });
    }
  }

  async getUser(req, res) {
    try {
      const { phone, password } = req.body;

      // Validation
      if (!phone || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      // Find user
      const user = await User.findOne({ phone });
      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      // Check password
      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          error: "Invalid password",
        });
      }

      // Generate JWT token
      const token = generateToken(user.userId);

      return successResponse(res, "Profile fetched successfully", {
        token,
        user,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  static async getProfile(req, res) {
    try {
      const userId = req.user.userID;
      const user = await User.findById(userId).select("-passwordHash");

      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      return successResponse(res, "Profile fetched successfully", { user });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation errors", 400, errors.array());
      }

      const userId = req.user.userId;
      const { phone, upiId } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { phone, upiId },
        { new: true, runValidators: true }
      ).select("-passwordHash");

      return successResponse(res, "Profile updated successfully", { user });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

// async function createUser(req, res) {}

// const getUser = async (req, res) => {};

module.exports = UserInfoController;
