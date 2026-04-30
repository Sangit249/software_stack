-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Apr 23, 2026 at 08:28 AM
-- Server version: 9.6.0
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sd2-db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Categories`
--

CREATE TABLE `Categories` (
  `CategoryID` int NOT NULL,
  `Category_Name` varchar(100) NOT NULL,
  `Description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Categories`
--

INSERT INTO `Categories` (`CategoryID`, `Category_Name`, `Description`) VALUES
(4, 'International', 'Languages widely used around the world'),
(5, 'Regional', 'Languages mainly spoken in specific regions'),
(6, 'Native', 'Languages commonly spoken as a mother tongue'),
(7, 'Popular', 'Languages highly demanded by learners'),
(8, 'Beginner Friendly', 'Languages suitable for new learners');

-- --------------------------------------------------------

--
-- Table structure for table `Email_Verifications`
--

CREATE TABLE `Email_Verifications` (
  `ID` int NOT NULL,
  `UserID` int NOT NULL,
  `Code` varchar(6) NOT NULL,
  `Expires_At` datetime NOT NULL,
  `Used` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Languages`
--

CREATE TABLE `Languages` (
  `LanguageID` int NOT NULL,
  `Language_Name` varchar(50) NOT NULL,
  `CategoryID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Languages`
--

INSERT INTO `Languages` (`LanguageID`, `Language_Name`, `CategoryID`) VALUES
(1, 'English', 4),
(2, 'Nepali', 6),
(3, 'Japanese', 5),
(4, 'Hindi', 5),
(5, 'Spanish', 8),
(6, 'French', 7),
(7, 'German', 4),
(8, 'Chinese', 4),
(9, 'Korean', 7),
(10, 'Newari', 6),
(13, 'tamang', 5);

-- --------------------------------------------------------

--
-- Table structure for table `Language_Categories`
--

CREATE TABLE `Language_Categories` (
  `LanguageID` int NOT NULL,
  `CategoryID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Language_Categories`
--

INSERT INTO `Language_Categories` (`LanguageID`, `CategoryID`) VALUES
(1, 4),
(5, 4),
(6, 4),
(7, 4),
(8, 4),
(2, 5),
(4, 5),
(10, 5),
(2, 6),
(4, 6),
(10, 6),
(1, 7),
(3, 7),
(5, 7),
(6, 7),
(9, 7),
(1, 8),
(5, 8),
(6, 8);

-- --------------------------------------------------------

--
-- Table structure for table `Learning_Sessions`
--

CREATE TABLE `Learning_Sessions` (
  `SessionID` int NOT NULL,
  `LearnerID` int NOT NULL,
  `TeacherID` int NOT NULL,
  `Meeting_Place` varchar(100) DEFAULT NULL,
  `Scheduled_Time` datetime NOT NULL,
  `Initial_Message` text,
  `Status` enum('Pending','Accepted','Declined','Completed') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Learning_Sessions`
--

INSERT INTO `Learning_Sessions` (`SessionID`, `LearnerID`, `TeacherID`, `Meeting_Place`, `Scheduled_Time`, `Initial_Message`, `Status`) VALUES
(3, 8, 5, 'zoom', '2026-04-24 16:18:00', 'I WANT  TO BE PROFICIENT TO  ENGLISH\r\n', 'Pending'),
(4, 8, 11, 'zoom', '2026-04-25 16:30:00', 'help in french', 'Accepted');

-- --------------------------------------------------------

--
-- Table structure for table `Messages`
--

CREATE TABLE `Messages` (
  `MessageID` int NOT NULL,
  `SenderID` int NOT NULL,
  `ReceiverID` int NOT NULL,
  `SessionID` int NOT NULL,
  `Content` text NOT NULL,
  `Sent_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Is_Read` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Messages`
--

INSERT INTO `Messages` (`MessageID`, `SenderID`, `ReceiverID`, `SessionID`, `Content`, `Sent_At`, `Is_Read`) VALUES
(1, 8, 11, 4, 'hello', '2026-04-21 10:54:45', 1),
(2, 11, 8, 4, 'hey how can i help you my friend', '2026-04-21 10:55:33', 0),
(3, 11, 8, 4, 'i am new in this field', '2026-04-21 10:55:54', 0),
(4, 11, 8, 4, 'hello', '2026-04-21 10:56:25', 0),
(5, 11, 8, 4, 'hey', '2026-04-21 10:56:43', 0),
(6, 11, 8, 4, 'hello', '2026-04-21 11:13:30', 0);

-- --------------------------------------------------------

--
-- Table structure for table `Modules`
--

CREATE TABLE `Modules` (
  `code` varchar(10) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Modules`
--

INSERT INTO `Modules` (`code`, `name`) VALUES
('CMP020C101', 'Software Development 1'),
('CMP020C102', 'Computer Systems'),
('CMP020C103', 'Mathematics for Computer Science'),
('CMP020C104', 'Software Development 2'),
('CMP020C105', 'Computing and Society'),
('CMP020C106', 'Databases'),
('PHY020C101', 'Physics Skills and Techniques'),
('PHY020C102', 'Mathematics for Physics'),
('PHY020C103', 'Computation for Physics'),
('PHY020C106', 'Introduction to Astrophysics');

-- --------------------------------------------------------

--
-- Table structure for table `Programmes`
--

CREATE TABLE `Programmes` (
  `id` varchar(8) NOT NULL,
  `name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Programmes`
--

INSERT INTO `Programmes` (`id`, `name`) VALUES
('09UU0001', 'BSc Computer Science'),
('09UU0002', 'BEng Software Engineering'),
('09UU0003', 'BSc Physics');

-- --------------------------------------------------------

--
-- Table structure for table `Programme_Modules`
--

CREATE TABLE `Programme_Modules` (
  `programme` varchar(8) NOT NULL,
  `module` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Programme_Modules`
--

INSERT INTO `Programme_Modules` (`programme`, `module`) VALUES
('09UU0001', 'CMP020C101'),
('09UU0001', 'CMP020C102'),
('09UU0001', 'CMP020C103'),
('09UU0001', 'CMP020C104'),
('09UU0001', 'CMP020C105'),
('09UU0001', 'CMP020C106'),
('09UU0002', 'CMP020C101'),
('09UU0002', 'CMP020C102'),
('09UU0002', 'CMP020C103'),
('09UU0002', 'CMP020C104'),
('09UU0002', 'CMP020C105'),
('09UU0002', 'CMP020C106'),
('09UU0003', 'PHY020C101'),
('09UU0003', 'PHY020C102'),
('09UU0003', 'PHY020C103'),
('09UU0003', 'PHY020C106');

-- --------------------------------------------------------

--
-- Table structure for table `Reports`
--

CREATE TABLE `Reports` (
  `ReportID` int NOT NULL,
  `ReporterID` int NOT NULL,
  `ReportedUserID` int NOT NULL,
  `Reason` varchar(255) NOT NULL,
  `Status` enum('Pending','Resolved','Dismissed') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Reports`
--

INSERT INTO `Reports` (`ReportID`, `ReporterID`, `ReportedUserID`, `Reason`, `Status`) VALUES
(3, 11, 6, 'fghdfg', 'Resolved');

-- --------------------------------------------------------

--
-- Table structure for table `Reviews`
--

CREATE TABLE `Reviews` (
  `ReviewID` int NOT NULL,
  `SessionID` int NOT NULL,
  `Star_Rating` int NOT NULL,
  `Comment` text
) ;

--
-- Dumping data for table `Reviews`
--

INSERT INTO `Reviews` (`ReviewID`, `SessionID`, `Star_Rating`, `Comment`) VALUES
(3, 4, 4, ' good interaction');

-- --------------------------------------------------------

--
-- Table structure for table `Students`
--

CREATE TABLE `Students` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Students`
--

INSERT INTO `Students` (`id`, `name`) VALUES
(1, 'Kevin Chalmers'),
(2, 'Lisa Haskel'),
(3, 'Arturo Araujo'),
(4, 'Sobhan Tehrani'),
(100, 'Oge Okonor'),
(200, 'Kimia Aksir');

-- --------------------------------------------------------

--
-- Table structure for table `Student_Programme`
--

CREATE TABLE `Student_Programme` (
  `id` int DEFAULT NULL,
  `programme` varchar(8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Student_Programme`
--

INSERT INTO `Student_Programme` (`id`, `programme`) VALUES
(1, '09UU0002'),
(2, '09UU0001'),
(3, '09UU0003'),
(4, '09UU0001');

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `UserID` int NOT NULL,
  `Full_Name` varchar(100) NOT NULL,
  `Username` varchar(50) DEFAULT NULL,
  `Email` varchar(100) NOT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `Role` enum('Learner','Teacher','Admin') NOT NULL,
  `Bio` text,
  `Profile_Image` varchar(255) DEFAULT NULL,
  `Average_Rating` decimal(3,2) DEFAULT '0.00',
  `Joined_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  `Last_Active` datetime DEFAULT NULL,
  `Password` varchar(255) NOT NULL,
  `Email_Verified` tinyint(1) DEFAULT '0',
  `Profile_Complete` tinyint(1) DEFAULT '0',
  `Suspended` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`UserID`, `Full_Name`, `Username`, `Email`, `Country`, `Role`, `Bio`, `Profile_Image`, `Average_Rating`, `Joined_Date`, `Last_Active`, `Password`, `Email_Verified`, `Profile_Complete`, `Suspended`) VALUES
(2, 'Asha Sharma', 'asha_sharma', 'asha@example.com', 'India', 'Teacher', 'Teaches Nepali and Hindi', '/images/default-user.png', 4.80, '2026-03-21 21:44:22', '2026-03-21 21:58:06', '', 0, 0, 0),
(4, 'roman rai', 'roman', 'roman@email.com', NULL, 'Learner', NULL, NULL, 0.00, '2026-03-28 11:16:50', NULL, '', 0, 0, 0),
(5, 'bibek khadka', 'bibek', 'bibek@gmail.com', NULL, 'Teacher', NULL, NULL, 0.00, '2026-03-28 11:24:28', NULL, '', 0, 0, 0),
(6, 'aman', 'aman', 'aman@email.com', NULL, 'Learner', NULL, NULL, 0.00, '2026-03-28 11:34:53', '2026-03-30 22:14:27', '$2b$10$cxNzU4dPa3YApUveXhGjtOfnqse1d5mo6iO8rEE/ouYnGf0m2wMEW', 0, 0, 0),
(8, 'salim', 'salim', 'salim@gmail.com', NULL, 'Learner', NULL, NULL, 0.00, '2026-03-30 22:14:50', '2026-04-21 10:54:34', '$2b$10$9ZAqMOb7fVST7YLUB6qb5eQyVDlbWbOg2SXtckM5e/AG.9EnWEd72', 0, 0, 0),
(10, 'Sangit Khadka', 'sangit', 'ssangitkhadka@gmail.com', NULL, 'Admin', NULL, NULL, 0.00, '2026-04-10 08:25:17', '2026-04-22 10:21:28', '$2b$10$aMy5jlo9JI.K40QfJqmlPeIXeaXSRIREAckEmmgOVjQ1Un3LulyE6', 0, 1, 0),
(11, 'bj dhakal', 'bj1', 'bj@gmail.com', NULL, 'Teacher', NULL, NULL, 0.00, '2026-04-20 23:24:15', '2026-04-21 11:47:49', '$2b$10$H88tfYeyjBAzI1m2EG4HbObW/DUE4lqJj//06.KgA5p2YXXpNn5YK', 0, 1, 0),
(12, 'saroj sapkota', 'saroj', 'saroj@email.com', NULL, 'Teacher', NULL, NULL, 0.00, '2026-04-21 11:50:33', '2026-04-22 10:49:40', '$2b$10$RN0tFLYj/O.s.gLUSN9KNeHQ2qWQCOQLf75T2u3AIdKqzKg8q/OeW', 0, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `User_Availability`
--

CREATE TABLE `User_Availability` (
  `AvailabilityID` int NOT NULL,
  `UserID` int NOT NULL,
  `Day_Of_Week` varchar(20) NOT NULL,
  `Start_Time` time NOT NULL,
  `End_Time` time NOT NULL,
  `Time_Zone` varchar(50) DEFAULT 'UTC'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `User_Availability`
--

INSERT INTO `User_Availability` (`AvailabilityID`, `UserID`, `Day_Of_Week`, `Start_Time`, `End_Time`, `Time_Zone`) VALUES
(3, 2, 'Friday', '17:00:00', '19:00:00', 'Asia/Kolkata'),
(5, 8, 'Monday', '12:15:00', '00:00:00', 'asia'),
(7, 10, 'Monday', '11:27:00', '00:28:00', 'asia'),
(8, 11, 'Monday', '00:00:00', '00:00:00', ''),
(9, 11, 'Monday', '14:48:00', '17:51:00', 'asia'),
(10, 12, 'Saturday', '14:55:00', '17:56:00', 'Europe'),
(11, 10, 'Monday', '00:00:00', '00:00:00', '');

-- --------------------------------------------------------

--
-- Table structure for table `User_Interests`
--

CREATE TABLE `User_Interests` (
  `InterestID` int NOT NULL,
  `UserID` int NOT NULL,
  `Interest_Name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `User_Interests`
--

INSERT INTO `User_Interests` (`InterestID`, `UserID`, `Interest_Name`) VALUES
(4, 2, 'Teaching'),
(5, 2, 'Reading'),
(8, 8, 'singing'),
(9, 8, 'traviling'),
(10, 10, 'singing'),
(11, 11, 'singing'),
(12, 12, 'gaming'),
(13, 12, 'traviling');

-- --------------------------------------------------------

--
-- Table structure for table `User_Languages`
--

CREATE TABLE `User_Languages` (
  `UserLanguageID` int NOT NULL,
  `UserID` int NOT NULL,
  `LanguageID` int NOT NULL,
  `Language_Type` enum('Native','Fluent','Learning','Teaching') NOT NULL DEFAULT 'Learning',
  `Proficiency_Level` varchar(50) DEFAULT NULL,
  `Added_At` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `User_Languages`
--

INSERT INTO `User_Languages` (`UserLanguageID`, `UserID`, `LanguageID`, `Language_Type`, `Proficiency_Level`, `Added_At`) VALUES
(3, 2, 4, 'Native', 'Advanced', '2026-03-21 21:59:29'),
(4, 2, 2, 'Teaching', 'Advanced', '2026-03-21 21:59:29'),
(7, 8, 4, 'Native', 'advanced', '2026-03-30 22:15:39'),
(8, 10, 2, 'Native', 'advanced', '2026-04-10 08:26:24'),
(9, 10, 1, 'Learning', 'beginner', '2026-04-10 08:26:24'),
(10, 11, 6, 'Native', 'advanced', '2026-04-20 23:24:35'),
(11, 11, 1, 'Native', 'advanced', '2026-04-21 11:46:54'),
(12, 12, 8, 'Native', 'advanced', '2026-04-21 11:52:16'),
(13, 10, 8, 'Native', '', '2026-04-21 13:44:12');

-- --------------------------------------------------------

--
-- Table structure for table `User_Preferences`
--

CREATE TABLE `User_Preferences` (
  `PreferenceID` int NOT NULL,
  `UserID` int NOT NULL,
  `Practice_Method` varchar(50) DEFAULT NULL,
  `Preferred_Session_Type` varchar(50) DEFAULT NULL,
  `Learning_Goal` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `User_Preferences`
--

INSERT INTO `User_Preferences` (`PreferenceID`, `UserID`, `Practice_Method`, `Preferred_Session_Type`, `Learning_Goal`) VALUES
(2, 2, 'Text Chat', 'Teaching Session', 'Help others learn Nepali and Hindi'),
(4, 8, 'voice call', '', ''),
(6, 10, 'voice call', '', ''),
(7, 11, '', '', ''),
(8, 11, 'voice call', '', ''),
(9, 12, 'voice call', '', ''),
(10, 10, '', '', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Categories`
--
ALTER TABLE `Categories`
  ADD PRIMARY KEY (`CategoryID`);

--
-- Indexes for table `Email_Verifications`
--
ALTER TABLE `Email_Verifications`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `Languages`
--
ALTER TABLE `Languages`
  ADD PRIMARY KEY (`LanguageID`),
  ADD UNIQUE KEY `Language_Name` (`Language_Name`),
  ADD KEY `fk_language_category` (`CategoryID`);

--
-- Indexes for table `Language_Categories`
--
ALTER TABLE `Language_Categories`
  ADD PRIMARY KEY (`LanguageID`,`CategoryID`),
  ADD KEY `CategoryID` (`CategoryID`);

--
-- Indexes for table `Learning_Sessions`
--
ALTER TABLE `Learning_Sessions`
  ADD PRIMARY KEY (`SessionID`),
  ADD KEY `LearnerID` (`LearnerID`),
  ADD KEY `TeacherID` (`TeacherID`);

--
-- Indexes for table `Messages`
--
ALTER TABLE `Messages`
  ADD PRIMARY KEY (`MessageID`),
  ADD KEY `SenderID` (`SenderID`),
  ADD KEY `ReceiverID` (`ReceiverID`),
  ADD KEY `SessionID` (`SessionID`);

--
-- Indexes for table `Modules`
--
ALTER TABLE `Modules`
  ADD PRIMARY KEY (`code`);

--
-- Indexes for table `Programmes`
--
ALTER TABLE `Programmes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Programme_Modules`
--
ALTER TABLE `Programme_Modules`
  ADD KEY `programme` (`programme`),
  ADD KEY `module` (`module`);

--
-- Indexes for table `Reports`
--
ALTER TABLE `Reports`
  ADD PRIMARY KEY (`ReportID`),
  ADD KEY `ReporterID` (`ReporterID`),
  ADD KEY `ReportedUserID` (`ReportedUserID`);

--
-- Indexes for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`ReviewID`),
  ADD KEY `SessionID` (`SessionID`);

--
-- Indexes for table `Students`
--
ALTER TABLE `Students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Student_Programme`
--
ALTER TABLE `Student_Programme`
  ADD KEY `id` (`id`),
  ADD KEY `programme` (`programme`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD UNIQUE KEY `Username` (`Username`);

--
-- Indexes for table `User_Availability`
--
ALTER TABLE `User_Availability`
  ADD PRIMARY KEY (`AvailabilityID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `User_Interests`
--
ALTER TABLE `User_Interests`
  ADD PRIMARY KEY (`InterestID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `User_Languages`
--
ALTER TABLE `User_Languages`
  ADD PRIMARY KEY (`UserLanguageID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `LanguageID` (`LanguageID`);

--
-- Indexes for table `User_Preferences`
--
ALTER TABLE `User_Preferences`
  ADD PRIMARY KEY (`PreferenceID`),
  ADD KEY `UserID` (`UserID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Categories`
--
ALTER TABLE `Categories`
  MODIFY `CategoryID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `Email_Verifications`
--
ALTER TABLE `Email_Verifications`
  MODIFY `ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Languages`
--
ALTER TABLE `Languages`
  MODIFY `LanguageID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `Learning_Sessions`
--
ALTER TABLE `Learning_Sessions`
  MODIFY `SessionID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Messages`
--
ALTER TABLE `Messages`
  MODIFY `MessageID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Reports`
--
ALTER TABLE `Reports`
  MODIFY `ReportID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `ReviewID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `UserID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `User_Availability`
--
ALTER TABLE `User_Availability`
  MODIFY `AvailabilityID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `User_Interests`
--
ALTER TABLE `User_Interests`
  MODIFY `InterestID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `User_Languages`
--
ALTER TABLE `User_Languages`
  MODIFY `UserLanguageID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `User_Preferences`
--
ALTER TABLE `User_Preferences`
  MODIFY `PreferenceID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Email_Verifications`
--
ALTER TABLE `Email_Verifications`
  ADD CONSTRAINT `email_verifications_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`);

--
-- Constraints for table `Languages`
--
ALTER TABLE `Languages`
  ADD CONSTRAINT `fk_language_category` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Language_Categories`
--
ALTER TABLE `Language_Categories`
  ADD CONSTRAINT `language_categories_ibfk_1` FOREIGN KEY (`LanguageID`) REFERENCES `Languages` (`LanguageID`),
  ADD CONSTRAINT `language_categories_ibfk_2` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`);

--
-- Constraints for table `Learning_Sessions`
--
ALTER TABLE `Learning_Sessions`
  ADD CONSTRAINT `learning_sessions_ibfk_1` FOREIGN KEY (`LearnerID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `learning_sessions_ibfk_2` FOREIGN KEY (`TeacherID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Messages`
--
ALTER TABLE `Messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`SenderID`) REFERENCES `Users` (`UserID`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`ReceiverID`) REFERENCES `Users` (`UserID`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`SessionID`) REFERENCES `Learning_Sessions` (`SessionID`);

--
-- Constraints for table `Programme_Modules`
--
ALTER TABLE `Programme_Modules`
  ADD CONSTRAINT `programme_modules_ibfk_1` FOREIGN KEY (`programme`) REFERENCES `Programmes` (`id`),
  ADD CONSTRAINT `programme_modules_ibfk_2` FOREIGN KEY (`module`) REFERENCES `Modules` (`code`);

--
-- Constraints for table `Reports`
--
ALTER TABLE `Reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`ReporterID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`ReportedUserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`SessionID`) REFERENCES `Learning_Sessions` (`SessionID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Student_Programme`
--
ALTER TABLE `Student_Programme`
  ADD CONSTRAINT `student_programme_ibfk_1` FOREIGN KEY (`id`) REFERENCES `Students` (`id`),
  ADD CONSTRAINT `student_programme_ibfk_2` FOREIGN KEY (`programme`) REFERENCES `Programmes` (`id`);

--
-- Constraints for table `User_Availability`
--
ALTER TABLE `User_Availability`
  ADD CONSTRAINT `user_availability_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `User_Interests`
--
ALTER TABLE `User_Interests`
  ADD CONSTRAINT `user_interests_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `User_Languages`
--
ALTER TABLE `User_Languages`
  ADD CONSTRAINT `user_languages_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_languages_ibfk_2` FOREIGN KEY (`LanguageID`) REFERENCES `Languages` (`LanguageID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `User_Preferences`
--
ALTER TABLE `User_Preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
