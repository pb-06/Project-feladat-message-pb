/**
 * endpoint: /api/messages
 * POST - Új üzenet küldése
 * DELETE - Üzenet törlése (query param: id)
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null;

    const userId = req.headers['x-user-id'] || req.query.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID hiányzik' });
    }

    // POST - Új üzenet küldése
    if (req.method === 'POST') {
        try {
            const { receiver_email, subject, content } = req.body;

            // Validáció
            if (!receiver_email || !content) {
                return res.status(400).json({ error: 'Címzett email és üzenet szükséges' });
            }

            // Címzett keresése email alapján
            const userSql = 'SELECT id FROM users WHERE email = $1';
            const userResult = await pool.query(userSql, [receiver_email]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'A címzett nem található' });
            }

            const receiver_id = userResult.rows[0].id;

            // Üzenet beszúrása
            sql = `
        INSERT INTO messages (sender_id, receiver_id, subject, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

            const result = await pool.query(sql, [userId, receiver_id, subject, content]);
            data = result.rows;

            return res.status(201).json({ sql, data, error });
        } catch (err) {
            console.error('Send message error:', err);
            error = err.message;
            return res.status(500).json({ sql, data, error });
        }
    }

    // DELETE - Üzenet törlése
    if (req.method === 'DELETE') {
        try {
            const messageId = req.query.id;

            if (!messageId) {
                return res.status(400).json({ error: 'Üzenet ID hiányzik' });
            }

            sql = `
        DELETE FROM messages
        WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
        RETURNING *
      `;

            const result = await pool.query(sql, [messageId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Üzenet nem található vagy nincs jogosultságod' });
            }

            data = result.rows;

            return res.status(200).json({ sql, data, error, message: 'Üzenet törölve' });
        } catch (err) {
            console.error('Delete message error:', err);
            error = err.message;
            return res.status(500).json({ sql, data, error });
        }
    }

    // Más metódus
    return res.status(405).json({ error: 'Method not allowed' });
}