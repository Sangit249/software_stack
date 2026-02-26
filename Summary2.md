# Community Language Learn & Teach (CLLT)

> A full stack peer to peer language education platform built with Node.js, MySQL, and Docker.

---

## Table of Contents

- [Introduction](#introduction)
- [Core Concept](#core-concept)
- [User Roles](#user-roles)
- [Key Features](#key-features)
- [Ethical Considerations](#ethical-considerations)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)

---

## Introduction

The **Community Language Learn & Teach** platform is a digital bridge designed to connect passionate educators with eager learners. Unlike static learning apps, this platform focuses on **human interaction** and **community driven content**, allowing users to fluidly swap roles between student and teacher, even across different languages simultaneously.

A user might be teaching English to a French speaker whilst learning Japanese from another member, all within the same account. This dual role flexibility is central to the platform's philosophy of community-based language exchange, and will allow users to gain an incentive to teach on the platform. ( since they will also be learning from someone else )

Built on a containerised Node.js and MySQL stack, the platform provides a robust environment for educators to manage their curriculum and for learners to progress toward fluency within a supportive community.

---

## Core Concept

CLLT is a **fully text and chat based** language learning platform. There are no voice or video calls, all communication between users happens through the platform's messaging system. This keeps interactions accessible, asynchronous-friendly, and safe for users of all technical abilities.

Users register for a single account and can then enrol in any number of languages, choosing a role for each one independently. This means the system must track not just who a user is, but what role they hold in each specific language context.

---

## User Roles

The platform uses a **per-language role system**, meaning a user's role is not global but tied to each language they participate in.

| Role | Value | Description |
|------|-------|-------------|
| Learner | `0` | Enrolled in a language to learn. Can access lessons, reading materials, quizzes, and message their assigned teacher. |
| Teacher | `1` | Registered to teach a language. Can create and manage lesson content, set quizzes, and communicate with students via chat. |

> A single user can hold both roles across different languages with no restrictions.

---

## Key Features

### Account & Profile System
- Secure user registration and login with hashed credentials
- Personal profile displaying languages being learnt and languages being taught
- Per-language role management from within the user dashboard

###  Chat & Messaging System
- One-to-one messaging between a teacher and their students
- Fully text-based — no voice or video functionality
- Message history stored and retrievable, maintaining a continuous learning conversation
- Teachers can send lesson notes, corrections, and feedback directly through chat

### Lesson & Content Management
- Teachers can create and upload written lesson materials and reading content
- Structured lesson library per language, accessible to enrolled learners
- Cultural reading modules to support literacy and comprehension

### Quizzes & Progress Tracking
- Teachers can build custom quizzes for their students
- Learners have a personal progress dashboard showing quiz results and activity
- Performance data stored per user, per language

---

## Ethical Considerations

| Issue | Description |
|-------|-------------|
| **Data Privacy** | The application stores personal data including user profiles and message histories, which must be handled responsibly in line with good data protection practices. |
| **User Safety & Trust** | Since users interact with people they may not know, the platform must guard against harassment or misuse through clear community guidelines and reporting mechanisms. |
| **Accessibility & Inclusion** | The interface should be designed with clarity and simplicity so that users of varying technical ability and language confidence are not excluded. |
| **Fair Use** | The platform is intended for genuine community based language exchange and should not be misused for commercial promotion or spam. |

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js with Express |
| Database | MySQL (via `mysql2` package) |
| DB Management | PHPMyAdmin |
| Containerisation | Docker & Docker Compose |
| Environment Config | `.env` file via `dotenv` package |
| Live Reloading | Supervisor (auto rebuilds on file changes) |

---

## Getting Started

Make sure you have Docker installed and no conflicting containers running.

```bash
# Check for running containers
docker ps

# Build and start the project
docker-compose up --build
```

Once running, visit:

| Service | URL |
|---------|-----|
| Express App | http://localhost:3000 |
| PHPMyAdmin | http://localhost:8081 |

### Connecting to the Database in Node.js

Include the `db.js` service in any file that requires database interaction:

```js
const db = require('./services/db');
```

### Useful Docker Commands

```bash
# Open a shell in a running container
docker exec -it <container_name> bash -l

# Access the MySQL CLI from inside the database container
mysql -uroot -p<password>
```

---

> Built as part of a group software engineering project at the University of Roehampton.
