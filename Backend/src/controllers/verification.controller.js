
const verificationModel = require('../models/verification.model');
const userModel = require('../models/user.model');
const profileModel = require('../models/profile.model');
const db = require('../config/db');


// Apply Verification
const applyVerification = (req, res) => {
  const userId = req.user.id;

  const {
    applicationType,
    district,
    universityId,
    registrationNumber,
    facultyId,
    departmentId,
    session,
    currentSemester,
    graduationYear,
    currentPosition,
    currentCompany,
  } = req.body;

  if (
    !applicationType ||
    !district ||
    !universityId ||
    !registrationNumber ||
    !facultyId ||
    !session
  ) {
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing',
    });
  }

  if (applicationType === 'STUDENT' && !currentSemester) {
    return res.status(400).json({
      success: false,
      message: 'Current semester is required for student verification',
    });
  }

  if (applicationType === 'ALUMNI' && !graduationYear) {
    return res.status(400).json({
      success: false,
      message: 'Graduation year is required for alumni verification',
    });
  }



  verificationModel.getVerificationApplicationByUserId(
    userId,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a verification application',
        });
      }

      verificationModel.createVerificationApplication(
        [
          userId,
          applicationType,
          district,
          universityId,
          registrationNumber,
          facultyId,
          departmentId || null,
          session,
          currentSemester || null,
          graduationYear || null,
          currentPosition || null,
          currentCompany || null,
        ],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          return res.status(201).json({
            success: true,
            message: 'Verification application submitted successfully',
          });
        },
      );
    },
  );

 
};

// Get My Verification Application
const getMyVerificationApplication = (req, res) => {
  verificationModel.getVerificationApplicationByUserId(
    req.user.id,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
        });
      }

      return res.status(200).json({
        success: true,
        application: result[0],
      });
    },
  );
};


// Get Pending Verification Applications
const getPendingVerificationApplications = (req, res) => {
  verificationModel.getPendingVerificationApplications((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      applications: result,
    });
  });
};



// Approve Verification
const approveVerification = (req, res) => {
  const { id } = req.params;
  const reviewedByUserId = req.user.id;

  verificationModel.getVerificationApplicationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found',
      });
    }

    const application = result[0];

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application already reviewed',
      });
    }






    verificationModel.updateVerificationStatus(
      id,
      'APPROVED',
      null,
      reviewedByUserId,
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

     userModel.updateUserRole(
       application.userId,
       application.applicationType,
       (err) => {
         if (err) {
           return res.status(500).json({
             success: false,
             message: 'Server Error',
           });
         }

         if (application.applicationType === 'STUDENT') {
           profileModel.createStudentProfile(
             [
               application.userId,
               application.district,
               application.universityId,
               application.registrationNumber,
               application.facultyId,
               application.departmentId,
               application.session,
               application.currentSemester,
               null,
             ],
             (err) => {
               if (err) {
                 return res.status(500).json({
                   success: false,
                   message: 'Server Error',
                 });
               }

               return res.status(200).json({
                 success: true,
                 message: 'Verification approved successfully',
               });
             },
           );

           return;
         }

         profileModel.createAlumniProfile(
           [
             application.userId,
             application.district,
             application.universityId,
             application.registrationNumber,
             application.facultyId,
             application.departmentId,
             application.session,
             application.graduationYear,
           ],
           (err) => {
             if (err) {
               return res.status(500).json({
                 success: false,
                 message: 'Server Error',
               });
             }

             return res.status(200).json({
               success: true,
               message: 'Verification approved successfully',
             });
           },
         );
       },
     );



      },


    );






  });
};


// Reject Verification
const rejectVerification = (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};

  const reviewedByUserId = req.user.id;

  if (!rejectionReason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  verificationModel.getVerificationApplicationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found',
      });
    }

    const application = result[0];

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application already reviewed',
      });
    }

    verificationModel.updateVerificationStatus(
      id,
      'REJECTED',
      rejectionReason,
      reviewedByUserId,
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Verification rejected successfully',
        });
      },
    );
  });
};

// Delete Verification Application
const deleteVerificationApplication = (req, res) => {
  const { id } = req.params;

  verificationModel.deleteVerificationApplication(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification application deleted successfully',
    });
  });
};

// Delete All Verification Applications
const deleteAllVerificationApplications = (req, res) => {
  verificationModel.deleteAllVerificationApplications((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All verification applications deleted successfully',
    });
  });
};

module.exports = {
  applyVerification,
  getMyVerificationApplication,
  getPendingVerificationApplications,
  approveVerification,
  rejectVerification,
  deleteVerificationApplication,
  deleteAllVerificationApplications,
};

