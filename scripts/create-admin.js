/**
 * Run: node scripts/create-admin.js
 * Prompts for a username and password, then writes ADMIN_USER and
 * ADMIN_PASS_HASH into .env (creating the file if it doesn't exist).
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// simple hidden-input for password
function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = '';
    const onData = (char) => {
      char = char.toString('utf8');
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  console.log('=== Create Admin Account ===');
  const username = await ask('Username: ');
  const password = await askHidden('Password: ');
  rl.close();

  const hash = await bcrypt.hash(password, 10);

  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    envContent = envContent
      .split('\n')
      .filter((line) => !line.startsWith('ADMIN_USER=') && !line.startsWith('ADMIN_PASS_HASH='))
      .join('\n');
  }

  envContent += `\nADMIN_USER=${username}\nADMIN_PASS_HASH=${hash}\n`;
  if (!envContent.includes('SESSION_SECRET=')) {
    envContent += `SESSION_SECRET=${require('crypto').randomBytes(32).toString('hex')}\n`;
  }

  fs.writeFileSync(ENV_PATH, envContent.trim() + '\n');
  console.log('\nSaved to .env — you can now log in at /admin with these credentials.');
})();
