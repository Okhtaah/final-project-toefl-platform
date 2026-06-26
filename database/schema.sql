CREATE DATABASE IF NOT EXISTS toefl_db;
USE toefl_db;

CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Courses (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE
);

CREATE TABLE Sections (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    section_order INT NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

CREATE TABLE Tasks (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    task_type ENUM('COMPLETE_WORDS', 'MCQ', 'ACADEMIC_PASSAGE', 'SHORT_LISTENING', 'CONVERSATION', 'BUILD_SENTENCE', 'WRITE_EMAIL', 'ACADEMIC_DISCUSSION', 'REPEAT', 'INTERVIEW') NOT NULL,
    instructions TEXT,
    time_limit_seconds INT,
    task_order INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES Sections(id) ON DELETE CASCADE
);

CREATE TABLE Questions (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    prompt TEXT,
    text_content TEXT,
    media_url VARCHAR(255),
    question_order INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
);

CREATE TABLE AnswerOptions (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    content VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
);

CREATE TABLE AccessCodes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    target_type ENUM('COURSE', 'SECTION', 'TASK', 'MATERIAL') NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UserAccess (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    access_code_id VARCHAR(36) NOT NULL,
    target_type ENUM('COURSE', 'SECTION', 'TASK', 'MATERIAL') NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (access_code_id) REFERENCES AccessCodes(id) ON DELETE CASCADE
);

CREATE TABLE Messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Materials (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    material_type ENUM('PDF', 'TEXT') NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

CREATE TABLE TestAttempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED') DEFAULT 'IN_PROGRESS',
    total_score FLOAT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

CREATE TABLE Submissions (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    text_response TEXT,
    audio_response_url VARCHAR(255),
    auto_score FLOAT,
    manual_score FLOAT,
    review_status ENUM('AUTO_GRADED', 'PENDING_REVIEW', 'MANUALLY_GRADED') DEFAULT 'PENDING_REVIEW',
    admin_feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES TestAttempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
);
