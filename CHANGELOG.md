# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-02

### Added
- ✨ Initial production release
- 🚀 CLI tool for MongoDB data migration and backup
- 📦 Programmatic API for Node.js integration
- 🪄 Copy entire databases or specific collections
- ⚡ Batch processing with adjustable batch size
- 🧰 Dry-run mode to simulate operations
- 💾 JSON export/import for backups
- 🤖 CI-ready with `--yes` flag to skip confirmations
- 📊 Beautiful progress feedback with spinners
- 🧠 Environment-based configuration via `.env` file
- 🔧 Support for custom batch sizes
- 📝 Comprehensive logging with file output option

### Fixed
- 🐛 Environment validation no longer blocks `--help` command
- 🐛 JSON export now writes proper array format instead of multiple arrays
- 🐛 Improved error handling for missing environment variables

### Security
- 🔒 Environment variables validation
- 🔒 Secure connection string handling

---

## [1.1.0] - 2025-11-02

### Added
- ✨ **Progress Bars**: Real-time visual feedback with document counts during copy operations using `cli-progress`
- 🔄 **Incremental Backups**: Copy only new/updated documents since a specific date using `--incremental`, `--timestamp-field`, and `--since` options
- 🔑 **Index Copying**: Automatically copy indexes from source to target collections with `--copy-indexes` flag
- ✅ **Schema Validation**: Optional pre-copy validation to ensure data compatibility with `--validate-schema` flag
- 🚀 **Performance Optimizations**: Enhanced batch processing with streaming and bulk operations for very large datasets
- 📊 **Progress Control**: Added `--no-progress` flag to disable progress bars when needed
- 🧪 **Enhanced Test Coverage**: Comprehensive test suite covering all new features, parameter validation, and integration points

### Changed
- 🔧 Improved batch processing with bulkWrite operations for incremental mode
- 🔧 Optimized cursor streaming for better memory efficiency
- 📚 Updated documentation with new CLI examples and API usage patterns
- 📦 Bumped version to 1.1.0 with updated package description

### Technical Details
- Incremental mode uses `replaceOne` with `upsert` for efficient document updates
- Progress bars show collection name, percentage, and document counts
- Index copying filters out `_id_` index and handles conflicts gracefully
- Schema validation performs test insert/delete to verify compatibility
- All new features work seamlessly with JSON export/import modes

## [Unreleased]

### Planned
- TypeScript version
- Change streams support for real-time sync
- Parallel collection processing
- Compression for JSON exports

[1.1.0]: https://github.com/iamdhiraj69/mongodbcopy/releases/tag/v1.1.0
[1.0.0]: https://github.com/iamdhiraj69/mongodbcopy/releases/tag/v1.0.0
