const db = require('../services/db');

class Review {
    // Get all reviews
    static async getAllReviews() {
        const sql = `
            SELECT ReviewID, SessionID, Star_Rating, Comment
            FROM Reviews
        `;
        return await db.query(sql);
    }
}

module.exports = {
    Review
};