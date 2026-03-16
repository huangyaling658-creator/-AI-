import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "pm-copilot.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT '产品经理',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export function createUser(email: string, passwordHash: string, name?: string): User {
  const stmt = db.prepare(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
  );
  const result = stmt.run(email, passwordHash, name || "产品经理");
  return findUserById(result.lastInsertRowid as number)!;
}

export function findUserByEmail(email: string): User | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | undefined;
}

export default db;
