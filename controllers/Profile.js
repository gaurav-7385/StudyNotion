const Course = require("../models/Course");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updatedProfile = async (req, res) => {
  try {
    // Destructure fields from the request body
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    // Get userId from authenticated user
    const userId = req.user.id;

    // Validation: Check if all required fields are provided
    if (!contactNumber || !gender || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Find user profile details
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profileId = userDetails.additionalDetails;

    // Find profile details by ID
    const profileDetails = await Profile.findById(profileId);
    if (!profileDetails) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update profile details
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    // Save updated profile details
    await profileDetails.save();

    // Return success response with updated profile details
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      profileDetails,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

//delete profile
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.body;

    // Validate input: Check if `id` is a valid ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Check if the user exists
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Unenroll user from all enrolled courses
    const enrolledCourses = userDetails.enrolledCourses || []; // Ensure it's an array
    for (const courseId of enrolledCourses) {
      await Course.findByIdAndUpdate(courseId, {
        $pull: { enrolledStudents: id },
      });
    }

    // Delete user's profile
    await Profile.findByIdAndDelete(userDetails.additionalDetails);

    // Delete user account
    await User.findByIdAndDelete(id);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Utility function to validate ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validate and get user detail
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    //return response
    return res.status(200).json({
      success: true,
      message: "User Data Fetched SuccessFully",
      userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updatedDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec();
    if (!userDetails) {
      return res.status(400).json({
        success: true,
        data: userDetails.courses,
      });
    }

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnroled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      };

      return courseDataWithStats;
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
