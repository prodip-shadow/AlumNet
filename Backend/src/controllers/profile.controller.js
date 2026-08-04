
const profileModel = require('../models/profile.model');

// Get My Profile
const getMyProfile = (req, res) => {
  const user = req.user;

  if (user.role === 'STUDENT') {
    profileModel.getStudentProfileByUserId(user.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        profile: result[0],
      });
    });

    return;
  }

  if (user.role === 'ALUMNI') {
    profileModel.getAlumniProfileByUserId(user.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        profile: result[0],
      });
    });

    return;
  }

  return res.status(403).json({
    success: false,
    message: 'Profile is not available for this user',
  });
};

// Update My Profile
const updateMyProfile = (req, res) => {
  const user = req.user;

  if (user.role === 'STUDENT') {
    const {
      bio,
      careerInterests,
      githubLink,
      linkedinLink,
      facebookLink,
      portfolioLink,
      codeforcesLink,
      codechefLink,
      leetcodeLink,
      hackerrankLink,
    } = req.body;

    profileModel.updateStudentProfile(
      user.id,
      [
        bio,
        careerInterests,
        githubLink,
        linkedinLink,
        facebookLink,
        portfolioLink,
        codeforcesLink,
        codechefLink,
        leetcodeLink,
        hackerrankLink,
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
        });
      },
    );

    return;
  }

  if (user.role === 'ALUMNI') {
    const {
      bio,
      currentPosition,
      currentCompany,
      currentLocation,
      githubLink,
      linkedinLink,
      facebookLink,
      personalWebsite,
      contactEmail,
      whatsappNumber,
      preferredContactMethod,
      visibleContactMethods,
    } = req.body;

    profileModel.updateAlumniProfile(
      user.id,
      [
        bio,
        currentPosition,
        currentCompany,
        currentLocation,
        githubLink,
        linkedinLink,
        facebookLink,
        personalWebsite,
        contactEmail,
        whatsappNumber,
        preferredContactMethod,
        JSON.stringify(visibleContactMethods),
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
        });
      },
    );

    return;
  }

  return res.status(403).json({
    success: false,
    message: 'Profile is not available for this user',
  });
};




// Update Profile Picture
const updateProfilePicture = (req, res) => {
  if (!req.uploadedImageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Profile image is required',
    });
  }

  profileModel.updateProfilePicture(
    req.user.id,
    req.uploadedImageUrl,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
      });
    },
  );
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateProfilePicture,
};

