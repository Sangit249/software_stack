# Community Language Learn & Teach (CLLT)

A full stack peer to peer language education platform built with Node.js, MySQL, and Docker.

---

## Table of Contents

- [Introduction](#introduction)
- [Core Concept](#core-concept)
- [User Roles](#user-roles)
- [Key Features](#key-features)
- [Ethical Considerations](#ethical-considerations)
- [Technical Stack](#technical-stack)

---

## Introduction

The **Community Language Learn & Teach** platform is designed to connect passionate educators with eager learners in a structured yet flexible online environment. Unlike static language learning apps that rely solely on pre-built content, this platform puts real human interaction at the centre of the learning experience. The goal is to create a community where people can genuinely teach and learn from one another, rather than just consuming content passively.

What makes CLLT unique is its dual role system. A user is not locked into being either a student or a teacher — they can be both, depending on the language. Someone might be teaching English to a French speaker whilst simultaneously learning Japanese from another member of the platform, all under the same account. This flexibility reflects how language learning works in the real world, where people are often at very different stages depending on the language in question.

The platform is built on a containerised Node.js and MySQL stack, providing a stable and scalable foundation for managing users, content, messaging, and progress tracking across multiple languages and user pairings.

---

## Core Concept

CLLT is a fully text and chat based language learning platform. There are no voice or video calls — all communication between users takes place through the platform's built in messaging system. This design decision keeps the platform accessible to users regardless of their hardware setup or internet connection quality, and also makes interactions easier to moderate and keep safe.

Users create a single account and can then enrol in as many languages as they like, choosing a separate role for each one. This means the system needs to keep track not just of who a user is, but what role they hold within each specific language they are participating in. A learner studying Spanish has a completely different context to the same user teaching French, and the platform handles both simultaneously without any conflict.

The chat system is the backbone of the learning experience. Rather than simply watching videos or completing exercises in isolation, learners are expected to actively communicate with their teacher, ask questions, receive corrections, and work through material together in conversation. Teachers can supplement these conversations by uploading written lesson content and setting quizzes, but the messaging system is always at the core of how progress is made.

---

## User Roles

The platform uses a per language role system, meaning a user's role is not a single global setting but is instead tied to each individual language they are enrolled in.

| Role | Value | Description |
|------|-------|-------------|
| Learner | `0` | Enrolled in a language to learn. Can access lessons, reading materials, quizzes, and message their assigned teacher. |
| Teacher | `1` | Registered to teach a language. Can create and manage lesson content, set quizzes, and communicate with students via chat. |

A **Learner (Role 0)** is a user who has enrolled in a language with the intention of studying it. Learners can access lesson materials and reading content uploaded by their teacher, complete quizzes, view their progress dashboard, and most importantly, communicate directly with their assigned teacher through the chat system.

A **Teacher (Role 1)** is a user who has registered to teach a particular language. Teachers are responsible for creating and managing lesson content, building quizzes for their students, and maintaining an ongoing dialogue with learners through the messaging system. They can provide written feedback, corrections, and guidance all within the chat interface.

There are no restrictions on holding both roles at once across different languages. A user who is a teacher of one language and a learner of another will see both contexts clearly reflected in their profile and dashboard.

---

## Key Features

### Account and Profile System

Users register for an account with secure login credentials, which are stored safely using password hashing. Once registered, a user's profile gives a clear overview of which languages they are currently learning, which languages they are teaching, and their overall activity on the platform. Role management is handled on a per language basis from within the user dashboard, making it straightforward to enrol in a new language or register as a teacher.

- Secure registration and login with hashed credentials
- Profile overview of languages being learnt and taught
- Per language role management from the user dashboard

### Chat and Messaging System

The messaging system is the primary way users interact on the platform. All conversations are one to one, taking place between a specific teacher and a specific student. Message history is stored persistently so that both parties can refer back to previous conversations, which is particularly useful for reviewing corrections or revisiting explanations. Teachers can use the chat to send lesson notes, provide written feedback on exercises, answer questions, and guide the learner through material at a pace that suits them.

- One to one messaging between teacher and student
- Fully text based — no voice or video functionality
- Persistent message history for both parties
- Teachers can send notes, corrections, and feedback directly through chat

### Lesson and Content Management

Teachers have access to a content management area where they can create and upload written lesson materials, cultural reading texts, and structured exercises. All content is organised by language and is made available to enrolled learners through their dashboard. The reading modules are designed not just to build vocabulary and grammar, but also to introduce learners to the cultural context behind the language, which is an important part of achieving genuine fluency.

- Teachers can create and upload written lesson materials and reading content
- Content is organised by language and accessible to enrolled learners
- Cultural reading modules to support literacy and comprehension

### Quizzes and Progress Tracking

Teachers can build custom quizzes tailored to the material they have been covering with their students. These quizzes are assigned to specific learners and the results are recorded against each user's profile. Learners can view their progress over time through a personal dashboard that tracks quiz performance and overall activity. This gives both the teacher and the learner a clear picture of how far they have come and where more focus might be needed.

- Teachers can build custom quizzes for their students
- Results are recorded per user, per language
- Learners have a personal progress dashboard showing quiz scores and activity

---

## Ethical Considerations

**Data Privacy** is one of the most important considerations for a platform of this kind. CLLT stores personal information including user profiles, message histories, and performance data. All of this must be handled responsibly, stored securely, and never shared without the user's knowledge. Good data handling practices need to be built into the application from the ground up rather than treated as an afterthought.

**User Safety and Trust** is equally critical. Because users are communicating with people they may never have met in person, there is always a risk of inappropriate behaviour, harassment, or misuse of the messaging system. The platform needs to have clear community guidelines in place, and there should be a mechanism for users to report concerns so that they can be addressed promptly.

**Accessibility and Inclusion** is something the design of the platform needs to take seriously. Users will come from a wide range of technical backgrounds and varying levels of language confidence. If the interface is confusing or the content is poorly structured, certain users will be effectively excluded from the platform. The design should prioritise clarity and ease of use so that the focus remains on learning rather than navigating the application itself.

**Fair Use of the Platform** is also worth considering. Although CLLT is intended for genuine community based language exchange, there is always the possibility that some users might attempt to use it for commercial promotion or other purposes outside of its intended scope. Setting clear terms of use and building in some level of content moderation will help protect the integrity of the platform and the community it serves.

---

## Technical Stack

The backend of the application is built using **Node.js** with the **Express** framework, which handles routing, middleware, and all server side logic. The database layer uses **MySQL**, accessed through the **mysql2** package to ensure compatibility with MySQL 8. Database administration during development is handled through **PHPMyAdmin**, which provides a visual interface for managing tables and running queries.

The entire development environment is containerised using **Docker** and **Docker Compose**, meaning all team members work in an identical environment regardless of their local machine setup. This eliminates the classic problem of code working on one developer's machine but not another's. Environment variables such as database credentials are managed through a **.env** file using the **dotenv** package, keeping sensitive information out of the codebase. During development, **Supervisor** is used to watch for file changes and automatically restart the Node.js server, which keeps the development workflow smooth and efficient.

| Component | Technology |
|-----------|------------|
| Backend | Node.js with Express |
| Database | MySQL via `mysql2` |
| DB Management | PHPMyAdmin |
| Containerisation | Docker and Docker Compose |
| Environment Config | `.env` file via `dotenv` |

