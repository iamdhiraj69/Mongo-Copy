# Testing Guide for mongodbcopy v1.1.0

This guide helps you test all the new features introduced in version 1.1.0.

## Prerequisites

1. Install MongoDB locally or have access to test MongoDB instances
2. Install mongodbcopy: `npm install -g mongodbcopy` or run locally
3. Set up `.env` file with test database credentials

## Test Environment Setup

### 1. Create Test Database

```bash
# Using MongoDB Shell
mongosh

use test_mongodbcopy

# Create test collections with sample data
db.users.insertMany([
  { _id: 1, name: "Alice", email: "alice@test.com", updatedAt: new Date("2024-01-01") },
  { _id: 2, name: "Bob", email: "bob@test.com", updatedAt: new Date("2024-01-15") },
  { _id: 3, name: "Charlie", email: "charlie@test.com", updatedAt: new Date("2024-02-01") }
])

db.posts.insertMany([
  { _id: 1, title: "Post 1", content: "Content 1", updatedAt: new Date("2024-01-10") },
  { _id: 2, title: "Post 2", content: "Content 2", updatedAt: new Date("2024-01-20") }
])

# Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ name: 1, email: 1 })
db.posts.createIndex({ title: "text" })

exit
```

### 2. Configure .env

```env
SOURCE_DB_URI=mongodb://localhost:27017
TARGET_DB_URI=mongodb://localhost:27017
DB_NAME=test_mongodbcopy
BATCH_SIZE=100
```

---

## Feature Tests

### Test 1: Progress Bars

**What to test**: Visual progress feedback during copy operations

```bash
# Test with progress bars (default)
mongodbcopy --collections users --dry-run

# Test without progress bars
mongodbcopy --collections users --dry-run --no-progress
```

**Expected Result**:
- With progress: See animated progress bar with percentage and counts
- Without progress: No progress bar, only log messages

---

### Test 2: Index Copying

**What to test**: Indexes are copied from source to target

```bash
# Copy with indexes
mongodbcopy --collections users,posts --copy-indexes

# Verify indexes were copied
mongosh
use test_mongodbcopy
db.users.getIndexes()  # Should show email and name+email indexes
db.posts.getIndexes()  # Should show text index on title
exit
```

**Expected Result**:
- All indexes except `_id_` are recreated on target
- Index options preserved (unique, text, etc.)

---

### Test 3: Index Export to JSON

**What to test**: Indexes are exported alongside data

```bash
# Export collections with indexes
mongodbcopy --all --export-json --copy-indexes --output-dir ./test-backup

# Check output
ls test-backup/
# Should see:
# - users.json
# - users_indexes.json
# - posts.json
# - posts_indexes.json

# View index definitions
cat test-backup/users_indexes.json
```

**Expected Result**:
- JSON files contain collection data
- `_indexes.json` files contain index definitions
- Index definitions are properly formatted JSON arrays

---

### Test 4: Incremental Backup

**What to test**: Only documents updated since a date are copied

```bash
# Copy only docs updated after Jan 15, 2024
mongodbcopy --all --incremental \
  --timestamp-field updatedAt \
  --since 2024-01-15T00:00:00Z

# Should copy:
# - users: Bob and Charlie (2 docs)
# - posts: Post 2 (1 doc)
# Should skip:
# - users: Alice (updated before cutoff)
# - posts: Post 1 (updated before cutoff)
```

**Expected Result**:
- Output shows: `users: incremental-copied (2/2)`
- Output shows: `posts: incremental-copied (1/1)`
- Progress bar shows correct counts

---

### Test 5: Incremental Mode with Upsert

**What to test**: Incremental mode updates existing docs instead of replacing all

```bash
# First, run a full copy to target
mongodbcopy --all

# Update a document in source
mongosh
use test_mongodbcopy
db.users.updateOne(
  { _id: 1 },
  { $set: { name: "Alice Updated", updatedAt: new Date() } }
)
exit

# Run incremental sync
mongodbcopy --all --incremental \
  --timestamp-field updatedAt \
  --since 2024-02-01T00:00:00Z

# Verify in target
mongosh
use test_mongodbcopy
db.users.findOne({ _id: 1 })  # Should show "Alice Updated"
exit
```

