/**
 * Script demonstrating the programmatic API of @kabeersingh/readme-buddy.
 *
 * This script imports `generateReadme` from the published package and executes
 * it with configuration options.
 */

const path = require('node:path');
const { generateReadme } = require('@kabeersingh/readme-buddy');

console.log('--- Generating README via @kabeersingh/readme-buddy Programmatic API ---');

const projectDir = path.resolve(__dirname, '..');

try {
  const result = generateReadme({
    projectDir,
    outputPath: 'README.md',
    overwrite: true,
    badges: true
  });

  console.log(`\n✅ README generation successful!`);
  console.log(`   Filename:       ${result.filename}`);
  console.log(`   Output Path:    ${result.outputPath}`);
  console.log(`   Bytes Written:  ${result.bytesWritten}`);
  console.log(`   Sections Built: ${result.sectionsGenerated.join(', ')}`);

  if (result.warnings && result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    for (const w of result.warnings) {
      console.log(`   - ${w}`);
    }
  }
} catch (err) {
  console.error(`\n❌ README generation failed:`, err.message);
  process.exit(1);
}
