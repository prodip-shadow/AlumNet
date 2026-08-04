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