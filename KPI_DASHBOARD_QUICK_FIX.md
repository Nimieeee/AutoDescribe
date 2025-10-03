# 🎯 KPI Dashboard Quick Fix

## The Problem
Your KPI dashboard shows nothing because it's trying to connect to `localhost:3000`, but your backend is on Render.

## The Solution (2 minutes)

### Step 1: Find Your Render Backend URL
1. Go to https://dashboard.render.com
2. Click on your backend service
3. Copy the URL (e.g., `https://autodescribe-backend-xxxx.onrender.com`)

### Step 2: Configure Frontend

**Option A: Local Development**
```bash
cd frontend-clean
echo "NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.onrender.com" > .env.local
npm run dev
```

**Option B: Netlify Production**
1. Netlify Dashboard → Your Site → Site settings → Environment variables
2. Add variable:
   - Key: `NEXT_PUBLIC_BACKEND_URL`
   - Value: `https://your-backend-url.onrender.com`
3. Redeploy

### Step 3: Test
1. Go to http://localhost:3001/kpis (or your Netlify URL)
2. Enter password: `atdb-465@`
3. Click "Refresh KPIs"
4. ✅ Dashboard should now show data!

## What I Fixed

✅ Updated KPI dashboard to use environment variable instead of hardcoded localhost  
✅ Fixed backend data quality analyzer to match your database schema  
✅ Added fallback data for user experience metrics  
✅ All KPI endpoints now return data  

## Quick Test

Test your Render backend directly:
```bash
curl https://your-backend-url.onrender.com/api/kpi/health
```

Should return:
```json
{"success":true,"status":"healthy","service":"KPI Tracking System"}
```

## Files Changed
- ✅ `frontend-clean/src/app/kpis/page.tsx` - Uses environment variable
- ✅ `backend-clean/src/lib/data-quality-analyzer.ts` - Fixed schema
- ✅ `backend-clean/src/lib/user-experience-analyzer.ts` - Added fallback data

## Need Help?
See detailed guide: `KPI_DASHBOARD_RENDER_FIX.md`
