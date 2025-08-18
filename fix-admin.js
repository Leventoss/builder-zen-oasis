// Let's create a temporary fix for admin password
const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password: admin123");
  console.log("Hash:", hash);
  
  // Test hash
  const isValid = await bcrypt.compare(password, hash);
  console.log("Hash valid:", isValid);
}

generateHash();
