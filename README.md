# 🚀 Job Importer Scaffold

A production-ready, full-stack job feed aggregation platform that automatically imports, processes, and manages XML-based job listings at scale.

## ✨ What It Does

This system pulls job feeds from multiple sources on autopilot, queues them for processing, stores them efficiently, and gives you a beautiful admin dashboard to track everything in real-time.

**Perfect for:** Job boards, recruitment platforms, career portals, or any platform that needs to aggregate job listings from multiple sources.

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │  ← Admin dashboard with import logs
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Express API   │  ← RESTful endpoints
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────┐
│   BullMQ Queue  │────→│  MongoDB     │
│   (via Redis)   │     │  (Jobs DB)   │
└────────┬────────┘     └──────────────┘
         ↑
         │
┌────────┴────────┐
│   Cron Jobs     │  ← Scheduled feed fetching
└─────────────────┘
```

## 📦 What's Inside

- **`client/`** - Next.js 13+ admin interface with real-time log tracking
- **`server/`** - Express backend with BullMQ workers and automated cron jobs
- **`docs/`** - Architecture docs and design decisions

## 🎯 Key Features

- ⏰ **Automated Imports** - Cron-scheduled XML feed fetching
- 🔄 **Queue-Based Processing** - Resilient job processing with BullMQ
- 📊 **Smart Deduplication** - Tracks new vs updated jobs automatically
- 📈 **Real-Time Monitoring** - Live dashboard showing import status
- 🎨 **Clean Admin UI** - Built with Next.js and modern React patterns
- 💾 **Efficient Storage** - MongoDB for scalable job persistence

## 🚦 Quick Start

### Prerequisites

Make sure you have these installed:
- Node.js 18 or higher
- MongoDB (local/Atlas/Docker)
- Redis (local/Docker/cloud)

**Pro tip:** Use Docker Desktop for local MongoDB and Redis instances!

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd job-importer-scaffold

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2️⃣ Configure Environment

Copy the example env file and fill in your details:

```bash
# In the root directory
cp .env.example .env
```

**Required environment variables:**

```env
MONGODB_URI – connection string for MongoDB.
REDIS_URL – Redis instance URI.
QUEUE_CONCURRENCY – number of concurrent BullMQ workers.
NEXT_PUBLIC_API_URL – base URL for the Express server, consumed by the Next.js client.
JOB_FEEDS – comma-separated list of Feed Name|https://feed-url pairs.
CRON_EXPRESSION – cron string for the hourly importer (defaults to 0 * * * *).
```

### 3️⃣ Start the Backend

```bash
cd server
npm run dev
```

The Express server will start on `http://localhost:3001` and:
- Connect to MongoDB and Redis
- Start the BullMQ worker
- Initialize cron jobs for feed fetching

### 4️⃣ Start the Frontend

```bash
cd client
npm run dev
```

Visit `http://localhost:3000` to see your admin dashboard! 🎉

## 📖 How It Works

### The Import Flow

1. **Scheduled Fetch** - Cron job (`server/cron/jobFetcher.js`) fetches XML feeds based on your schedule
2. **Queue Jobs** - Each job posting is added to a Redis-backed BullMQ queue
3. **Process Workers** - Workers (`server/queues/jobWorker.js`) pick up jobs and:
   - Parse job data
   - Check for duplicates
   - Upsert to MongoDB
   - Update import logs
4. **Track Results** - Import logs store statistics:
   - Total jobs processed
   - New jobs added
   - Existing jobs updated
   - Any errors encountered
5. **Monitor Dashboard** - View all import history in the Next.js admin UI

### File Structure Highlights

```
server/
├── cron/
│   └── jobFetcher.js      # Scheduled feed imports
├── models/
│   ├── Job.js             # Job schema
│   └── ImportLog.js       # Import history schema
├── queues/
│   ├── jobQueue.js        # BullMQ queue setup
│   └── jobWorker.js       # Job processing worker
├── routes/
│   └── importLogs.js      # API endpoints
└── services/
    └── jobImportService.js # Core import logic

client/
├── components/
│   └── LogTable.js        # Import logs display
└── pages/
    └── index.js           # Dashboard page
```

## 🔧 Development Tips

### Testing the API

Use your favorite REST client to test endpoints:

```bash
# Get all import logs
GET http://localhost:3001/api/import-logs

# Get logs with filters
GET http://localhost:3001/api/import-logs?status=success&limit=50
```

### Monitoring Queue Health

Watch the worker logs to see jobs being processed:

```bash
cd server
npm run dev
# Look for log messages about job processing
```

### Debugging Import Issues

Check the ImportLog collection in MongoDB:

```javascript
// Each log contains:
{
  feedName: "TechJobs",
  feedUrl: "https://...",
  status: "success" | "partial" | "failed",
  total: 150,
  newJobs: 45,
  updatedJobs: 105,
  errors: [...],
  timestamp: Date
}
```

## 🎨 Customization Ideas

- **Authentication** - Add auth middleware to protect admin routes
- **Notifications** - Send Slack/email alerts when imports fail
- **Analytics** - Track job trends, popular keywords, location clusters
- **API Expansion** - Build public API endpoints for job search
- **Multi-tenancy** - Support multiple companies/clients
- **Advanced Filters** - Add job category, location, salary range filters


## 🔐 Security Checklist

Before going to production:

- [ ] Add authentication to admin UI
- [ ] Secure API endpoints with API keys or JWT
- [ ] Validate and sanitize XML input
- [ ] Set up rate limiting on API routes
- [ ] Use environment-specific configs
- [ ] Enable MongoDB access control
- [ ] Secure Redis with password authentication

## 📚 Additional Resources

- Check out `docs/architecture.md` for detailed design decisions
- Review individual READMEs in `client/` and `server/` directories
- MongoDB schema design: [Job.js](server/models/Job.js)
- Queue configuration: [jobQueue.js](server/queues/jobQueue.js)

---

**Built with ❤️ using Next.js, Express, MongoDB, Redis, and BullMQ**