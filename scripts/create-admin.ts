/**
 * Create or promote an admin account.
 *
 * Usage:
 *   npm run admin:create -- admin@example.com
 *   ADMIN_PASSWORD='strong-password' npm run admin:create -- admin@example.com
 *
 * If no password is supplied, it is prompted for (input hidden).
 * Existing users are promoted to ADMIN; their password is only changed when
 * a new one is supplied.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createInterface } from 'node:readline';

const MIN_PASSWORD_LENGTH = 8;

const prisma = new PrismaClient();

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const stdin = process.stdin;

    // Suppress echo for the password.
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    process.stdout.write(question);

    let value = '';
    const onData = (chunk: Buffer) => {
      const char = chunk.toString('utf8');
      if (char === '\n' || char === '\r') {
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        process.stdout.write('\n');
        rl.close();
        resolve(value);
        return;
      }
      if (char === '\u0003') {
        process.stdout.write('\n');
        process.exit(1);
      }
      if (char === '\u007f') {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const emailArg = process.argv[2];
  const email = (emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- <email>');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD || '';
  if (!password && process.stdin.isTTY) {
    password = await promptHidden(`Password for ${email}: `);
    const confirm = await promptHidden('Confirm password: ');
    if (password !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
  }

  if (password && password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        ...(password ? { password: await hash(password, 10) } : {}),
      },
    });
    console.log(
      `Promoted existing user ${email} to ADMIN${password ? ' and updated the password' : ''}.`
    );
  } else {
    if (!password) {
      console.error('A password is required when creating a new admin.');
      process.exit(1);
    }
    await prisma.user.create({
      data: { email, password: await hash(password, 10), role: 'ADMIN' },
    });
    console.log(`Created admin user ${email}.`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to create admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
