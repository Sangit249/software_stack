# User Stories

---

### User Accounts

**US-01 — Register an account**

*As a new visitor, I want to register with my name, email address, and a password so that I can access the platform and join the language community.*

Acceptance criteria:

- User fills in a registration form with name, email, and password
- Duplicate email addresses are rejected with a clear error message
- Upon success, the user is redirected to their dashboard

---

**US-02 — Log in**

*As a registered user, I want to log in with my email and password so that I can access my profile and language sessions.*

Acceptance criteria:

- Correct credentials grant access to the user's dashboard
- Incorrect credentials display an error without revealing which field is wrong
- A log out option is accessible from all pages once logged in

---

**US-03 — View and edit my profile**

*As a logged-in user, I want to view and edit my profile so that other users can learn about my language background and availability.*

Acceptance criteria:

- Profile page displays name, languages spoken, languages learning, and a short bio
- User can edit any of these fields and save changes
- Profile is visible to other users on the platform

---

### Language Listings

**US-04 — List myself as a teacher**

*As a user who speaks a language fluently, I want to create a teaching listing so that learners can find and connect with me.*

Acceptance criteria:

- User can create a listing with language offered, proficiency level, description, and availability
- Listing appears on the main browse page for other users to discover
- User can edit or remove their listing at any time

---

**US-05 — Browse available teachers**

*As a learner, I want to browse all available teaching listings so that I can find someone to help me learn the language I am interested in.*

Acceptance criteria:

- A listings page shows all active teacher profiles
- Each listing displays the teacher's name, language offered, and a short description
- Listings can be filtered by language

---

**US-06 — View a teacher's detail page**

*As a learner, I want to click on a teaching listing to see full details about the teacher so that I can decide whether to request a session.*

Acceptance criteria:

- Detail page shows the teacher's full profile, languages offered, bio, and availability
- A request a session button is visible on the page
- Learner can navigate back to the listings page easily

---

### Session Requests

**US-07 — Request a language session**

*As a learner, I want to send a session request to a teacher so that we can arrange a time to practise together.*

Acceptance criteria:

- Learner can submit a request with a preferred time and a short message
- The teacher receives a notification of the new request
- The request appears in the learner's sessions area with a pending status

---

**US-08 — Accept or decline a session request**

*As a teacher, I want to accept or decline incoming session requests so that I can manage my own time and availability.*

Acceptance criteria:

- Teacher can view all incoming requests in their dashboard
- Teacher can accept or decline each request with a single click
- The learner is notified of the outcome and the session status updates accordingly

---

### Discovery and Search

**US-09 — Search for a language**

*As a learner, I want to search for a specific language so that I can quickly find relevant teachers without browsing all listings.*

Acceptance criteria:

- A search bar is available on the listings page
- Results update to show only listings matching the searched language
- A no results message is shown if no matches are found

---

**US-10 — Filter listings by tag**

*As a learner, I want to filter teacher listings by tags such as beginner-friendly or conversation practice so that I can find sessions that match my learning goals.*

Acceptance criteria:

- Tags are visible on each listing card
- Clicking a tag filters the listings page to show only matching listings
- Multiple tags can be selected at once

---

### Dashboard and Progress

**US-11 — View my upcoming sessions**

*As a user, I want to see a list of my confirmed sessions so that I can keep track of my learning or teaching schedule.*

Acceptance criteria:

- Dashboard shows a list of upcoming confirmed sessions with date, time, and the other user's name
- Past sessions are shown in a separate session history section
- Sessions can be cancelled from this view

---

**US-12 — Leave a rating after a session**

*As a learner, I want to rate a teacher after our session so that other users can benefit from honest feedback about the quality of teaching.*

Acceptance criteria:

- A rating prompt appears after a session is marked as complete
- Learner can submit a star rating from 1 to 5 and an optional written comment
- Ratings are displayed on the teacher's profile and listing page
