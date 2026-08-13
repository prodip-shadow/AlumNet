const db = require('../config/db');

const normalizeSkillName = (name) => {
  if (!name) return '';
  let n = name.toLowerCase().trim();

  const abbreviations = {
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'dl': 'deep learning',
    'nlp': 'natural language processing',
    'dsa': 'data structures and algorithms',
    'dbms': 'database management system',
  };

  if (abbreviations[n]) {
    return abbreviations[n];
  }

  // Remove .js, js, -js suffix unless the string is "javascript" or standalone "js"
  if (n !== 'javascript' && n !== 'js') {
    n = n.replace(/[\.\s\-]js$/i, '')
         .replace(/js$/i, '')
         .trim();
  }

  n = n.replace(/[^a-z0-9+#\s]/g, '').trim();
  return n;
};

const parseSessionYears = (str) => {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.trim();

  // 1. Two-part session: e.g. "2022-23", "22-23", "2022/23", "22/23", "2022 23", "2022-2023"
  const rangeMatch = cleaned.match(/^(\d{2,4})[\s/\-:]+(\d{2,4})$/);
  if (rangeMatch) {
    let sStr = rangeMatch[1];
    let eStr = rangeMatch[2];

    let startYear = parseInt(sStr, 10);
    if (sStr.length === 2) {
      startYear = startYear >= 50 ? 1900 + startYear : 2000 + startYear;
    }

    let endYear = parseInt(eStr, 10);
    if (eStr.length === 2) {
      endYear = endYear >= 50 ? 1900 + endYear : 2000 + endYear;
    }

    return { startYear, endYear };
  }

  // 2. Single year session: e.g. "2022", "22"
  const singleMatch = cleaned.match(/^(\d{2,4})$/);
  if (singleMatch) {
    let yStr = singleMatch[1];
    let year = parseInt(yStr, 10);
    if (yStr.length === 2) {
      year = year >= 50 ? 1900 + year : 2000 + year;
    }
    return { startYear: year, endYear: null };
  }

  return null;
};


const resolveSessionInDatabase = (rawSession, callback) => {
  if (!rawSession || typeof rawSession !== 'string') {
    return callback(null, null);
  }

  const sql = `SELECT DISTINCT session FROM alumni_profiles WHERE session IS NOT NULL AND session != ''`;
  db.query(sql, (err, dbRows) => {
    if (err) return callback(err);
    if (!dbRows || dbRows.length === 0) return callback(null, null);

    const rawClean = rawSession.trim();
    const dbSessions = dbRows.map((r) => r.session);

    // 1. Exact match
    const exactMatch = dbSessions.find((s) => s.toLowerCase().trim() === rawClean.toLowerCase());
    if (exactMatch) {
      return callback(null, exactMatch);
    }

    // 2. Parsed year normalization match
    const targetParsed = parseSessionYears(rawClean);
    if (targetParsed) {
      for (const dbSession of dbSessions) {
        const dbParsed = parseSessionYears(dbSession);
        if (dbParsed) {
          // Range match: both startYear and endYear match
          if (
            targetParsed.endYear !== null &&
            dbParsed.endYear !== null &&
            targetParsed.startYear === dbParsed.startYear &&
            targetParsed.endYear === dbParsed.endYear
          ) {
            return callback(null, dbSession);
          }

          // Single year match: startYear matches and (endYear is null or matches)
          if (
            targetParsed.endYear === null &&
            (targetParsed.startYear === dbParsed.startYear || targetParsed.startYear === dbParsed.endYear)
          ) {
            return callback(null, dbSession);
          }
        }
      }
    }

    // 3. Fallback substring match
    const subMatch = dbSessions.find(
      (s) => s.toLowerCase().includes(rawClean.toLowerCase()) || rawClean.toLowerCase().includes(s.toLowerCase())
    );
    if (subMatch) {
      return callback(null, subMatch);
    }

    return callback(null, null);
  });
};


const resolveSkillInDatabase = (rawSkill, callback) => {
  if (!rawSkill || typeof rawSkill !== 'string') {
    return callback(null, null);
  }

  const sql = `SELECT id, name FROM skills ORDER BY name ASC`;
  db.query(sql, (err, dbSkills) => {
    if (err) return callback(err);
    if (!dbSkills || dbSkills.length === 0) return callback(null, null);

    const rawLower = rawSkill.toLowerCase().trim();

    // 1. Exact case-insensitive match
    const exactMatch = dbSkills.find(
      (s) => s.name.toLowerCase().trim() === rawLower
    );
    if (exactMatch) {
      return callback(null, exactMatch);
    }

    // 2. Normalized match (e.g. "React JS", "React.js", "ReactJS" => "React")
    const rawNorm = normalizeSkillName(rawSkill);
    if (rawNorm) {
      const normMatch = dbSkills.find(
        (s) => normalizeSkillName(s.name) === rawNorm
      );
      if (normMatch) {
        return callback(null, normMatch);
      }
    }

    // 3. Token-aware match for multi-word skills
    const rawTokens = rawLower.split(/\s+/).filter(Boolean);
    for (const dbItem of dbSkills) {
      const dbLower = dbItem.name.toLowerCase().trim();
      if (rawTokens.includes(dbLower) && dbLower.length > 2) {
        return callback(null, dbItem);
      }
    }

    // 4. Safe substring match (Strict rule: "Java" MUST NOT match "JavaScript")
    const substringMatch = dbSkills.find((item) => {
      const dbLower = item.name.toLowerCase().trim();
      if (rawLower === 'java' && dbLower.includes('script')) {
        return false;
      }
      return dbLower.includes(rawLower) || rawLower.includes(dbLower);
    });

    if (substringMatch) {
      return callback(null, substringMatch);
    }

    return callback(null, null);
  });
};


const searchAlumni = (filters, callback) => {
  // Step 1: If skill filter is provided, resolve against canonical DB skills first
  if (filters.skill) {
    resolveSkillInDatabase(filters.skill, (err, resolvedSkill) => {
      if (err) return callback(err);

      // If user searched for a skill that does NOT exist in canonical skills table, return 0 results
      if (!resolvedSkill) {
        return callback(null, []);
      }

      // Step 2: Resolve session filter if provided
      resolveSessionFilter(filters, resolvedSkill, callback);
    });
  } else {
    resolveSessionFilter(filters, null, callback);
  }
};

/**
 * Helper to resolve session filter before executing SQL search
 */
const resolveSessionFilter = (filters, resolvedSkill, callback) => {
  if (filters.session) {
    resolveSessionInDatabase(filters.session, (err, resolvedSession) => {
      if (err) return callback(err);

      // If user provided a session filter but no matching session exists in DB, return 0 results
      if (!resolvedSession) {
        return callback(null, []);
      }

      executeAlumniSearch(filters, resolvedSkill, resolvedSession, callback);
    });
  } else {
    executeAlumniSearch(filters, resolvedSkill, null, callback);
  }
};

/**
 * Executes parameterized SQL query for alumni search
 */
const executeAlumniSearch = (filters, resolvedSkill, resolvedSession, callback) => {
  let sql = `
    SELECT DISTINCT
      users.id,
      users.name,
      users.profileImageUrl,
      users.role,
      alumni_profiles.currentPosition,
      alumni_profiles.currentCompany,
      alumni_profiles.currentLocation,
      alumni_profiles.district,
      alumni_profiles.session,
      alumni_profiles.graduationYear,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM alumni_profiles
    INNER JOIN users
      ON alumni_profiles.userId = users.id
    LEFT JOIN faculties
      ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON alumni_profiles.departmentId = departments.id
    WHERE users.role = 'ALUMNI'
      AND users.isActive = TRUE
  `;

  const values = [];

  // 1. Location Filter
  if (filters.location) {
    let locClean = filters.location.replace(/\s+(city|district|country|town|area)$/i, '').trim();
    sql += ` AND (alumni_profiles.currentLocation LIKE ? OR alumni_profiles.district LIKE ?)`;
    const locPattern = `%${locClean}%`;
    values.push(locPattern, locPattern);
  }

  // 2. Skill Filter (Using resolved canonical skill ID)
  if (resolvedSkill) {
    sql += ` AND users.id IN (
      SELECT us.userId
      FROM user_skills us
      WHERE us.skillId = ?
    )`;
    values.push(resolvedSkill.id);
  }

  // 3. Session Filter (Using resolved canonical session string)
  const sessionToSearch = resolvedSession || filters.session;
  if (sessionToSearch) {
    sql += ` AND alumni_profiles.session LIKE ?`;
    values.push(`%${sessionToSearch}%`);
  }

  // 4. Project Filter
  if (filters.project) {
    let projNorm = normalizeSkillName(filters.project);
    sql += ` AND users.id IN (
      SELECT p.userId
      FROM projects p
      WHERE p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.description LIKE ?
    )`;
    const rawProjPattern = `%${filters.project}%`;
    const normProjPattern = `%${projNorm || filters.project}%`;
    values.push(rawProjPattern, rawProjPattern, normProjPattern, normProjPattern);
  }

  sql += ` ORDER BY users.name ASC`;

  db.query(sql, values, callback);
};

module.exports = {
  searchAlumni,
  resolveSkillInDatabase,
  resolveSessionInDatabase,
  parseSessionYears,
  normalizeSkillName,
};
