
const departmentModel = require('../models/department.model');

// Create Department
const createDepartment = (req, res) => {
  const { name, facultyId } = req.body;

  if (!name || !facultyId) {
    return res.status(400).json({
      success: false,
      message: 'Name and facultyId are required',
    });
  }

  departmentModel.createDepartment([name, facultyId], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
    });
  });
};

// Get All Departments
const getAllDepartments = (req, res) => {
  departmentModel.getAllDepartments((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      departments: result,
    });
  });
};

// Get Department By Id
const getDepartmentById = (req, res) => {
  const { id } = req.params;

  departmentModel.getDepartmentById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    return res.status(200).json({
      success: true,
      department: result[0],
    });
  });
};

// Get Departments By Faculty Id
const getDepartmentsByFacultyId = (req, res) => {
  const { facultyId } = req.params;

  departmentModel.getDepartmentsByFacultyId(facultyId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      departments: result,
    });
  });
};

// Update Department
const updateDepartment = (req, res) => {
  const { id } = req.params;
  const { name, facultyId } = req.body;

  if (!name || !facultyId) {
    return res.status(400).json({
      success: false,
      message: 'Name and facultyId are required',
    });
  }

  departmentModel.updateDepartment(id, [name, facultyId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
    });
  });
};

// Delete Department
const deleteDepartment = (req, res) => {
  const { id } = req.params;

  departmentModel.deleteDepartment(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  });
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByFacultyId,
  updateDepartment,
  deleteDepartment,
};

