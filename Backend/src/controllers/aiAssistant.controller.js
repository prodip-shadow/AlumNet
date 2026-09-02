const aiAssistantService = require('../services/aiAssistant.service');
const aiAssistantModel = require('../models/aiAssistant.model');


const queryAlumniAssistant = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required and must be a non-empty string',
      });
    }

    // Step 1: Use Gemini AI service to extract structured 4 search filters (location, skill, session, project)
    let filters;
    try {
      filters = await aiAssistantService.extractSearchFilters(prompt.trim());
    } catch (aiError) {
      return res.status(500).json({
        success: false,
        message: aiError.message || 'Failed to extract search filters from AI service',
      });
    }

    // Step 2: Ensure clean filters object
    const cleanFilters = {
      position: filters.position || null,
      company: filters.company || null,
      location: filters.location || null,
      skill: filters.skill || null,
      session: filters.session || null,
      project: filters.project || null,
      query: filters.query || prompt.trim(),
    };

    // Step 3: Query Database using structured parameters and database-aware matching
    aiAssistantModel.searchAlumni(cleanFilters, (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while searching alumni',
        });
      }

      const alumniList = rows.map((row) => ({
        id: row.id,
        name: row.name,
        profileImageUrl: row.profileImageUrl || null,
        currentPosition: row.currentPosition || null,
        currentCompany: row.currentCompany || null,
        currentLocation: row.currentLocation || null,
        session: row.session || null,
        graduationYear: row.graduationYear || null,
        facultyName: row.facultyName || null,
        departmentName: row.departmentName || null,
        profileLink: `/api/alumni/${row.id}`,
      }));

      if (alumniList.length === 0) {
        return res.status(200).json({
          success: true,
          filters: cleanFilters,
          alumni: [],
          message: 'No alumni found',
        });
      }

      return res.status(200).json({
        success: true,
        filters: cleanFilters,
        alumni: alumniList,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
  queryAlumniAssistant,
};
