const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create SubSection
exports.createSubSection = async (req, res) => {
  try {
    //fetch data from request body
    const { sectionId, title, timeDuration, description } = req.body;

    //extract file/video
    const video = req.files.videoFile;

    //validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    //create a sub-section
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: `${uploadDetails.duration}`,
      videoUrl: uploadDetails.secure_url,
    });

    //update section with this sub-section
    const updateSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          SubSection: SubSectionDetails._id,
        },
      },
      { new: true }
    );
    //TODO:log updated section here, adding populate here

    //return res
    return res.status(200).json({
      success: true,
      message: "SubSection created successfully",
      updateSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "unable to create subsection",
      error: error.message,
    });
  }
};

exports.updateSubSection = async (req, res) => {
  try {
    // Fetch data from request body
    const { SubSectionId, title, timeDuration, description } = req.body;

    // Validate required fields
    if (!SubSectionId || !title || !timeDuration || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      });
    }

    // Update subsection
    const subsection = await SubSection.findByIdAndUpdate(
      SubSectionId,
      { title, timeDuration, description },
      { new: true, runValidators: true } // `runValidators` ensures schema validators are applied
    );

    // Check if subsection was found and updated
    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: subsection,
    });
  } catch (error) {
    // Log the error (for debugging purposes)
    console.error(error);

    // Return error response
    return res.status(500).json({
      success: false,
      message: "Unable to update SubSection, please try again",
      error: error.message,
    });
  }
};

//check this code and also do for delete subsection code
exports.deleteSubSection = async (req, res) => {
  try {
    // Extract SubSectionId from the URL parameters
    const { SubSectionId } = req.params;

    // Find and delete the subsection
    const deletedSubSection = await SubSection.findByIdAndDelete(SubSectionId);

    if (!deletedSubSection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    // Find the section that contains this subsection and update it
    await Section.updateOne(
      { subSections: SubSectionId },
      { $pull: { subSections: SubSectionId } }
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Subsection deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete subsection, please try again",
      error: error.message,
    });
  }
};
