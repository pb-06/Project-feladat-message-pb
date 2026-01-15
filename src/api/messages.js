import { Pool } from '@neondatabase/serverless';
var pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    let sql = '';
    let data = [];
    let error = null; // handle errors!

    if (req.method == 'GET') {
        try {
            sql = `SELECT id, name FROM public.messages`;
            data = await pool.query(sql);
            console.log('data', data);
            return res.status(200).json({ sql, data, error });
        } catch (error) {
            console.log(error)
        }
    }
}