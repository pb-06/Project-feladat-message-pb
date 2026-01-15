/**
 * endpoint: /api/users/sync
 * POST - Felhasználó szinkronizálása Neon Auth-ból az adatbázisba
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null;

    // Csak POST metódus
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { email, full_name } = req.body;

        if (!userId || !email) {
            return res.status(400).json({ error: 'User ID és email kötelező' });
        }

        // Upsert - beszúrás vagy frissítés
        sql = `
      INSERT INTO users (id, email, full_name, last_active)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        last_active = CURRENT_TIMESTAMP
      RETURNING *
    `;

        const result = await pool.query(sql, [userId, email, full_name || '']);
        data = result.rows;

        return res.status(200).json({ sql, data, error });
    } catch (err) {
        console.error('Sync error:', err);
        error = err.message;
        return res.status(500).json({ sql, data, error });
    }
}