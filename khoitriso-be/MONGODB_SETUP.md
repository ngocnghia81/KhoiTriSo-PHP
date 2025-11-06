# MongoDB Forum Setup Guide

## 🚀 Quick Start

### 1. Install MongoDB Package

```bash
cd khoitriso-be
composer require mongodb/laravel-mongodb
```

### 2. Update .env File

Copy the MongoDB configuration from `.env.example`:

```env
# MongoDB Configuration for Forum
MONGODB_CONNECTION=mongodb
MONGODB_HOST=127.0.0.1
MONGODB_PORT=27017
MONGODB_DATABASE=khoitriso_forum
MONGODB_USERNAME=
MONGODB_PASSWORD=
```

### 3. Install MongoDB Server

#### Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB (choose "Complete" installation)
3. Install MongoDB Compass (GUI tool) - optional but recommended
4. MongoDB will run as a Windows Service automatically

#### Verify MongoDB is Running:
```bash
# Check if MongoDB service is running
services.msc  # Look for "MongoDB" service

# Or connect with mongosh
mongosh
```

### 4. Create MongoDB Database and Collections

#### Option A: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Create new database: `khoitriso_forum`
4. Create collections:
   - `questions`
   - `answers`
   - `comments`
   - `categories`
   - `tags`
   - `votes`
   - `bookmarks`

#### Option B: Using mongosh (CLI)
```javascript
// Connect to MongoDB
mongosh

// Switch to database (creates if not exists)
use khoitriso_forum

// Create collections with schema validation
db.createCollection("questions", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["title", "content", "userId", "userName"],
         properties: {
            title: { bsonType: "string" },
            content: { bsonType: "string" },
            userId: { bsonType: "int" },
            userName: { bsonType: "string" },
            userAvatar: { bsonType: "string" },
            tags: { bsonType: "array" },
            categoryId: { bsonType: "string" },
            categoryName: { bsonType: "string" },
            views: { bsonType: "int" },
            votes: { bsonType: "int" },
            answersCount: { bsonType: "int" },
            isSolved: { bsonType: "bool" },
            isPinned: { bsonType: "bool" },
            isClosed: { bsonType: "bool" },
            isDeleted: { bsonType: "bool" },
            lastActivityAt: { bsonType: "date" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" }
         }
      }
   }
})

db.createCollection("answers")
db.createCollection("comments")
db.createCollection("categories")
db.createCollection("tags")
db.createCollection("votes")
db.createCollection("bookmarks")

// Create indexes for better performance
db.questions.createIndex({ "userId": 1 })
db.questions.createIndex({ "categoryId": 1 })
db.questions.createIndex({ "tags": 1 })
db.questions.createIndex({ "createdAt": -1 })
db.questions.createIndex({ "views": -1 })
db.questions.createIndex({ "votes": -1 })
db.questions.createIndex({ "isDeleted": 1 })
db.questions.createIndex({ "title": "text", "content": "text" })

db.answers.createIndex({ "questionId": 1 })
db.answers.createIndex({ "userId": 1 })
db.answers.createIndex({ "votes": -1 })
db.answers.createIndex({ "isAccepted": 1 })

db.comments.createIndex({ "parentId": 1, "parentType": 1 })
db.comments.createIndex({ "userId": 1 })

db.votes.createIndex({ "targetId": 1, "targetType": 1 })
db.votes.createIndex({ "userId": 1, "targetId": 1, "targetType": 1 }, { unique: true })

db.bookmarks.createIndex({ "userId": 1 })
db.bookmarks.createIndex({ "questionId": 1 })
db.bookmarks.createIndex({ "userId": 1, "questionId": 1 }, { unique: true })

db.categories.createIndex({ "name": 1 }, { unique: true })
db.categories.createIndex({ "isActive": 1 })
db.categories.createIndex({ "sortOrder": 1 })

db.tags.createIndex({ "name": 1 }, { unique: true })
db.tags.createIndex({ "questionsCount": -1 })
```

### 5. Seed Initial Data (Optional)

```javascript
// Insert sample categories
db.categories.insertMany([
   {
      name: "Toán học",
      description: "Câu hỏi về toán học",
      color: "#3B82F6",
      icon: "calculator",
      questionsCount: 0,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      name: "Vật lý",
      description: "Câu hỏi về vật lý",
      color: "#EF4444",
      icon: "atom",
      questionsCount: 0,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      name: "Hóa học",
      description: "Câu hỏi về hóa học",
      color: "#10B981",
      icon: "flask",
      questionsCount: 0,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      name: "Sinh học",
      description: "Câu hỏi về sinh học",
      color: "#8B5CF6",
      icon: "dna",
      questionsCount: 0,
      isActive: true,
      sortOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      name: "Lập trình",
      description: "Câu hỏi về lập trình",
      color: "#F59E0B",
      icon: "code",
      questionsCount: 0,
      isActive: true,
      sortOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date()
   }
])

// Insert sample tags
db.tags.insertMany([
   { name: "toán-lớp-12", description: "Toán lớp 12", color: "#3B82F6", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "đại-số", description: "Đại số", color: "#EF4444", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "hình-học", description: "Hình học", color: "#10B981", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "vật-lý-12", description: "Vật lý 12", color: "#F59E0B", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "cơ-học", description: "Cơ học", color: "#8B5CF6", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "điện-học", description: "Điện học", color: "#EC4899", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "hóa-học-12", description: "Hóa học 12", color: "#06B6D4", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "hóa-hữu-cơ", description: "Hóa hữu cơ", color: "#84CC16", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "python", description: "Python programming", color: "#3776AB", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
   { name: "javascript", description: "JavaScript programming", color: "#F7DF1E", questionsCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() }
])
```

