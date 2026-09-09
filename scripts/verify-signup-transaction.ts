import { randomUUID } from 'node:crypto';

import { prisma } from '../server/lib/prisma';
import { createSignupAccount } from '../server/routes/auth';

const TEST_DOMAIN = 'signup-transaction.invalid';

function accountInput(email: string) {
  return {
    email,
    name: 'Migration Test Host',
    displayName: 'Migration Test Host',
    passwordHash: 'not-a-real-password-hash',
    ageEligible: true as const,
    termsVersion: '2026-09-06',
    privacyVersion: '2026-09-06',
  };
}

async function verifySuccessfulPair(): Promise<void> {
  const id = randomUUID();
  const email = `success-${id}@${TEST_DOMAIN}`;
  await createSignupAccount(prisma, accountInput(email), id);
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.userProfile.findUnique({ where: { id } }),
  ]);
  if (!user || !profile) throw new Error('Signup did not create one user/profile pair');
}

async function verifyProfileFailureRollsBackUser(): Promise<void> {
  const id = randomUUID();
  const email = `rollback-${id}@${TEST_DOMAIN}`;
  await prisma.userProfile.create({
    data: { id, username: `pre_${id.replaceAll('-', '').slice(0, 20)}`, display_name: 'Existing' },
  });
  let failed = false;
  try {
    await createSignupAccount(prisma, accountInput(email), id);
  } catch {
    failed = true;
  }
  if (!failed) throw new Error('Profile conflict unexpectedly committed signup');
  if (await prisma.user.findUnique({ where: { id } })) {
    throw new Error('Profile conflict left an orphaned user');
  }
}

async function verifyConcurrentEmailUniqueness(): Promise<void> {
  const email = `race-${randomUUID()}@${TEST_DOMAIN}`;
  const attempts = await Promise.allSettled([
    createSignupAccount(prisma, accountInput(email), randomUUID()),
    createSignupAccount(prisma, accountInput(email), randomUUID()),
  ]);
  const fulfilled = attempts.filter((attempt) => attempt.status === 'fulfilled').length;
  const rejected = attempts.filter((attempt) => attempt.status === 'rejected').length;
  if (fulfilled !== 1 || rejected !== 1) {
    throw new Error(`Concurrent signup expected one winner, received ${fulfilled} winners`);
  }
  if (await prisma.user.count({ where: { email } }) !== 1) {
    throw new Error('Concurrent signup did not preserve unique email identity');
  }
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${TEST_DOMAIN}` } },
    select: { id: true },
  });
  const ids = users.map((user) => user.id);
  await prisma.userProfile.deleteMany({
    where: { OR: [{ id: { in: ids } }, { username: { startsWith: 'pre_' } }] },
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${TEST_DOMAIN}` } } });
}

async function main(): Promise<void> {
  await cleanup();
  try {
    await verifySuccessfulPair();
    await verifyProfileFailureRollsBackUser();
    await verifyConcurrentEmailUniqueness();
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
