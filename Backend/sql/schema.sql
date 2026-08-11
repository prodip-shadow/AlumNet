
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

    content TEXT DEFAULT NULL,

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


CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    postId INT NOT NULL,

    userId INT NOT NULL,

    content VARCHAR(500) NOT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (postId)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);



CREATE TABLE comment_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,

    commentId INT NOT NULL,

    parentReplyId INT DEFAULT NULL,

    userId INT NOT NULL,

    content VARCHAR(500) NOT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (commentId)
        REFERENCES comments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (parentReplyId)
        REFERENCES comment_replies(id)
        ON DELETE CASCADE,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);



CREATE TABLE comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    commentId INT NOT NULL,

    userId INT NOT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (commentId, userId),

    FOREIGN KEY (commentId)
        REFERENCES comments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);



-- Performance Indexes
CREATE INDEX idx_post_likes_postId
ON post_likes(postId);

CREATE INDEX idx_comment_likes_commentId
ON comment_likes(commentId);

CREATE INDEX idx_comment_replies_commentId
ON comment_replies(commentId);

CREATE INDEX idx_posts_createdAt
ON posts(createdAt);

CREATE INDEX idx_posts_userId
ON posts(userId);

CREATE INDEX idx_comments_postId_createdAt
ON comments(postId, createdAt);

CREATE INDEX idx_comment_replies_commentId_createdAt
ON comment_replies(commentId, createdAt);






CREATE TABLE reply_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    replyId INT NOT NULL,

    userId INT NOT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (replyId, userId),

    FOREIGN KEY (replyId)
        REFERENCES comment_replies(id)
        ON DELETE CASCADE,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);




CREATE TABLE connections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    requesterId INT NOT NULL,

    recipientId INT NOT NULL,

    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (requesterId, recipientId),

    FOREIGN KEY (requesterId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (recipientId)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_connections_recipient_status
ON connections(recipientId, status);

CREATE INDEX idx_connections_pair_status
ON connections(requesterId, recipientId, status);




CREATE TABLE opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    type ENUM('JOB', 'INTERNSHIP', 'SCHOLARSHIP', 'EVENT', 'TRAINING', 'WORKSHOP', 'OTHER') NOT NULL,

    content TEXT NOT NULL,

    isCvRequired BOOLEAN DEFAULT FALSE,

    status ENUM('ACTIVE', 'CLOSED') DEFAULT 'ACTIVE',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE opportunity_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    opportunityId INT NOT NULL,

    studentId INT NOT NULL,

    cvUrl VARCHAR(500) DEFAULT NULL,

    status ENUM('APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED') DEFAULT 'APPLIED',

    message TEXT DEFAULT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (opportunityId, studentId),

    FOREIGN KEY (opportunityId)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    FOREIGN KEY (studentId)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_opportunities_type
ON opportunities(type);

CREATE INDEX idx_opportunities_status
ON opportunities(status);

CREATE INDEX idx_opportunities_createdAt
ON opportunities(createdAt DESC);

CREATE INDEX idx_opportunities_userId
ON opportunities(userId);

CREATE INDEX idx_opp_apps_opportunityId
ON opportunity_applications(opportunityId);

CREATE INDEX idx_opp_apps_studentId
ON opportunity_applications(studentId);

CREATE INDEX idx_opp_apps_status
ON opportunity_applications(status);




CREATE TABLE event_creator_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    grantedBy INT NOT NULL,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (userId),

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (grantedBy)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    creatorUserId INT NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    location VARCHAR(255) NOT NULL,

    eventDate DATETIME NOT NULL,

    registrationDeadline DATETIME NOT NULL,

    registrationFee DECIMAL(10, 2) DEFAULT 0.00,

    isFree BOOLEAN DEFAULT TRUE,

    maxParticipants INT DEFAULT NULL,

    contactInfo VARCHAR(255) NOT NULL,

    bannerImageUrl VARCHAR(500) DEFAULT NULL,

    isRegistrationOpen BOOLEAN DEFAULT TRUE,

    status ENUM('ACTIVE', 'CLOSED', 'CANCELLED') DEFAULT 'ACTIVE',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    updatedAt DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (creatorUserId)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    eventId INT NOT NULL,

    userId INT NOT NULL,

    stripeSessionId VARCHAR(255) DEFAULT NULL,

    paymentIntentId VARCHAR(255) DEFAULT NULL,

    amount DECIMAL(10, 2) DEFAULT 0.00,

    paymentStatus ENUM('FREE', 'PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',

    registrationStatus ENUM('REGISTERED', 'ATTENDED', 'CANCELLED', 'FAILED') DEFAULT 'REGISTERED',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (eventId, userId),

    FOREIGN KEY (eventId)
        REFERENCES events(id)
        ON DELETE CASCADE,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_ecp_userId
ON event_creator_permissions(userId);

CREATE INDEX idx_events_status
ON events(status);

CREATE INDEX idx_events_eventDate
ON events(eventDate DESC);

CREATE INDEX idx_events_creatorUserId
ON events(creatorUserId);

CREATE INDEX idx_er_eventId
ON event_registrations(eventId);

CREATE INDEX idx_er_userId
ON event_registrations(userId);

CREATE INDEX idx_er_stripeSessionId
ON event_registrations(stripeSessionId);

CREATE INDEX idx_er_paymentStatus
ON event_registrations(paymentStatus);


CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    userId INT NOT NULL,

    actorUserId INT DEFAULT NULL,

    type VARCHAR(50) NOT NULL,

    entityType VARCHAR(50) DEFAULT NULL,

    referenceId INT DEFAULT NULL,

    message VARCHAR(300) NOT NULL,

    isRead BOOLEAN DEFAULT FALSE,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (actorUserId)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user_read_created
ON notifications(userId, isRead, createdAt DESC);