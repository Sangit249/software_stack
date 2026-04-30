## 🌐 LingoConnect

A language exchange web platform connecting learners and teachers globally. Users find language partners, manage availability, and build profiles tailored to their learning goals.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Features

- **Email verification** — 6-digit code, 5-min expiry, resend invalidates old codes
- **Profile completion** — languages, availability, interests, learning preferences
- **Language search** — find users by the language they speak or are learning
- **Categories & languages** — browse languages grouped by region/type
- **Auth & sessions** — bcrypt password hashing, server-side session management
- **Admin dashboard** — role-protected routes to manage users and reports

---

## Safety

| Measure | Detail |
|---------|--------|
| Password hashing | bcrypt — plain-text passwords never stored |
| Email verification | Required before platform access — reduces fake accounts |
| Role-based access | Admin middleware blocks regular users from admin routes |
| Session protection | Unauthenticated users are redirected, sessions are server-side |
| Code expiry | Verification codes expire in 5 min; resend invalidates prior codes |

---

## Ethical Considerations

- **Data minimisation** — only data needed for the platform is collected
- **Inclusive by design** — supports all languages, not just dominant ones
- **Transparent roles** — learner/teacher distinction is user-controlled, not algorithmic
- **No credential exposure** — secrets stored in environment variables, never in code
- **User control** — users manage their own preferences with no hidden profiling
