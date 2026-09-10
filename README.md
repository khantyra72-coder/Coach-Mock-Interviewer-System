# Coach Mock Interviewer System

AceInterview is a full-stack mock interview practice system built with React, Java Spring Boot, JWT authentication, and MySQL.

## Features

- User registration and login
- BCrypt password hashing
- JWT-protected API endpoints
- Technical, behavioral, and system-design questions
- Interview session and answer storage
- Automatic result calculation
- Interview history
- Dashboard statistics
- Progress reports
- Company and role filters

## Technology

### Frontend

- React
- Vite
- React Router
- Lucide React

### Backend

- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT

### Database

- MySQL
- H2 for automated tests

## Requirements

Install these before running the project:

- Java 17 or newer
- Node.js 22 or newer
- npm
- MySQL
- Git

## 1. Clone the repository

```bash
git clone https://github.com/khantyra72-coder/Coach-Mock-Interviewer-System.git
cd Coach-Mock-Interviewer-System

2. Create the MySQL database
Log in to MySQL:
mysql -u root -p
Create the database and application user. Replace YOUR_APP_PASSWORD with a strong local password:
CREATE DATABASE IF NOT EXISTS aceinterview
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'aceinterview_app'@'localhost'
IDENTIFIED BY 'YOUR_APP_PASSWORD';

ALTER USER 'aceinterview_app'@'localhost'
IDENTIFIED BY 'YOUR_APP_PASSWORD';

GRANT ALL PRIVILEGES ON aceinterview.*
TO 'aceinterview_app'@'localhost';

FLUSH PRIVILEGES;
EXIT;
Load the schema and starter questions:
mysql -u aceinterview_app -p aceinterview < backend/db/schema.sql

3. Create local backend settings
Create:
backend/src/main/resources/application-local.properties
Add:
spring.datasource.url=jdbc:mysql://localhost:3306/aceinterview?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=aceinterview_app
spring.datasource.password=YOUR_APP_PASSWORD

app.jwt.secret=YOUR_RANDOM_JWT_SECRET
app.jwt.expiration-ms=86400000

# Local administrator account (choose your own strong values)
app.admin.enabled=true
app.admin.name=AceInterview Admin
app.admin.email=admin@aceinterview.local
app.admin.password=YOUR_ADMIN_PASSWORD

spring.jpa.hibernate.ddl-auto=validate
Generate a JWT secret with:
openssl rand -hex 32
Do not commit application-local.properties. It is ignored by Git.

4. Run the backend
cd backend
sh mvnw spring-boot:run
The backend runs at:
http://localhost:8080

5. Run the frontend
Open another terminal:
cd frontend
npm install
npm run dev
The frontend normally runs at:
http://localhost:5173

The frontend connects to port `8080` on the same hostname that served the page.
If your backend uses another port, copy `frontend/.env.example` to
`frontend/.env.local`, set `VITE_API_PORT`, and restart Vite. Set
`VITE_API_BASE_URL` only when the API uses a completely different host.
The `.env.local` file is ignored by Git.

### Open the development app from another device

Keep both devices on the same trusted Wi-Fi network and run the backend and
frontend normally. Find the host computer's IPv4 address with `ipconfig`, then
open `http://HOST_IPV4:5173` on the other device—for example,
`http://192.168.1.20:5173`. If Windows asks, allow Java and Node.js on **Private
networks**. Only accounts whose database role is `ADMIN` can open the admin
dashboard.

6. Run tests
Backend:
cd backend
sh mvnw test
Frontend production build:
cd frontend
npm run build
Main API endpoints
POST /api/register
POST /api/login
GET  /api/me

POST /api/interviews
GET  /api/interviews
GET  /api/interviews/questions
POST /api/interviews/{sessionId}/answers
POST /api/interviews/{sessionId}/complete
GET  /api/interviews/{sessionId}
Protected endpoints require:
Authorization: Bearer <JWT_TOKEN>
Security notes
- Never commit database passwords.
- Never commit JWT secrets.
- Never commit administrator credentials. Keep them in `application-local.properties` or environment variables.
- Do not run the Java application with the MySQL root account.
- Use environment variables or private local configuration in production.

## AI Scoring Setup

Interview answers are evaluated using AI through OpenRouter. Each developer must create their own OpenRouter API key at [OpenRouter](https://openrouter.ai/keys).

The API key must be configured as an environment variable before starting the backend.

### macOS or Linux

```bash
cd backend
export OPENROUTER_API_KEY='your-private-api-key'
sh mvnw spring-boot:run
```

### Windows PowerShell

```powershell
cd backend
$env:OPENROUTER_API_KEY='your-private-api-key'
.\mvnw.cmd spring-boot:run
```

Replace your-private-api-key with your own OpenRouter key. Start the backend from the same terminal where the environment variable was set.
The application uses OpenRouter's free-model router by default. Free models may occasionally respond slowly, become temporarily unavailable, or produce slightly different scores.
If the key is missing or OpenRouter is unavailable, the application automatically
uses its local evidence-aware rubric scorer so candidates can still submit answers.
Security: Never commit an API key to GitHub, place it in frontend code, include it in screenshots, or share it with teammates. Each developer should use their own key.