### 6. Test MongoDB Connection

Create a test file: `test-mongodb.php`

```php
<?php

require 'vendor/autoload.php';

use MongoDB\Client;

try {
    $client = new Client("mongodb://localhost:27017");
    
    // Test connection
    $databases = $client->listDatabases();
    echo "✅ MongoDB connection successful!\n\n";
    
    echo "Available databases:\n";
    foreach ($databases as $db) {
        echo "  - " . $db->getName() . "\n";
    }
    
    // Test forum database
    $db = $client->khoitriso_forum;
    $collections = $db->listCollections();
    
    echo "\nCollections in khoitriso_forum:\n";
    foreach ($collections as $collection) {
        echo "  - " . $collection->getName() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ MongoDB connection failed: " . $e->getMessage() . "\n";
}
```

Run test:
```bash
php test-mongodb.php
```

### 7. Clear Laravel Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 8. Test Forum API

#### Create a Question
```bash
POST http://localhost:8000/api/forum/questions
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Làm thế nào để giải phương trình bậc 2?",
  "content": "Tôi đang gặp khó khăn với việc giải phương trình ax² + bx + c = 0. Ai có thể giải thích chi tiết không?",
  "categoryId": "CATEGORY_ID_FROM_MONGODB",
  "categoryName": "Toán học",
  "tags": ["toán-lớp-12", "đại-số"]
}
```

#### Get Questions
```bash
GET http://localhost:8000/api/forum/questions
```

#### Get Question by ID
```bash
GET http://localhost:8000/api/forum/questions/QUESTION_ID
```

## 📊 MongoDB Indexes Explained

### Questions Collection Indexes:
- **userId**: Fast lookup of questions by user
- **categoryId**: Filter questions by category
- **tags**: Filter questions by tags
- **createdAt**: Sort by newest/oldest
- **views**: Sort by popularity
- **votes**: Sort by most voted
- **isDeleted**: Filter out deleted questions
- **text**: Full-text search on title and content

### Answers Collection Indexes:
- **questionId**: Get all answers for a question
- **userId**: Get all answers by user
- **votes**: Sort answers by votes
- **isAccepted**: Find accepted answer

### Votes Collection Indexes:
- **Composite unique**: Prevent duplicate votes (userId + targetId + targetType)
- **targetId + targetType**: Get votes for specific target

### Bookmarks Collection Indexes:
- **Composite unique**: Prevent duplicate bookmarks (userId + questionId)
- **userId**: Get user's bookmarks

## 🔧 MongoDB Best Practices

### 1. Use Indexes Wisely
```javascript
// Check index usage
db.questions.explain("executionStats").find({ categoryId: "xyz" })
```

### 2. Aggregation Pipeline
```javascript
// Get question statistics
db.questions.aggregate([
   { $match: { isDeleted: false } },
   { $group: {
      _id: "$categoryId",
      total: { $sum: 1 },
      avgVotes: { $avg: "$votes" },
      totalViews: { $sum: "$views" }
   }}
])
```

### 3. Backup MongoDB
```bash
# Backup database
mongodump --db khoitriso_forum --out ./backup

# Restore database
mongorestore --db khoitriso_forum ./backup/khoitriso_forum
```

### 4. Monitor Performance
```javascript
// Check slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

## 🚨 Troubleshooting

### Issue 1: MongoDB not connecting
```bash
# Check if MongoDB service is running
net start MongoDB

# Check MongoDB logs
type "C:\Program Files\MongoDB\Server\7.0\log\mongod.log"
```

### Issue 2: Package not found
```bash
# Clear composer cache
composer clear-cache

# Reinstall package
composer require mongodb/laravel-mongodb
```

### Issue 3: Connection timeout
```env
# Increase timeout in .env
MONGODB_OPTIONS_SERVER_SELECTION_TIMEOUT_MS=30000
MONGODB_OPTIONS_CONNECT_TIMEOUT_MS=30000
```

## ✅ Verification Checklist

- [ ] MongoDB Server installed and running
- [ ] MongoDB PHP extension installed (`php -m | grep mongodb`)
- [ ] Composer package installed (`composer show | grep mongodb`)
- [ ] Database `khoitriso_forum` created
- [ ] Collections created (7 collections)
- [ ] Indexes created (15+ indexes)
- [ ] Sample data inserted
- [ ] Laravel can connect to MongoDB
- [ ] Forum API endpoints working

## 🎉 Done!

Your MongoDB Forum system is now ready to use! 

Check the API documentation for all available endpoints:
- Questions CRUD
- Answers CRUD
- Comments CRUD
- Votes (upvote/downvote)
- Bookmarks
- Categories management
- Tags management
- Statistics

Happy coding! 🚀
