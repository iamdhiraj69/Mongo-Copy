# 🧩 MongoCopy

**MongoCopy** is a developer-friendly CLI tool to copy, export, import, or back up MongoDB collections and databases — safely, quickly, and locally — without complex MongoDB shell commands.

---

## 🚀 Features

- 🪄 **Simple CLI** — Copy databases or specific collections in one line  
- ⚡ **Fast batch copying** — Adjustable batch size for huge datasets  
- 🧰 **Dry-run mode** — Simulate copy before actually writing  
- 💾 **JSON Export/Import** — Backup or restore collections as JSON files  
- 🤖 **CI-ready** — Use `--yes` to skip confirmations in scripts  
- 📊 **Progress feedback** — Beautiful spinners and progress logs  
- 🧠 **Environment-based config** — Works out of the box via `.env`

---

## 📦 Installation

### 1️⃣ Clone or Install Globally

```bash
# Clone from GitHub
git clone https://github.com/iamdhiraj69/Mongo-Copy.git
cd Mongo-Copy
npm install

# or install globally (once published)
npm i -g mongocopy
```

### 2️⃣ Setup Environment

Copy `.env.example` → `.env` and update your MongoDB details:

```bash
SOURCE_DB_URI=mongodb+srv://username:password@source.mongodb.net
TARGET_DB_URI=mongodb+srv://username:password@target.mongodb.net
DB_NAME=my_database
```

## 🧠 Usage

### Copy All Collections
```bash
mongocopy --all
```

### Copy Specific Collections
```bash
mongocopy --collections users,posts
```

### Preview Without Writing (Dry Run)
```bash
mongocopy --all --dry-run
```

### Copy with Custom Batch Size
```bash
mongocopy --all --batch-size 500
```

### Skip Confirmation
```bash
mongocopy --all --yes
```

## 💾 Backup / Restore JSON

### Export Collections to JSON
```bash
mongocopy --all --export-json
```
All files will be saved to the `backup/` folder (auto-created).

### Import JSON Back into MongoDB
```bash
mongocopy --import-json
```

You can change the backup directory using:
```bash
mongocopy --export-json --output-dir ./my_backup
```

## ⚙️ Environment Variables

| Key | Description | Default |
|-----|-------------|---------|
| SOURCE_DB_URI | MongoDB source URI | Required |
| TARGET_DB_URI | MongoDB target URI | Required |
| DB_NAME | Database name | Required |
| BATCH_SIZE | Documents per insert batch | 1000 |
| LOG_TO_FILE | Write logs to file (true/false) | false |
| LOG_PATH | Log file path (if enabled) | ./mongocopy.log |
| BACKUP_DIR | JSON export/import folder | ./backup |

## 🔧 Example

```bash
mongocopy --collections users,posts --batch-size 2000 --yes
```
Copies only users and posts collections using batch size 2000 without confirmation.

## 🧰 Development

```bash
npm install
npm run start
```

## 🪄 NPM CLI Setup (optional)

To use it as a global CLI after publishing, add this to package.json:

```json
{
  "bin": {
    "mongocopy": "./src/index.js"
  }
}
```

Then install globally:
```bash
npm i -g .
mongocopy --help
```

## 🧩 Roadmap

| Status | Enhancement | Description |
|--------|------------|-------------|
| ✅ | --dry-run | Simulate copy without writing |
| ✅ | --collections | Copy specific collections |
| ✅ | JSON export/import | Backup & restore to local JSON |
| ✅ | --yes flag | Skip confirmation for CI |
| ⚙️ | Progress bar | Visual feedback for long copies |
| 🧠 | File logging | Save logs for debugging |
| 🧩 | TypeScript version | Optional future version |
| 🧪 | Jest test cases | Ensure reliability for contributors |

## 🧑‍💻 Author

Dhiraj  
📦 GitHub: [iamdhiraj69](https://github.com/iamdhiraj69)
