/**
 * endpoint: /api/users/search
 * GET - Felhasználók keresése
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
        const userId = req.headers['x-user-id'] || req.query.userId;
        const searchQuery = req.query.q || '';

        if (!userId) {
            return res.status(401).json({ error: 'User ID hiányzik' });
        }

        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({ error: 'Legalább 2 karakter szükséges a kereséshez' });
        }

        sql = `
      SELECT id, email, full_name
      FROM users
      WHERE (email ILIKE $1 OR full_name ILIKE $1)
        AND id != $2
      ORDER BY email
      LIMIT 10
    `;

        const result = await pool.query(sql, [`%${searchQuery}%`, userId]);
        data = result.rows;

        return res.status(200).json({ sql, data, error });
    } catch (err) {
        console.error('Search error:', err);
        error = err.message;
        return res.status(500).json({ sql, data, error });
    }
}
