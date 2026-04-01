# Internship Application Tracker (IAT)

A full-stack web app to organize your entire job/internship search — applications, interviews, contacts, deadlines, and performance analytics — all in one place.

**Stack:** Next.js 14 · TypeScript · PostgreSQL (Neon.tech) · Deployed on Vercel

---

## Features

### Basic
- ✅ Manage **companies** (add/edit/delete with industry, location, website)
- ✅ Manage **job postings** per company (title, type, URL, deadline)
- ✅ Track **applications** (status, applied date, source, notes)
- ✅ Log **interview rounds** (type, date, outcome, notes)
- ✅ Manage **contacts** (recruiters, alumni, networking connections)
- ✅ **Search & filter** applications by status, source, date range, company
- ✅ **Reports** — upcoming deadlines, upcoming interviews, status breakdown

### Advanced (SQL Aggregations + Derived Metrics)
- 📊 **Response rate** — % of applications that reached interview stage
- 📊 **Offer rate** — % of interviews that became offers
- 📊 **Avg days to first response** — date math across tables
- 🏆 **Company engagement score** — multi-table JOIN with derived formula: `(interviews×3) + (contacts×2) + (offers×5) − rejections`
- 🎯 **Best Bets momentum score** — predictive ranking of active applications based on source conversion rate, interview progression, contact depth, and current stage

---

## Setup

### 1. Get Your Neon.tech Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Go to **Connection Details** → copy the **Connection string** (looks like `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Open the **SQL Editor** in Neon dashboard
5. Paste and run the entire contents of `schema.sql` — this creates all tables and seeds sample data

### 2. Set Up the Project Locally

```bash
# Clone or download this project
cd iat-tracker

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and paste your Neon connection string:
# DATABASE_URL=postgres://your-connection-string-here
```

### 3. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

### Option A: GitHub (Recommended)

1. Push this project to a new GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. In **Environment Variables**, add:
   - Key: `DATABASE_URL`
   - Value: your Neon connection string
5. Click **Deploy** — done!

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel

# When prompted, add environment variable:
# DATABASE_URL = your Neon connection string
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── companies/        GET (list+search), POST, [id] GET/PUT/DELETE
│   │   ├── jobs/             GET (filter by company/type), POST, [id] PUT/DELETE
│   │   ├── applications/     GET (multi-table JOIN + filters), POST, [id] GET/PUT/DELETE
│   │   ├── interviews/       GET (upcoming filter), POST, PUT, DELETE
│   │   ├── contacts/         GET (search), POST, PUT, DELETE
│   │   └── dashboard/        Advanced aggregate metrics
│   ├── applications/         Applications list page
│   ├── companies/            Companies + job postings page
│   ├── contacts/             Contacts/networking page
│   ├── globals.css           Design system
│   ├── layout.tsx            Nav + root layout
│   └── page.tsx              Dashboard
└── lib/
    └── db.ts                 Neon PostgreSQL connection pool
```

---

## Key SQL Queries

### Multi-table JOIN (applications list)
```sql
SELECT a.*, jp.title, jp.deadline, c.name AS company_name,
       COUNT(i.id) AS interview_count
FROM applications a
JOIN job_postings jp ON jp.id = a.job_posting_id
JOIN companies    c  ON c.id  = jp.company_id
LEFT JOIN interviews i ON i.application_id = a.id
WHERE c.name ILIKE $1
GROUP BY a.id, jp.id, c.id
ORDER BY a.updated_at DESC;
```

### Aggregate query (status breakdown)
```sql
SELECT status, COUNT(*) AS count
FROM applications
GROUP BY status
ORDER BY count DESC;
```

### Advanced: Company engagement score
```sql
SELECT c.name,
  (COUNT(DISTINCT i.id) * 3 +
   COUNT(DISTINCT ct.id) * 2 +
   COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('Offer','Accepted')) * 5 -
   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Rejected') * 1
  ) AS engagement_score
FROM companies c
LEFT JOIN job_postings jp ON jp.company_id = c.id
LEFT JOIN applications a  ON a.job_posting_id = jp.id
LEFT JOIN interviews   i  ON i.application_id = a.id
LEFT JOIN contacts     ct ON ct.company_id = c.id
GROUP BY c.id
HAVING COUNT(DISTINCT a.id) > 0
ORDER BY engagement_score DESC;
```

---

## Do You Need GitHub Copilot?

**No.** Copilot is optional code autocomplete — it doesn't affect hosting or deployment. You only need:
- [Neon.tech](https://neon.tech) (free) — PostgreSQL database
- [Vercel](https://vercel.com) (free) — hosting
- [GitHub](https://github.com) (free) — connect repo to Vercel for auto-deploys
