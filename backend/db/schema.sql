CREATE DATABASE IF NOT EXISTS aceinterview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aceinterview;

CREATE TABLE IF NOT EXISTS companies (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, display_order INT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tech_roles (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, display_order INT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS interview_types (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, display_order INT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_login_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, tech_role_id BIGINT, interview_type_id BIGINT, company_id BIGINT,
    role VARCHAR(255) NOT NULL, interview_type VARCHAR(100) NOT NULL, company VARCHAR(255), experience_level VARCHAR(50) NOT NULL DEFAULT 'Entry (0-2 yrs)', status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME,
    CONSTRAINT fk_interview_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_sessions_role FOREIGN KEY (tech_role_id) REFERENCES tech_roles(id),
    CONSTRAINT fk_interview_sessions_type FOREIGN KEY (interview_type_id) REFERENCES interview_types(id),
    CONSTRAINT fk_interview_sessions_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, tech_role_id BIGINT NOT NULL, interview_type_id BIGINT NOT NULL, company_id BIGINT,
    question_text TEXT NOT NULL, normalized_text VARCHAR(768) NOT NULL, category VARCHAR(100) NOT NULL, topic VARCHAR(150) NOT NULL,
    difficulty VARCHAR(50) NOT NULL, source_type VARCHAR(30) NOT NULL, expected_answer_summary LONGTEXT NOT NULL,
    review_status VARCHAR(30) NOT NULL DEFAULT 'Draft', active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_questions_normalized_text UNIQUE (normalized_text),
    CONSTRAINT chk_questions_difficulty CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    CONSTRAINT chk_questions_source CHECK (source_type IN ('SHARED', 'COMPANY_SPECIFIC')),
    CONSTRAINT chk_questions_status CHECK (review_status IN ('Draft', 'Review', 'Approved', 'Retired')),
    CONSTRAINT chk_questions_company_source CHECK ((source_type = 'SHARED' AND company_id IS NULL) OR (source_type = 'COMPANY_SPECIFIC' AND company_id IS NOT NULL)),
    CONSTRAINT fk_questions_role FOREIGN KEY (tech_role_id) REFERENCES tech_roles(id),
    CONSTRAINT fk_questions_type FOREIGN KEY (interview_type_id) REFERENCES interview_types(id),
    CONSTRAINT fk_questions_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS rubric_criteria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, question_id BIGINT NOT NULL, criterion_order TINYINT NOT NULL,
    criterion_name VARCHAR(150) NOT NULL, description TEXT NOT NULL, expected_evidence TEXT NOT NULL,
    acceptable_alternatives TEXT, keywords TEXT, weight INT NOT NULL,
    importance VARCHAR(20) NOT NULL DEFAULT 'SUPPORTING', rubric_version INT NOT NULL DEFAULT 1,
    evidence_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', semantic_description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_rubric_question_order UNIQUE (question_id, criterion_order),
    CONSTRAINT chk_rubric_order CHECK (criterion_order BETWEEN 1 AND 5),
    CONSTRAINT chk_rubric_weight CHECK (weight BETWEEN 1 AND 100),
    CONSTRAINT fk_rubric_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rubric_evidence_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, rubric_criterion_id BIGINT NOT NULL, group_order INT NOT NULL,
    concept VARCHAR(200) NOT NULL, description TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evidence_group_order UNIQUE (rubric_criterion_id, group_order),
    CONSTRAINT fk_evidence_group_criterion FOREIGN KEY (rubric_criterion_id) REFERENCES rubric_criteria(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence_terms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, evidence_group_id BIGINT NOT NULL, term_type VARCHAR(20) NOT NULL,
    term_value VARCHAR(500) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evidence_term UNIQUE (evidence_group_id, term_type, term_value),
    CONSTRAINT chk_evidence_term_type CHECK (term_type IN ('TERM','ALTERNATIVE','INCORRECT')),
    CONSTRAINT fk_evidence_term_group FOREIGN KEY (evidence_group_id) REFERENCES rubric_evidence_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, interview_session_id BIGINT NOT NULL, question_id BIGINT NOT NULL,
    question_order INT NOT NULL, source_type VARCHAR(30) NOT NULL, assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_question UNIQUE (interview_session_id, question_id),
    CONSTRAINT uq_session_question_order UNIQUE (interview_session_id, question_order),
    CONSTRAINT fk_session_questions_session FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_questions_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- This existing table is the user_answers store. Its name is retained for backward compatibility.
CREATE TABLE IF NOT EXISTS answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, interview_session_id BIGINT NOT NULL, question_id BIGINT NOT NULL,
    answer_text TEXT NOT NULL, score INT, feedback TEXT, covered_concepts TEXT, missing_concepts TEXT,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_answers_session_question UNIQUE (interview_session_id, question_id),
    CONSTRAINT chk_answers_score CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    CONSTRAINT fk_answers_session FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS answer_rubric_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, answer_id BIGINT NOT NULL, rubric_criterion_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL, awarded_points INT NOT NULL, maximum_points INT NOT NULL,
    matched_evidence TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_answer_rubric_score UNIQUE (answer_id, rubric_criterion_id),
    CONSTRAINT chk_answer_rubric_status CHECK (status IN ('FULL', 'PARTIAL', 'MISSING')),
    CONSTRAINT fk_answer_rubric_answer FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_rubric_criterion FOREIGN KEY (rubric_criterion_id) REFERENCES rubric_criteria(id)
);

CREATE TABLE IF NOT EXISTS question_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, question_id BIGINT NOT NULL,
    shown_count INT NOT NULL DEFAULT 0, answered_count INT NOT NULL DEFAULT 0,
    first_shown_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_shown_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_answered_at DATETIME,
    CONSTRAINT uq_history_user_question UNIQUE (user_id, question_id),
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, interview_session_id BIGINT NOT NULL UNIQUE, overall_score INT NOT NULL,
    technical_score INT, behavioral_score INT, concept_score INT, algorithm_score INT, communication_score INT,
    problem_solving_score INT, system_design_score INT, strengths TEXT, improvements TEXT, summary_feedback TEXT,
    result_details LONGTEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_session FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

INSERT INTO companies (name, display_order) VALUES ('Google', 1), ('Microsoft', 2), ('Amazon', 3), ('Apple', 4), ('Meta', 5)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order), active = TRUE;

INSERT INTO tech_roles (name, display_order) VALUES
('Software Engineer', 1), ('Frontend Developer', 2), ('Backend Developer', 3), ('Full-Stack Developer', 4), ('Data Scientist', 5),
('ML / AI Engineer', 6), ('Cloud / DevOps Engineer', 7), ('Mobile Developer', 8), ('Cybersecurity Analyst', 9), ('QA / Test Engineer', 10)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order), active = TRUE;

INSERT INTO interview_types (name, display_order) VALUES ('Technical', 1), ('Behavioral', 2), ('System Design', 3)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order), active = TRUE;
