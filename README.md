# 🍿 Netflix AI Watch Spaces

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-2.7-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue.svg)](https://www.postgresql.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-orange.svg)]()
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-blueviolet.svg)]()

Netflix AI Watch Spaces is a next-generation, high-scale interactive co-watching platform. It blends traditional synchronized media playback with a real-time Generative AI Copilot and interactive "choose-your-own-adventure" narrative voting.

Built with **React**, **TypeScript**, and **Tailwind CSS** on the frontend, and backed by a heavily optimized, distributed **Java Spring Boot / WebFlux** architecture.

---

## ✨ Core Features

- 🔄 **Real-Time Synchronized Playback**: Sub-250ms drift correction across global sessions. If the host pauses the video, it pauses for everyone simultaneously.
- 🧠 **AI Contextual Copilot**: Integrated with Google Gemini 2.0. Users can ask questions about the movie while watching. The AI is strictly grounded via semantic vector search (`pgvector`) to the current timestamp and authored scene metadata.
- 🔀 **Interactive Story Branching**: Similar to *Black Mirror: Bandersnatch*, audiences can vote in real-time to alter the narrative branch of the movie.
- 🛡️ **Role-Based Access Control**: Granular permissions (Admin, Host, Viewer) with secure JWT rotation and room moderation capabilities.
- 🎬 **Admin Content Management System (CMS)**: An integrated dashboard for admins to securely upload raw `.mp4` video files to Cloud Storage via pre-signed URLs, construct movie metadata, and orchestrate timeline trivia events.

## 🏗️ Architecture

The system is designed for massive concurrency and low latency:
1. **React SPA**: A highly polished, glassmorphism-themed client built on the *Stitch* design system.
2. **Spring WebFlux Gateway**: A reactive WebSocket broker handling real-time playback telemetry, chat syncing, and participant rosters.
3. **Spring Boot API**: RESTful management of Auth, User Profiles, Watch Space ticketing, and Recommendations.
4. **Neon PostgreSQL**: Serverless database utilizing Flyway migrations and `pgvector` for AI semantic search embeddings.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Java 11
- Maven
- A Neon PostgreSQL Database (or local PostgreSQL 14+)
- Google Cloud Vertex AI / Gemini API Key

### 1. Environment Setup
Create a `.env` file in the root directory (use `.env.example` as a template) and provide your Database and JWT secrets.

### 2. Run the Backend (Java/Spring Boot)
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
*(The backend will run on `http://localhost:8081`)*

### 3. Run the Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```
*(The frontend will run on `http://localhost:5173`)*

## 🧪 Testing

The codebase is fortified with extensive automated testing spanning unit, integration, and E2E boundaries.

**Backend Unit & Integration Tests (JUnit)**
```bash
cd backend
mvn test
```

**Frontend End-to-End Tests (Playwright)**
```bash
cd frontend
npm run test:e2e
```

**Concurrency Stress Testing (Artillery/Locust)**
```bash
cd tests/load
node run-stress-test.mjs
```

## 📝 License
This project is for demonstration and architectural showcase purposes. All rights reserved.
