import { Pool } from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function runMigration() {
  try {
    console.log('Running database migration...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const sqlPath = join(__dirname, 'run_database_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const client = await pool.connect();
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await client.query(statement);
      }
    }
    
    console.log('✅ Database migration completed successfully!');
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 