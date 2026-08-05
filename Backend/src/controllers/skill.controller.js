const skillModel = require('../models/skill.model');

// Create Skill
const createSkill = (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Skill name is required',
    });
  }

  skillModel.createSkill(name, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Skill already exists',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Skill created successfully',
    });
  });
};

// Get All Skills
const getAllSkills = (req, res) => {
  skillModel.getAllSkills((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      skills: result,
    });
  });
};

// Get Skill By Id
const getSkillById = (req, res) => {
  const { id } = req.params;

  skillModel.getSkillById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    return res.status(200).json({
      success: true,
      skill: result[0],
    });
  });
};

// Update Skill
const updateSkill = (req, res) => {
  const { id } = req.params;
  const name = req.body.name?.trim();
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Skill name is required',
    });
  }

  skillModel.updateSkill(id, name, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Skill already exists',
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
    });
  });
};

// Delete Skill
const deleteSkill = (req, res) => {
  const { id } = req.params;

  skillModel.deleteSkill(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Skill deleted successfully',
    });
  });
};

module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};
