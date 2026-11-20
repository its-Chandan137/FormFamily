import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const platformFields = [
  { key: 'first_name', label: 'First Name', type: 'text' },
  { key: 'last_name', label: 'Last Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'phone' },
  { key: 'resume', label: 'Resume', type: 'file' },
  { key: 'current_company', label: 'Current Company', type: 'text' },
  { key: 'experience', label: 'Experience', type: 'number' },
  { key: 'current_ctc', label: 'Current CTC', type: 'currency' },
  { key: 'expected_ctc', label: 'Expected CTC', type: 'currency' },
  { key: 'notice_period', label: 'Notice Period', type: 'text' },
  { key: 'current_location', label: 'Current Location', type: 'text' },
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set; skipping seed.');
    return;
  }

  for (const field of platformFields) {
    const existing = await prisma.fieldDefinition.findFirst({
      where: { orgId: null, key: field.key },
    });

    if (existing) {
      await prisma.fieldDefinition.update({
        where: { id: existing.id },
        data: { label: field.label, type: field.type },
      });
    } else {
      await prisma.fieldDefinition.create({
        data: {
          orgId: null,
          key: field.key,
          label: field.label,
          type: field.type,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed (safe to ignore in Part 1 without DB):', e);
    await prisma.$disconnect();
    process.exit(0);
  });
