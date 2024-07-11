const Section = require("../models/Section");
const Course = require("../models/Course");
const { response } = require("express");
const SubSection = require("../models/SubSection");

exports.createSection = async (req, res) => {
  try {
    // Fetch data
    const { sectionName, courseId } = req.body;

    // Validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }

    // Create section
    const newSection = await Section.create({ sectionName });

    // Update course with section ObjectId
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "SubSection", // Changed 'subSection' to 'SubSection' to match the model
          model: "SubSection",
        },
      })
      .exec();

    // Return the updated object in the response
    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      course: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create section, please try again",
      error: error.message,
    });
  }
};
exports.updateSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, sectionId } = req.body;

    //validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: true,
        message: "Missing Properties",
      });
    }

    //update data
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    //return res
    return res.status(200).json({
      success: true,
      message: "Section Updated Sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update Section,please try again",
      error: error.message,
    });
  }
};

// DELETE a section
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;
    await Course.findByIdAndUpdate(courseId, {
      $pull: {
        courseContent: sectionId,
      },
    });
    const section = await Section.findById(sectionId);
    console.log(sectionId, courseId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not Found",
      });
    }

    //delete sub section
    await SubSection.deleteMany({ _id: { $in: section.SubSection } });

    await Section.findByIdAndDelete(sectionId);

    //find the updated course and return
    const course = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      message: "Section deleted",
      data: course,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
