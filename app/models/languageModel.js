const db = require('../services/db');

class Language {

    static async getAll() {
        return await db.query("SELECT LanguageID, Language_Name FROM Languages ORDER BY Language_Name");
    }

    static async getAllWithCategories() {
        return await db.query("SELECT * FROM Languages ORDER BY Language_Name");
    }

    static async add(name, categoryId) {
        return await db.query(
            "INSERT INTO Languages (Language_Name, CategoryID) VALUES (?, ?)",
            [name, categoryId || null]
        );
    }

    static async delete(id) {
        await db.query("DELETE FROM Language_Categories WHERE LanguageID = ?", [id]);
        await db.query("DELETE FROM User_Languages WHERE LanguageID = ?", [id]);
        await db.query("DELETE FROM Languages WHERE LanguageID = ?", [id]);
    }
}

module.exports = { Language };