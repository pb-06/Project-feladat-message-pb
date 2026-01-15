import { Pool } from '@neondatabase/serverless';
var pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  let sql = '';
  let data = [];
  let error = null; // handle errors!

  if (req.method === 'GET') {
    try {
      sql = `SELECT id, name FROM public.messages`;
      const result = await pool.query(sql);
      data = result.rows;  // Make sure you're accessing the 'rows' property of the result object
      console.log('data', data);

      return res.status(200).json({ sql, data, error });
    } catch (err) {
      console.log('Error:', err);
      error = err.message;  // Capture the error message
      return res.status(500).json({ error });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });  // Handle unsupported methods
  }
}