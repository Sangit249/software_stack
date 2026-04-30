const db = require('../services/db');

class Category {
    // Get all categories with related languages
    static async getAllCategoriesWithLanguages() {
        const sql = `
            SELECT 
                c.CategoryID,
                c.Category_Name,
                c.Description,
                l.Language_Name
            FROM Categories c
            LEFT JOIN Languages l ON c.CategoryID = l.CategoryID
            ORDER BY c.CategoryID
        `;
        return await db.query(sql);
    }
}

module.exports = {
    Category
};