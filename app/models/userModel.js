const db = require('../services/db');

class User {
    id;
    name;
    email;
    programme;
    bio;
    averageRating;
    username;
    country;
    profileImage;
    joinedDate;
    lastActive;
    modules = [];

    constructor(id) {
        this.id = id;
    }
    
    async populate() {
        const sql = `SELECT * FROM Users WHERE UserID = ?`;
        const rows = await db.query(sql, [this.id]);
        if (rows.length > 0) {
            const row = rows[0];
            this.id = row.UserID;
            this.name = row.Full_Name;
            this.email = row.Email;
            this.programme = row.Role;
            this.bio = row.Bio;
            this.averageRating = row.Average_Rating;
            this.username = row.Username;
            this.country = row.Country;
            this.profileImage = row.Profile_Image;
            this.joinedDate = row.Joined_Date;
            this.lastActive = row.Last_Active;
        }
    }
    
    async getUserName() {
        if (!this.name) await this.populate();
    }
    
    async getUserProgramme() {
        if (!this.programme) await this.populate();
    }
    
    async getUserModules() {
        if (this.modules.length === 0) {
            const sql = `
                SELECT l.Language_Name AS moduleName
                FROM User_Languages ul
                JOIN Languages l ON ul.LanguageID = l.LanguageID
                WHERE ul.UserID = ?
            `;
            const rows = await db.query(sql, [this.id]);
            this.modules = rows.map(row => row.moduleName);
        }
    }

    static async getAllUsers() {
        const sql = `SELECT UserID FROM Users`;
        const ids = await db.query(sql);
        const users = [];
        for (const row of ids) {
            const user = new User(row.UserID);
            await user.populate();
            await user.getUserModules();
            users.push(user);
        }
        return users;
    }

    static async getUserById(userId) {
        const user = new User(userId);
        await user.populate();
        await user.getUserModules();
        return user;
    }

    static async getUserLanguages(userId) {
        const sql = `
            SELECT 
                l.Language_Name AS languageName,
                ul.Language_Type AS languageType,
                ul.Proficiency_Level AS proficiencyLevel
            FROM User_Languages ul
            JOIN Languages l ON ul.LanguageID = l.LanguageID
            WHERE ul.UserID = ?
        `;
        return await db.query(sql, [userId]);
    }

    static async getUserAvailability(userId) {
        const sql = `
            SELECT 
                Day_Of_Week AS dayOfWeek,
                Start_Time AS startTime,
                End_Time AS endTime,
                Time_Zone AS timeZone
            FROM User_Availability
            WHERE UserID = ?
        `;
        return await db.query(sql, [userId]);
    }

    static async getUserInterests(userId) {
        const sql = `
            SELECT 
                Interest_Name AS interestName
            FROM User_Interests
            WHERE UserID = ?
        `;
        return await db.query(sql, [userId]);
    }

    static async getUserPreferences(userId) {
        const sql = `
            SELECT 
                Practice_Method AS practiceMethod,
                Preferred_Session_Type AS preferredSessionType,
                Learning_Goal AS learningGoal
            FROM User_Preferences
            WHERE UserID = ?
        `;
        const rows = await db.query(sql, [userId]);
        return rows.length > 0 ? rows[0] : null;
    }

    static async search(query) {
    const sql = `
        SELECT DISTINCT u.UserID, u.Full_Name, u.Username, u.Role,
            ul.Language_Type, ul.Proficiency_Level, l.Language_Name
        FROM Users u
        LEFT JOIN User_Languages ul ON u.UserID = ul.UserID
        LEFT JOIN Languages l ON ul.LanguageID = l.LanguageID
        LEFT JOIN Language_Categories lc ON l.LanguageID = lc.LanguageID
        LEFT JOIN Categories c ON lc.CategoryID = c.CategoryID
        WHERE l.Language_Name LIKE ?
        OR u.Username LIKE ?
        OR u.Full_Name LIKE ?
        OR c.Category_Name LIKE ?
    `;
    return await db.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
}
}

module.exports = {
    User
}