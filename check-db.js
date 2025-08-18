const { neon } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_UOqmtxn2y4hE@ep-orange-math-aelrf30d-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

const sql = neon(connectionString);

async function checkDatabase() {
  try {
    console.log('=== VERİTABANI DURUMU ===');
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tablolar:', tables.map(t => t.table_name));
    
    // Check users
    const users = await sql`SELECT id, username, email, is_admin FROM users`;
    console.log('\n=== KULLANICILAR (' + users.length + ' adet) ===');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Admin: ${user.is_admin}`);
    });
    
    // Check animes
    const animes = await sql`SELECT id, title, title_en, rating, year FROM animes LIMIT 25`;
    console.log('\n=== ANİMELER (' + animes.length + ' adet) ===');
    animes.forEach(anime => {
      console.log(`- ${anime.title} (${anime.title_en}) - Rating: ${anime.rating} - Year: ${anime.year}`);
    });
    
  } catch (error) {
    console.error('Veritabanı hatası:', error.message);
  }
}

checkDatabase();
