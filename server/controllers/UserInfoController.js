async function createUser(req, res) {
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
      if (!phoneRegex.test(phoneNumber)) {
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


  module.exports = {
    createUser
  }