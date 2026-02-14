-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 30, 2022 at 09:54 AM
-- Server version: 8.0.24
-- PHP Version: 7.4.20

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
-- Table structure for table `test_table`
--

CREATE TABLE `test_table` (
  `id` int NOT NULL,
  `name` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `test_table`
--

INSERT INTO `test_table` (`id`, `name`) VALUES
(1, 'Lisa'),
(2, 'Kimia');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `test_table`
--
ALTER TABLE `test_table`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `test_table`
--
ALTER TABLE `test_table`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
CREATE TABLE Modules (
code VARCHAR(10) PRIMARY KEY,
name VARCHAR(50) NOT NULL);
INSERT INTO Modules VALUES('CMP020C101','Software Development 1');
INSERT INTO Modules VALUES('CMP020C102','Computer Systems');
INSERT INTO Modules VALUES('CMP020C103','Mathematics for Computer Science');
INSERT INTO Modules VALUES('CMP020C104','Software Development 2');
INSERT INTO Modules VALUES('CMP020C105','Computing and Society');
INSERT INTO Modules VALUES('CMP020C106','Databases');
INSERT INTO Modules VALUES('PHY020C101','Physics Skills and Techniques');
INSERT INTO Modules VALUES('PHY020C102','Mathematics for Physics');
INSERT INTO Modules VALUES('PHY020C103','Computation for Physics');
INSERT INTO Modules VALUES('PHY020C106','Introduction to Astrophysics');
CREATE TABLE Programmes (
id VARCHAR(8) PRIMARY KEY,
name VARCHAR(50));
INSERT INTO Programmes VALUES('09UU0001','BSc Computer Science');
INSERT INTO Programmes VALUES('09UU0002','BEng Software Engineering');
INSERT INTO Programmes VALUES('09UU0003','BSc Physics');
CREATE TABLE Programme_Modules(
programme VARCHAR(8) NOT NULL,
module VARCHAR(10) NOT NULL,
FOREIGN KEY (programme) REFERENCES Programmes(id),
FOREIGN KEY (module) REFERENCES Modules(code));
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C101');
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C102');
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C103');
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C104');
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C105');
INSERT INTO Programme_Modules VALUES('09UU0001','CMP020C106');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C101');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C102');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C103');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C104');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C105');
INSERT INTO Programme_Modules VALUES('09UU0002','CMP020C106');
INSERT INTO Programme_Modules VALUES('09UU0003','PHY020C101');
INSERT INTO Programme_Modules VALUES('09UU0003','PHY020C102');
INSERT INTO Programme_Modules VALUES('09UU0003','PHY020C103');
INSERT INTO Programme_Modules VALUES('09UU0003','PHY020C106');
CREATE TABLE Students(
id INT PRIMARY KEY,
name VARCHAR(50) NOT NULL);
INSERT INTO Students VALUES(1,'Kevin Chalmers');
INSERT INTO Students VALUES(2,'Lisa Haskel');
INSERT INTO Students VALUES(3,'Arturo Araujo');
INSERT INTO Students VALUES(4,'Sobhan Tehrani');
INSERT INTO Students VALUES(100,'Oge Okonor');
INSERT INTO Students VALUES(200,'Kimia Aksir');
CREATE TABLE Student_Programme(
id INT,
programme VARCHAR(8),
FOREIGN KEY (id) REFERENCES Students(id),
FOREIGN KEY (programme) REFERENCES Programmes(id));
INSERT INTO Student_Programme VALUES(1,'09UU0002');
INSERT INTO Student_Programme VALUES(2,'09UU0001');
INSERT INTO Student_Programme VALUES(3,'09UU0003');
INSERT INTO Student_Programme VALUES(4,'09UU0001');