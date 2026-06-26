import mysql from 'mysql2/promise';

// Load environment variables here if you aren't already doing so globally
// import dotenv from 'dotenv';
// dotenv.config();

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'toefl_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Executes a SQL query with optional parameters.
 *
 * @param sql The SQL query string
 * @param params Optional array of parameters to inject into the query
 * @returns The query results
 */
export async function query<T>(sql: string, params: any[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;
