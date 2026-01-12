#!/usr/bin/env node
/**
 * Generate a secure session secret
 * Usage: node generate-secret.js
 */

const crypto = require('crypto');

// Generate a 32-byte random string and encode it in base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated Session Secret:');
console.log('='.repeat(50));
console.log(secret);
console.log('='.repeat(50));
console.log('\n💡 Copy this value and use it as SESSION_SECRET in:');
console.log('   - Your .env file');
console.log('   - GitHub Secrets (as SESSION_SECRET)');
console.log('\n⚠️  Keep this secret secure and never commit it to git!\n');
