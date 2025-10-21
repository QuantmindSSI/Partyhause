#!/usr/bin/env node
/**
 * Seed Event Templates
 * 
 * Loads template JSON files from server/data/templates/ into the Supabase database
 * Run with: node scripts/seed-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTemplates() {
  console.log('🌱 Seeding event templates...\n');

  const templatesDir = path.join(__dirname, '..', 'server', 'data', 'templates');
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} template files\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const templateData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`📝 Processing: ${templateData.name} (${templateData.slug})`);

    try {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('templates')
        .select('id, slug')
        .eq('slug', templateData.slug)
        .single();

      if (existing) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', existing.id);

        if (error) throw error;
        console.log(`   ✅ Updated existing template\n`);
      } else {
        // Insert new template
        const { error } = await supabase
          .from('templates')
          .insert(templateData);

        if (error) throw error;
        console.log(`   ✅ Inserted new template\n`);
      }

      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Seeding complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(50) + '\n');

  // Verify templates in database
  const { data: templates, error } = await supabase
    .from('templates')
    .select('slug, name, category, featured')
    .eq('published', true)
    .order('featured', { ascending: false });

  if (!error && templates) {
    console.log('📊 Current templates in database:\n');
    templates.forEach(t => {
      const featuredBadge = t.featured ? '⭐' : '  ';
      console.log(`   ${featuredBadge} ${t.name} (${t.category})`);
    });
    console.log();
  }
}

// Run the seeder
seedTemplates()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
