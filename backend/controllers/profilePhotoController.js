const mongoose = require("mongoose");
const User = require("../models/User");

const getAuthenticatedUserId = (req) =>
  req.user?._id || req.user?.id || req.auth?.userId || null;

exports.updateProfilePhoto = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { profilePhoto } = req.body || {};

    if (typeof profilePhoto !== "string" || !profilePhoto.trim()) {
      return res.status(400).json({ success: false, message: "A profile photo is required." });
    }

    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(profilePhoto)) {
      return res.status(400).json({ success: false, message: "Unsupported profile photo format." });
    }

    // DashboardShell resizes images before sending them. Keep a server-side
    // guard as a second protection against oversized payloads.
    if (profilePhoto.length > 350000) {
      return res.status(413).json({ success: false, message: "Profile photo is too large." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.profilePhoto = profilePhoto;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error("Update profile photo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update profile photo.",
    });
  }
};
