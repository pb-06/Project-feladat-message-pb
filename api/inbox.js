/**
 * endpoint: /api/messages/inbox
 * GET - Beérkezett üzenetek lekérése
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null;

    // Csak GET metódus
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // User ID lekérése a header-ből vagy query-ből
        const userId = req.headers['x-user-id'] || req.query.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User ID hiányzik' });
        }

        sql = `
      SELECT 
        m.*,
        s.id as sender_id,
        s.email as sender_email,
        s.full_name as sender_name
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      WHERE m.receiver_id = $1
      ORDER BY m.sent_at DESC
    `;

        const result = await pool.query(sql, [userId]);
        data = result.rows;

        return res.status(200).json({ sql, data, error });
    } catch (err) {
        console.error('Inbox error:', err);
        error = err.message;
        return res.status(500).json({ sql, data, error });
    }
}