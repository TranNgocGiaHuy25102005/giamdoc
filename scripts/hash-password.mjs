import bcrypt from 'bcryptjs';
const pw = process.argv[2];
if (!pw) { console.error('Dùng: node scripts/hash-password.mjs "MAT_KHAU"'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 12));
