const RatingAndreview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const RatingAndReview = require("../models/RatingAndReview");
const { default: mongoose } = require("mongoose");

exports.createRating = async (req, res) => {
  try {
    //get user id
    const userId = req.user.id;

    //fetching data from req body
    const { rating, review, courseId } = req.body;

    //check if user is enrolled or not
    const courseDetails = await Course.findOne(
      { _id: courseId },
      {
        studentsEnrolled: { $elemMatch: { $eq: userId } },
      }
    );
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }
    //check if the user already reviewed the course
    const alreadyReviewed = await RatingAndreview.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "User ALready reviwed the Course",
      });
    }

    //create rating and review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    //update course with the rating and review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReviews: ratingReview._id,
        },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);

    //return res
    return res.status(200).json({
      success: true,
      message: "Rating and Review created sucessfully",
      ratingReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get Average rating
exports.getAverageRating = async (req, res) => {
  try {
    //get course id
    const courseId = req.body.courseId;

    //calculate avg rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);
    //return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result(0).averageRating,
      });
    }
    //if no rating review exist
    return res.status(200).json({
      success: true,
      message: "Average rating is zero no rating yet!",
      averageRating: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all rating
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "fistname lastname email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();
    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      data: allReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
