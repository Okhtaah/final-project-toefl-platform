-- ============================================
-- TOEFL Platform - PostgreSQL Schema
-- ============================================
-- Converted from MySQL to PostgreSQL
-- Uses CHECK constraints instead of ENUM
-- Uses VARCHAR(36) for UUID primary keys
-- ============================================

-- Drop tables in reverse dependency order (for re-runs)
DROP TABLE IF EXISTS Submissions CASCADE;
DROP TABLE IF EXISTS TestAttempts CASCADE;
DROP TABLE IF EXISTS Materials CASCADE;
DROP TABLE IF EXISTS Messages CASCADE;
DROP TABLE IF EXISTS UserAccess CASCADE;
DROP TABLE IF EXISTS AccessCodes CASCADE;
DROP TABLE IF EXISTS AnswerOptions CASCADE;
DROP TABLE IF EXISTS Questions CASCADE;
DROP TABLE IF EXISTS Tasks CASCADE;
DROP TABLE IF EXISTS Sections CASCADE;
DROP TABLE IF EXISTS Courses CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- ============================================
-- Users
-- ============================================
CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'STUDENT'
        CHECK (role IN ('ADMIN', 'STUDENT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Courses
-- ============================================
CREATE TABLE Courses (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE
);

-- ============================================
-- Sections
-- ============================================
CREATE TABLE Sections (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    section_order INT NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    category VARCHAR(10) CHECK (category IN ('READING','LISTENING','WRITING','SPEAKING')),
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

-- ============================================
-- Tasks
-- ============================================
CREATE TABLE Tasks (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(30) NOT NULL
        CHECK (task_type IN (
            'COMPLETE_WORDS', 'MCQ', 'ACADEMIC_PASSAGE',
            'SHORT_LISTENING', 'CONVERSATION', 'BUILD_SENTENCE',
            'WRITE_EMAIL', 'ACADEMIC_DISCUSSION', 'REPEAT', 'INTERVIEW'
        )),
    instructions TEXT,
    time_limit_seconds INT,
    task_order INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES Sections(id) ON DELETE CASCADE
);

-- ============================================
-- Questions
-- ============================================
CREATE TABLE Questions (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    prompt TEXT,
    text_content TEXT,
    media_url VARCHAR(255),
    question_order INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
);

-- ============================================
-- AnswerOptions
-- ============================================
CREATE TABLE AnswerOptions (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    content VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
);

-- ============================================
-- AccessCodes
-- ============================================
CREATE TABLE AccessCodes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    target_type VARCHAR(10) NOT NULL
        CHECK (target_type IN ('COURSE', 'SECTION', 'TASK', 'MATERIAL')),
    target_id VARCHAR(36) NOT NULL,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- UserAccess
-- ============================================
CREATE TABLE UserAccess (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    access_code_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(10) NOT NULL
        CHECK (target_type IN ('COURSE', 'SECTION', 'TASK', 'MATERIAL')),
    target_id VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (access_code_id) REFERENCES AccessCodes(id) ON DELETE CASCADE
);

-- ============================================
-- Messages
-- ============================================
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

-- ============================================
-- Materials
-- ============================================
CREATE TABLE Materials (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    material_type VARCHAR(10) NOT NULL
        CHECK (material_type IN ('PDF', 'TEXT')),
    is_free BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

-- ============================================
-- TestAttempts
-- ============================================
CREATE TABLE TestAttempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(15) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED')),
    total_score FLOAT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

-- ============================================
-- Submissions
-- ============================================
CREATE TABLE Submissions (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    text_response TEXT,
    audio_response_url VARCHAR(255),
    auto_score FLOAT,
    manual_score FLOAT,
    review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
        CHECK (review_status IN ('AUTO_GRADED', 'PENDING_REVIEW', 'MANUALLY_GRADED')),
    admin_feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES TestAttempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_sections_course ON Sections(course_id);
CREATE INDEX idx_tasks_section ON Tasks(section_id);
CREATE INDEX idx_questions_task ON Questions(task_id);
CREATE INDEX idx_answeroptions_question ON AnswerOptions(question_id);
CREATE INDEX idx_useraccess_user ON UserAccess(user_id);
CREATE INDEX idx_useraccess_target ON UserAccess(target_type, target_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_receiver ON Messages(receiver_id);
CREATE INDEX idx_materials_course ON Materials(course_id);
CREATE INDEX idx_testattempts_user ON TestAttempts(user_id);
CREATE INDEX idx_testattempts_course ON TestAttempts(course_id);
CREATE INDEX idx_submissions_attempt ON Submissions(attempt_id);
CREATE INDEX idx_submissions_question ON Submissions(question_id);
CREATE INDEX idx_submissions_review ON Submissions(review_status);

-- ============================================
-- Seed: Default admin user
-- Email: admin@toefl.com  |  Password: admin123
-- ============================================
INSERT INTO Users (id, email, password_hash, full_name, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@toefl.com',
    '$2a$10$Ocb5kn3EMxhL8pMJDxujr.KZ5DP5T0.s8rSruwbVW2FxF./8BFJ1C',
    'Platform Admin',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Announcements
-- ============================================
CREATE TABLE Announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
