/**
 * endpoint: /api/messages/read
 * PATCH - Üzenet olvasottnak jelölése
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null;

    // Csak PATCH metódus
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        const messageId = req.query.id || req.body.id;

        if (!userId) {
            return res.status(401).json({ error: 'User ID hiányzik' });
        }

        if (!messageId) {
            return res.status(400).json({ error: 'Üzenet ID hiányzik' });
        }

        sql = `
      UPDATE messages
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2
      RETURNING *
    `;

        const result = await pool.query(sql, [messageId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Üzenet nem található' });
        }

        data = result.rows;

        return res.status(200).json({ sql, data, error });
    } catch (err) {
        console.error('Mark as read error:', err);
        error = err.message;
        return res.status(500).json({ sql, data, error });
    }
}
