
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    profileImageUrl VARCHAR(500) DEFAULT NULL,

    role ENUM('USER', 'STUDENT', 'ALUMNI', 'ADMIN')
    DEFAULT 'USER',

    isActive BOOLEAN DEFAULT TRUE,

    refreshToken VARCHAR(500) DEFAULT NULL,
    refreshTokenExpiresAt DATETIME DEFAULT NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);



CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,

    facultyId INT NOT NULL,

    FOREIGN KEY (facultyId)
        REFERENCES faculties(id)
        ON DELETE CASCADE
);




CREATE TABLE verification_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    applicationType ENUM('STUDENT', 'ALUMNI') NOT NULL,

    district VARCHAR(100) NOT NULL,

    universityId VARCHAR(50) NOT NULL,

    registrationNumber VARCHAR(50) NOT NULL,

    facultyId INT NOT NULL,

    departmentId INT DEFAULT NULL,

    session VARCHAR(20) NOT NULL,

    currentSemester VARCHAR(20) DEFAULT NULL,

    graduationYear INT DEFAULT NULL,

    currentPosition VARCHAR(150) DEFAULT NULL,

    currentCompany VARCHAR(150) DEFAULT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    rejectionReason VARCHAR(300) DEFAULT NULL,

    reviewedByUserId INT DEFAULT NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    reviewedAt DATETIME DEFAULT NULL,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (facultyId)
        REFERENCES faculties(id),

    FOREIGN KEY (departmentId)
        REFERENCES departments(id),

    FOREIGN KEY (reviewedByUserId)
        REFERENCES users(id)
);



CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL UNIQUE,

    district VARCHAR(100) NOT NULL,

    universityId VARCHAR(50) NOT NULL,

    registrationNumber VARCHAR(50) NOT NULL,

    facultyId INT NOT NULL,

    departmentId INT DEFAULT NULL,

    session VARCHAR(20) NOT NULL,

    currentSemester VARCHAR(20) NOT NULL,

    expectedGraduationYear INT DEFAULT NULL,

    bio TEXT DEFAULT NULL,

    careerInterests VARCHAR(300) DEFAULT NULL,

    githubLink VARCHAR(200) DEFAULT NULL,

    linkedinLink VARCHAR(200) DEFAULT NULL,

    facebookLink VARCHAR(200) DEFAULT NULL,

    portfolioLink VARCHAR(200) DEFAULT NULL,

    codeforcesLink VARCHAR(200) DEFAULT NULL,

    codechefLink VARCHAR(200) DEFAULT NULL,

    leetcodeLink VARCHAR(200) DEFAULT NULL,

    hackerrankLink VARCHAR(200) DEFAULT NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (facultyId)
        REFERENCES faculties(id),

    FOREIGN KEY (departmentId)
        REFERENCES departments(id)
);



CREATE TABLE alumni_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL UNIQUE,

    district VARCHAR(100) NOT NULL,

    universityId VARCHAR(50) NOT NULL,

    registrationNumber VARCHAR(50) NOT NULL,

    facultyId INT NOT NULL,

    departmentId INT DEFAULT NULL,

    session VARCHAR(20) NOT NULL,

    graduationYear INT NOT NULL,

    bio TEXT DEFAULT NULL,

    currentPosition VARCHAR(150) DEFAULT NULL,

    currentCompany VARCHAR(150) DEFAULT NULL,

    currentLocation VARCHAR(150) DEFAULT NULL,

    githubLink VARCHAR(200) DEFAULT NULL,

    linkedinLink VARCHAR(200) DEFAULT NULL,

    facebookLink VARCHAR(200) DEFAULT NULL,

    personalWebsite VARCHAR(200) DEFAULT NULL,

    contactEmail VARCHAR(150) DEFAULT NULL,

    whatsappNumber VARCHAR(30) DEFAULT NULL,

    preferredContactMethod VARCHAR(30) DEFAULT NULL,

    visibleContactMethods VARCHAR(200) DEFAULT NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (facultyId)
        REFERENCES faculties(id),

    FOREIGN KEY (departmentId)
        REFERENCES departments(id)
);


CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE user_skills (
    userId INT NOT NULL,

    skillId INT NOT NULL,

    PRIMARY KEY (userId, skillId),

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skillId)
        REFERENCES skills(id)
        ON DELETE CASCADE
);

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT NOT NULL,

    imageUrl VARCHAR(500) DEFAULT NULL,

    githubLink VARCHAR(200) DEFAULT NULL,

    liveLink VARCHAR(200) DEFAULT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    content TEXT NOT NULL,

    imageUrl VARCHAR(500) DEFAULT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE post_likes (
    postId INT NOT NULL,
    userId INT NOT NULL,


    PRIMARY KEY(userId, postId),

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (postId)
        REFERENCES posts(id)
        ON DELETE CASCADE
);