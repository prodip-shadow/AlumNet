const facultyModel = require('../models/faculty.model');



// Create Faculty
const createFaculty = (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Faculty name is required',
    });
  }

  facultyModel.createFaculty(name, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
    });
  });
};



// Get All Faculties
const getAllFaculties = (req, res) => {
  facultyModel.getAllFaculties((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      faculties: result,
    });
  });
};


// Get Faculty By Id
const getFacultyById = (req, res) => {
  const { id } = req.params;

  facultyModel.getFacultyById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    return res.status(200).json({
      success: true,
      faculty: result[0],
    });
  });
};




// Update Faculty
const updateFaculty = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Faculty name is required',
    });
  }

  facultyModel.updateFaculty(id, name, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
    });
  });
};




// Delete Faculty
const deleteFaculty = (req, res) => {
  const { id } = req.params;

  facultyModel.deleteFaculty(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully',
    });
  });
};






module.exports = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};
