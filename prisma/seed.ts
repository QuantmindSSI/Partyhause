// ============================================================================
// PartyHause Prisma Seed Script
// ============================================================================
// Seeds the `templates` table with data from server/data/templates/*.json.
//
// Usage:
//   npx tsx prisma/seed.ts
//
// Or via Prisma:
//   npx prisma db seed
//
// The seed reads each JSON file in server/data/templates/, maps the fields
// to the Template model, and upserts by slug (so re-running is idempotent).
// ============================================================================

import { PrismaClient, TemplateCategory, PriceTier, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ----------------------------------------------------------------------------
// Type for the raw JSON template files
// ----------------------------------------------------------------------------

interface RawTemplate {
  name: string;
  slug: string;
  description: string;
  category: string;
  hero_image_url?: string;
  price_tier: string;
  featured?: boolean;
  published?: boolean;
  default_payload: Record<string, unknown>;
  required_fields_schema?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/**
 * Convert a string to a TemplateCategory enum value.
 * Throws if the category is not a valid enum member.
 */
function toTemplateCategory(value: string): TemplateCategory {
  const valid = [
    "birthday",
    "wedding",
    "corporate",
    "holiday",
    "social",
    "sports",
    "cultural",
    "fundraiser",
    "other",
  ] as const;
  if (!valid.includes(value as (typeof valid)[number])) {
    throw new Error(
      `Invalid template_category "${value}" in template JSON. ` +
        `Valid values: ${valid.join(", ")}`
    );
  }
  return value as TemplateCategory;
}

/**
 * Convert a string to a PriceTier enum value.
 * Throws if the price tier is not a valid enum member.
 */
function toPriceTier(value: string): PriceTier {
  const valid = ["free", "basic", "premium"] as const;
  if (!valid.includes(value as (typeof valid)[number])) {
    throw new Error(
      `Invalid price_tier "${value}" in template JSON. ` +
        `Valid values: ${valid.join(", ")}`
    );
  }
  return value as PriceTier;
}

// ----------------------------------------------------------------------------
// Main seed function
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  const templatesDir = path.resolve(__dirname, "..", "server", "data", "templates");

  console.log(`Seeding templates from: ${templatesDir}`);

  // Read all JSON files in the templates directory, sorted alphabetically
  const files = (await readdir(templatesDir))
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.warn("No template JSON files found. Nothing to seed.");
    return;
  }

  console.log(`Found ${files.length} template file(s): ${files.join(", ")}`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const raw = await readFile(filePath, "utf-8");
    const data: RawTemplate = JSON.parse(raw);

    console.log(`  Seeding "${data.slug}" (${data.category} / ${data.price_tier})...`);

    const template = await prisma.template.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        category: toTemplateCategory(data.category),
        hero_image_url: data.hero_image_url ?? null,
        price_tier: toPriceTier(data.price_tier),
        default_payload: data.default_payload as Prisma.InputJsonValue,
        required_fields_schema: (data.required_fields_schema ?? undefined) as Prisma.NullableJsonNullValueInput | undefined,
        featured: data.featured ?? false,
        published: data.published ?? true,
      },
      create: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: toTemplateCategory(data.category),
        hero_image_url: data.hero_image_url ?? null,
        price_tier: toPriceTier(data.price_tier),
        default_payload: data.default_payload as Prisma.InputJsonValue,
        required_fields_schema: (data.required_fields_schema ?? undefined) as Prisma.NullableJsonNullValueInput | undefined,
        featured: data.featured ?? false,
        published: data.published ?? true,
        // author_id is null for seeded system templates
        // usage_count defaults to 0
      },
    });

    console.log(`    -> upserted template ${template.id} (slug: ${template.slug})`);
  }

  console.log(`\nSeeded ${files.length} template(s) successfully.`);
}

// ----------------------------------------------------------------------------
// Execute
// ----------------------------------------------------------------------------

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
