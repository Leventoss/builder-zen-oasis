import bcrypt from "bcryptjs";
import { sql } from "../lib/database";

async function createAdminUser() {
  try {
    console.log("Admin kullanıcı oluşturuluyor...");

    const email = "admin@aniwa.com";
    const password = "admin123";
    const username = "admin";

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT * FROM users WHERE email = ${email} OR is_admin = true
    `;

    if (existingAdmin.length > 0) {
      console.log("Admin kullanıcı zaten mevcut:", existingAdmin[0].email);
      return existingAdmin[0];
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await sql`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES (${username}, ${email}, ${passwordHash}, true)
      RETURNING id, username, email, is_admin
    `;

    console.log("Admin kullanıcı oluşturuldu:");
    console.log(`Email: ${email}`);
    console.log(`Şifre: ${password}`);
    console.log(`Admin: ${adminUser[0].is_admin}`);

    return adminUser[0];
  } catch (error) {
    console.error("Admin oluşturma hatası:", error);
  }
}

export { createAdminUser };
