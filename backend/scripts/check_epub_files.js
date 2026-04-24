/**
 * Script to check which books have epubFile set and detect duplicates
 * Run with: node scripts/check_epub_files.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  epubFile: { type: String, default: null },
}, { strict: false });

const Book = mongoose.model('Book', BookSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const books = await Book.find({}, 'title author epubFile').lean();

  console.log(`Total books: ${books.length}\n`);
  console.log('=== Books with epubFile set ===');

  const withFile = books.filter(b => b.epubFile);
  const withoutFile = books.filter(b => !b.epubFile);

  withFile.forEach(b => {
    console.log(`  [${b._id}] "${b.title}" by ${b.author}`);
    console.log(`    epubFile: ${b.epubFile}\n`);
  });

  console.log(`\n=== Books WITHOUT epubFile (${withoutFile.length}) ===`);
  withoutFile.forEach(b => {
    console.log(`  [${b._id}] "${b.title}" by ${b.author}`);
  });

  // Detect duplicate epubFile URLs
  const urlMap = {};
  withFile.forEach(b => {
    if (!urlMap[b.epubFile]) urlMap[b.epubFile] = [];
    urlMap[b.epubFile].push(`"${b.title}"`);
  });

  console.log('\n=== Duplicate epubFile URLs ===');
  let hasDuplicates = false;
  Object.entries(urlMap).forEach(([url, titles]) => {
    if (titles.length > 1) {
      hasDuplicates = true;
      console.log(`  URL: ${url}`);
      console.log(`  Shared by: ${titles.join(', ')}\n`);
    }
  });
  if (!hasDuplicates) console.log('  None found.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
