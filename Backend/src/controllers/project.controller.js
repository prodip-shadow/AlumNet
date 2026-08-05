const projectModel = require('../models/project.model');

// Create Project
const createProject = (req, res) => {
  const userId = req.user.id;

  const name = req.body.name?.trim();
  const description = req.body.description?.trim();

  const githubLink = req.body.githubLink?.trim() || null;
  const liveLink = req.body.liveLink?.trim() || null;

  const imageUrl = req.uploadedImageUrl || null;

  if (!name || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name and description are required',
    });
  }

  projectModel.createProject(
    [userId, name, description, imageUrl, githubLink, liveLink],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Project created successfully',
      });
    },
  );
};

// Get My Projects
const getMyProjects = (req, res) => {
  projectModel.getProjectsByUserId(req.user.id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      projects: result,
    });
  });
};

// Get Project By Id
const getProjectById = (req, res) => {
  const { id } = req.params;

  projectModel.getProjectById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (result[0].userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      project: result[0],
    });
  });
};

// Update Project
const updateProject = (req, res) => {
  const { id } = req.params;

  projectModel.getProjectById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (result[0].userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot be empty',
        });
      }

      data.name = name;
    }

   if (req.body.description !== undefined) {
     const description = req.body.description.trim();

     if (!description) {
       return res.status(400).json({
         success: false,
         message: 'Project description cannot be empty',
       });
     }

     data.description = description;
   }

   if (req.body.githubLink !== undefined) {
     data.githubLink = req.body.githubLink.trim() || null;
   }

    if (req.body.liveLink !== undefined) {
      data.liveLink = req.body.liveLink.trim() || null;
    }

    if (req.uploadedImageUrl) data.imageUrl = req.uploadedImageUrl;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update',
      });
    }

    projectModel.updateProject(id, data, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Project updated successfully',
      });
    });

   
  });
};

// Delete Project
const deleteProject = (req, res) => {
  const { id } = req.params;

  projectModel.getProjectById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (result[0].userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    projectModel.deleteProject(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    });
  });
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
