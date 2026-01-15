/**
 * endpoint: /api/seed/demo
 * POST - Adatbázis feltöltése demo adatokkal
 * FIGYELEM: Csak fejlesztéshez! Productonon el kell távolítani!
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
    // Csak POST metódus
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🌱 Starting database seed...');

        // 1. Demo felhasználók létrehozása
        const demoUsers = [
            {
                id: 'user-1-demo-uuid-generated',
                email: 'alice@example.com',
                full_name: 'Alice Johnson'
            },
            {
                id: 'user-2-demo-uuid-generated',
                email: 'bob@example.com',
                full_name: 'Bob Smith'
            },
            {
                id: 'user-3-demo-uuid-generated',
                email: 'charlie@example.com',
                full_name: 'Charlie Brown'
            },
            {
                id: 'user-4-demo-uuid-generated',
                email: 'diana@example.com',
                full_name: 'Diana Prince'
            }
        ];

        // Felhasználók beszúrása (vagy update ha már létezik)
        for (const user of demoUsers) {
            await pool.query(
                `INSERT INTO users (id, email, full_name)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id) DO UPDATE SET
                   email = EXCLUDED.email,
                   full_name = EXCLUDED.full_name`,
                [user.id, user.email, user.full_name]
            );
        }

        console.log('✅ Users created/updated');

        // 2. Demo üzenetek létrehozása
        const demoMessages = [
            {
                sender_id: 'user-1-demo-uuid-generated',
                receiver_id: 'user-2-demo-uuid-generated',
                subject: 'Szia Bob!',
                content: 'Helló! Ez egy test üzenet. Hogyan vagy?',
                is_read: false
            },
            {
                sender_id: 'user-2-demo-uuid-generated',
                receiver_id: 'user-1-demo-uuid-generated',
                subject: 'Re: Szia Bob!',
                content: 'Szia Alice! Nagyon jól vagyok, köszönöm a kérdezést! 😊',
                is_read: true
            },
            {
                sender_id: 'user-3-demo-uuid-generated',
                receiver_id: 'user-1-demo-uuid-generated',
                subject: 'Projektről',
                content: 'Alice, el tudnál küldeni a projekt részleteit?',
                is_read: false
            },
            {
                sender_id: 'user-4-demo-uuid-generated',
                receiver_id: 'user-2-demo-uuid-generated',
                subject: 'Encontro amenyan',
                content: 'Bob, szeretnék veled tárgyalni az új projektről. Mikor lenne jó időpontod?',
                is_read: true
            },
            {
                sender_id: 'user-1-demo-uuid-generated',
                receiver_id: 'user-3-demo-uuid-generated',
                subject: 'Válasz a projektről',
                content: 'Charlie, itt az összes információ amit kértél. Nézd meg és szólj!',
                is_read: false
            },
            {
                sender_id: 'user-2-demo-uuid-generated',
                receiver_id: 'user-4-demo-uuid-generated',
                subject: 'Re: Projektről',
                content: 'Diana, holnap 14:00-kor jó lenne? Akkor részletesen megbeszélhetjük.',
                is_read: true
            }
        ];

        // Üzenetek beszúrása
        for (const msg of demoMessages) {
            await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, subject, content, is_read)
                 VALUES ($1, $2, $3, $4, $5)`,
                [msg.sender_id, msg.receiver_id, msg.subject, msg.content, msg.is_read]
            );
        }

        console.log('✅ Messages created');

        return res.status(200).json({
            message: '✅ Adatbázis sikeresen feltöltve demo adatokkal!',
            usersCreated: demoUsers.length,
            messagesCreated: demoMessages.length,
            users: demoUsers,
            note: 'FIGYELEM: Ez a seed endpoint csak fejlesztéshez van. Productonon el kell távolítani!'
        });

    } catch (err) {
        console.error('❌ Seed error:', err);
        return res.status(500).json({
            error: 'Hiba a seed során',
            message: err.message
        });
    }
}
