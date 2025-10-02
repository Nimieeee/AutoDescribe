# 🚀 Quick Deploy AutoDescribe (5 Minutes)

## Fastest Free Deployment Path

### Step 1: Database Setup (2 minutes)
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project
3. Go to SQL Editor → Paste content from `supabase-schema-clean.sql` → Run
4. Copy your project URL and anon key from Settings → API

### Step 2: Backend Deploy (1 minute)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click "Deploy from GitHub repo" → Select this repository
3. Set root directory: `backend-clean`
4. Add environment variables:
   ```
   DATABASE_URL=your_supabase_connection_string
   MISTRAL_API_KEY=your_mistral_api_key
   NODE_ENV=production
   ```
5. Deploy (auto-builds)

### Step 3: Frontend Deploy (1 minute)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Import Git Repository → Select this repository
3. Set root directory: `frontend-clean`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
   ```
5. Deploy (auto-builds)

### Step 4: Test (1 minute)
1. Visit your Vercel URL
2. Try generating a product description
3. Check the review dashboard (password: `atdb-465@`)

## One-Click Deploy Buttons

### Deploy Backend to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/autodescribe-backend)

### Deploy Frontend to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/autodescribe&project-name=autodescribe&root-directory=frontend-clean)

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/autodescribe&base=frontend-clean)

## Alternative: All-in-One Platforms

### Render (Free Tier)
1. Connect GitHub → Deploy both frontend and backend
2. Set environment variables
3. Done!

### DigitalOcean App Platform ($5/month)
1. Create app from GitHub
2. Configure both services
3. Deploy with automatic scaling

## Environment Variables Quick Reference

### Required for Backend:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
MISTRAL_API_KEY=your_mistral_api_key_here
NODE_ENV=production
PORT=3000
```

### Required for Frontend:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

## 🎉 That's It!

Your AutoDescribe app is now live and accessible worldwide for free!

**Total Time**: ~5 minutes  
**Total Cost**: $0/month  
**Scalability**: Handles thousands of users  

## 🔧 Post-Deployment

- **Custom Domain**: Add your own domain in Vercel/Netlify settings
- **Monitoring**: Set up uptime monitoring with UptimeRobot (free)
- **Analytics**: Add Google Analytics or Vercel Analytics
- **SSL**: Automatically provided by all platforms

## 🆘 Need Help?

- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Run `./deploy.sh` to test builds locally
- Join our Discord for support (link in README)

Happy deploying! 🚀