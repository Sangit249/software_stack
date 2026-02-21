# Community Language Learn & Teach (CLLT)
### A Full-Stack Peer-to-Peer Education Ecosystem

##  Introduction
The **Community Language Learn & Teach** platform is a digital bridge designed to connect passionate educators with eager learners. Unlike static learning apps, this platform focuses on **live human interaction** and **community-driven content**, allowing users to swap roles between being a student and a teacher.

Our mission is to empower native speakers to share their expertise while providing students with a structured path to fluency through four main pillars:
* **Live Interaction:** Real-time online sessions for direct communication.
* **On-Demand Content:** Ability for teachers to record and upload video lessons.
* **Reading Literacy:** Integrated modules for reading text and cultural materials.
* **Knowledge Retention:** Interactive exercises and quizzes to track and test learning progress.

Built on a containerized Node.js and MySQL stack, this platform provides a robust environment for educators to manage their curriculum and for learners to master new languages within a supportive community

## Ethical Issues

- **Data Privacy**  
  The application stores personal information such as user profiles and messages, which must be handled responsibly to protect user privacy and maintain trust.

- **User Safety and Trust**  
  As users interact with people they may not know, there is a risk of inappropriate behaviour, harassment, or misuse of the platform.

- **Accessibility and Inclusion**  
  Users have different levels of technical skills and language confidence. Poor design could exclude some users from effectively using the application.

- **Fair Use of the Platform**  
  The platform may be misused for commercial or promotional purposes instead of its intended goal of community-based language exchange.

  ##  Key Features

###  Language Exchange Capabilities
* **Dual-Role System:** Users can switch between **Learner** (Role 0) and **Teacher** (Role 1) roles.
* **Virtual Classroom:** Integration for real-time video calls and conversational practice.
* **Lesson Library:** A dedicated repository for teachers to upload and manage recorded video content.
* **Interactive Reading:** Text modules designed for cultural literacy and reading comprehension.
* **Progress Tracking:** Custom quiz builders for teachers and performance dashboards for learners.
# MySQL, PHPMyAdmin and Node.js (ready for Express development)

 WE will install Mysql and phpmyadmin (including all dependencies to run Phpmyadmin) AND node.js

This receipe is for development - Node.js is run in using supervisor: changes to any file in the app will trigger a rebuild automatically.

For security, this receipe uses a .env file for credentials.  

In node.js, we use the MySQl2 packages (to avoid problems with MySQL8) and the dotenv package to read the environment variables.

Local files are mounted into the container using the 'volumes' directive in the docker-compose.yml for ease of development.

### Super-quickstart your new project:

* Make sure that  don't have any other containers running usind docker ps
* run ```docker-compose up --build```

#### Visit phphmyadmin at:

http://localhost:8081/

#### Visit your express app at:

http://localhost:3000


### Whats provided in these scaffolding files?


  * A docker setup which will provide you with node.js, mysql and phpmyadmin, including the configuration needed so that both node.js AND phpmyadmin can 'see' and connect to your mysql database.  If you don't use docker you'll have to set up and connect each of these components separately.
  * A basic starting file structure for a node.js app.
  * A package.json file that will pull in the node.js libraries required and start your app as needed.
  * A db.js file which provides all the code needed to connect to the mysql database, using the credentials in the .env file, and which provides a query() function that can send queries to the database and receive a result.  In order to use this (ie. interact with the database, you simply need to include this file in any file you create that needs this database interaction) with the following code:

```const db = require('./services/db');
```

____

Useful commands:

Get a shell in any of the containers

```bash
docker exec -it <container name> bash -l
```

Once in the database container, you can get a MySQL CLI in the usual way

```bash
mysql -uroot -p<password> 
```
Once in the database container, you can get a MySQL CLI in the usual way
