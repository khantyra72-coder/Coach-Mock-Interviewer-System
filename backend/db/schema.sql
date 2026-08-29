USE aceinterview;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(255) NOT NULL,
    interview_type VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    CONSTRAINT fk_interview_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_text TEXT NOT NULL,
    score INT,
    feedback TEXT,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_session
        FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS interview_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_session_id BIGINT NOT NULL UNIQUE,
    overall_score INT NOT NULL,
    strengths TEXT,
    improvements TEXT,
    summary_feedback TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_session
        FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id)
        ON DELETE CASCADE
);

 
INSERT INTO questions (question_text, category, difficulty, active)
SELECT seed.question_text, seed.category, seed.difficulty, TRUE
FROM (
    SELECT 'Explain the difference between an interface and an abstract class in Java.'
        AS question_text, 'Technical' AS category, 'Medium' AS difficulty
    UNION ALL
    SELECT 'What is dependency injection and why is it useful?',
        'Technical', 'Medium'
    UNION ALL
    SELECT 'How would you design a scalable mock interview platform?',
        'System Design', 'Hard'
    UNION ALL
    SELECT 'How would you store interview sessions and answers?',
        'System Design', 'Medium'
    UNION ALL
    SELECT 'Tell me about a difficult problem you solved.',
        'Behavioral', 'Medium'
    UNION ALL
    SELECT 'Describe a time you worked successfully in a team.',
        'Behavioral', 'Easy'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM questions);