**Expected Result**:
- Only updated document is synced
- Uses upsert (doesn't delete other docs)
- Progress shows incremental-copied status

---

### Test 6: Schema Validation

**What to test**: Pre-copy validation catches schema issues

```bash
# This should work (valid schema)
mongodbcopy --collections users --validate-schema

# To test failure, you'd need collections with incompatible schemas
# (e.g., different validators on source vs target)
```

**Expected Result**:
- Validation passes for compatible schemas
- Shows `schema-validation-failed` status on mismatch
- Copy operation continues only if validation passes

---

### Test 7: Combined Features

**What to test**: Multiple features work together

```bash
# Full-featured backup
mongodbcopy --all \
  --copy-indexes \
  --validate-schema \
  --batch-size 50 \
  --export-json \
  --output-dir ./full-backup

# Should:
# - Show progress bars
# - Validate schemas
# - Export data to JSON
# - Export indexes to separate files
# - Process in batches of 50
```

**Expected Result**:
- All features work without conflicts
- Progress bars show during export
- Both data and index files created
- No errors or warnings

---

### Test 8: Performance with Large Dataset

**What to test**: Performance optimizations handle large datasets

```bash
# Create large dataset
mongosh
use test_mongodbcopy
for (let i = 0; i < 10000; i++) {
  db.large_collection.insertOne({
    _id: i,
    data: "x".repeat(100),
    updatedAt: new Date()
  })
}
exit

# Test performance
time mongodbcopy --collections large_collection \
  --batch-size 1000

# Test incremental performance
time mongodbcopy --collections large_collection \
  --incremental \
  --timestamp-field updatedAt \
  --since 2024-01-01T00:00:00Z \
  --batch-size 1000
```

**Expected Result**:
- Progress bar updates smoothly
- Memory usage stays reasonable
- Completes without errors
- Incremental mode faster than full copy

---

### Test 9: Dry Run with New Features

**What to test**: Dry run works with all new features

```bash
# Dry run with all features
mongodbcopy --all \
  --dry-run \
  --copy-indexes \
  --validate-schema \
  --incremental \
  --timestamp-field updatedAt \
  --since 2024-01-01T00:00:00Z
```

**Expected Result**:
- Shows what would be copied
- No actual data is written
- Progress bars show (but don't write)
- Returns status `dry-run` for each collection

---

### Test 10: Programmatic API

**What to test**: New features work via Node.js API

Create test file `test-api.js`:

```javascript
import { copyCollections } from './src/api.js';

async function test() {
  // Test 1: With progress bars
  console.log('Test 1: Progress bars');
  let results = await copyCollections({
    collections: ['users'],
    showProgress: true,
    dryRun: true
  });
  console.log(results);

  // Test 2: Copy with indexes
  console.log('\nTest 2: Index copying');
  results = await copyCollections({
    collections: ['users'],
    copyIndexes: true,
    dryRun: true
  });
  console.log(results);

  // Test 3: Incremental backup
  console.log('\nTest 3: Incremental');
  results = await copyCollections({
    collections: ['users'],
    incremental: true,
    timestampField: 'updatedAt',
    since: new Date('2024-01-15'),
    dryRun: true
  });
  console.log(results);

  // Test 4: Schema validation
  console.log('\nTest 4: Schema validation');
  results = await copyCollections({
    collections: ['users'],
    validateSchema: true,
    dryRun: true
  });
  console.log(results);

  console.log('\nAll API tests completed!');
}

test().catch(console.error);
```

Run it:
```bash
node test-api.js
```

**Expected Result**:
- All tests complete without errors
- Results show appropriate status messages
- Progress bars display during execution

---

## Unit Tests

Run the test suite:

```bash
npm test
```

**Expected Result**:
- 27 tests pass
- All features have coverage
- No test failures

Run with coverage:
```bash
npm test -- --coverage
```

---

## Lint Check

Verify code quality:

```bash
npm run lint
```

**Expected Result**:
- No linting errors
- No warnings
- All files pass ESLint

---

## Regression Tests

Verify existing features still work:

```bash
# Test 1: Basic copy (should still work)
mongodbcopy --all

# Test 2: JSON export (should still work)
mongodbcopy --all --export-json --output-dir ./backup

# Test 3: JSON import (should still work)
mongodbcopy --import-json --output-dir ./backup

# Test 4: Batch size (should still work)
mongodbcopy --all --batch-size 50

# Test 5: Dry run (should still work)
mongodbcopy --all --dry-run

# Test 6: Specific collections (should still work)
mongodbcopy --collections users,posts

# Test 7: Skip confirmation (should still work)
mongodbcopy --all --yes
```

**Expected Result**:
- All existing features work as before
- No breaking changes
- Backward compatibility maintained

---

## Cleanup

After testing:

```bash
# Remove test database
mongosh
use test_mongodbcopy
db.dropDatabase()
exit

# Remove backup directories
rm -rf ./backup ./test-backup ./full-backup
```

---

## Troubleshooting

### Issue: Progress bar not showing
**Solution**: Check if `--no-progress` flag is set. Default is to show progress.

### Issue: Incremental mode not finding documents
**Solution**: 
- Verify timestamp field exists in documents
- Check date format for `--since` parameter (use ISO 8601)
- Ensure documents have values in timestamp field

### Issue: Index copying fails
**Solution**:
- Check if target already has indexes with same names
- Verify user has permission to create indexes
- Check MongoDB server version compatibility

### Issue: Schema validation fails
**Solution**:
- Review target collection validators
- Check for data type mismatches
- Ensure required fields are present

---

## Performance Benchmarks

After testing, document your findings:

| Feature | Dataset Size | Time Taken | Notes |
|---------|-------------|------------|-------|
| Full Copy | 10,000 docs | X seconds | Baseline |
| With Progress | 10,000 docs | X seconds | Minimal overhead |
| With Indexes | 10,000 docs | X seconds | + index creation time |
| Incremental | 1,000 docs | X seconds | Much faster |
| Schema Validation | 10,000 docs | X seconds | + validation time |

---

## Reporting Issues

If you find issues during testing:

1. Note the exact command used
2. Capture error messages
3. Document MongoDB version
4. Note Node.js version
5. Report at: https://github.com/iamdhiraj69/mongodbcopy/issues

---

## Success Criteria

All features pass testing when:

✅ Progress bars display correctly and update in real-time  
✅ Indexes are copied accurately to target  
✅ Incremental mode only copies updated documents  
✅ Schema validation catches incompatibilities  
✅ Performance is acceptable for large datasets  
✅ All features work in combination  
✅ Unit tests pass (27/27)  
✅ Linting passes with no errors  
✅ Backward compatibility maintained  
✅ Documentation is accurate  

---

**Happy Testing! 🧪**
