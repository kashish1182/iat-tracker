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