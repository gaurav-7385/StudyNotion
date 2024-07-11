const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//reset Password Token
exports.resetPasswordToken = async (req, res) => {
  try {
    // Get email from req body
    const email = req.body.email;
    console.log("Received email:", email);

    // Check user for this email, email verification
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("No user found with this email");
      return res.status(401).json({
        success: false,
        message: "No Email Found!!",
      });
    }
    console.log("User found:", user);

    // Generate token
    const token = crypto.randomUUID();
    console.log("Generated token:", token);

    // Update user by adding token and expiration time
    const updatedDetail = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
      },
      { new: true }
    );
    console.log("Updated user details:", updatedDetail);

    // Create URL
    const url = `http://localhost:3000/update-password/${token}`;
    console.log("Generated URL:", url);

    // Send mail containing URL
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );
    console.log("Email sent successfully to:", email);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Email Sent Successfully",
    });
  } catch (error) {
    console.log("Error occurred:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting password!",
      error: error.message,
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    // Fetch data from the request body
    const { newPassword, confirmPassword, token } = req.body;

    // Log values to debug
    console.log("newPassword:", newPassword);
    console.log("confirmPassword:", confirmPassword);
    console.log("token:", token);

    // Validate that passwords match
    if (newPassword !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Passwords do not match!",
      });
    }

    // Get user details from the database using the token
    const userDetails = await User.findOne({ token: token });

    // Check if the token is valid
    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    // Check if the token is expired
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Token has expired, please generate a new token",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the token and expiration
    await User.findOneAndUpdate(
      { token: token },
      {
        password: hashedPassword,
        token: undefined,
        resetPasswordExpires: undefined,
      },
      { new: true }
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting password",
    });
  }
};
