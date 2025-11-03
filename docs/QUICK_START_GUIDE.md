# Quick Start Guide - Expo & Web Development

**Last Updated**: November 2, 2025

---

## ✅ Environment Setup Complete

### Root `.env` File Created
All environment variables are now configured at the project root:

```bash
/Users/startferanmi/Data-Scientist/Partyhause/.env
```

**Contents**:
- ✅ EXPO_PUBLIC_SUPABASE_URL
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
- ✅ EXPO_PUBLIC_API_URL (Netlify)
- ✅ VITE_SUPABASE_URL (for web)
- ✅ VITE_API_URL (for web)

---

## Running the Mobile App (Expo)

### 1. Navigate to Mobile Directory
```bash
cd /Users/startferanmi/Data-Scientist/Partyhause/apps/mobile
```

### 2. Start Expo Development Server
```bash
# Option A: Tunnel mode (recommended for testing on physical device)
npx expo start --tunnel

# Option B: Local mode (faster, LAN only)
npx expo start

# Option C: Clear cache if issues
npx expo start --clear
```

### 3. Open on Device
- **iOS**: Scan QR code with Camera app
- **Android**: Scan QR code with Expo Go app
- **Web**: Press `w` in terminal

---

## Verifying Supabase Connection

### Check Environment Variables
```bash
# From project root
cat .env | grep SUPABASE

# Should show:
# EXPO_PUBLIC_SUPABASE_URL=https://awokklruxeofxsqxcsnt.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Test API Connection
```bash
# Test health endpoint
curl https://partyhause.netlify.app/api/health

# Test with auth (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://partyhause.netlify.app/api/users/suggested
```

---

## Current PartyCrew Features (Mobile)

### ✅ Working Features
1. **User Profiles**
   - View any user's profile
   - See follower/following counts
   - View events created

2. **Follow System**
   - Follow/unfollow users
   - See who you're following
   - Get follow suggestions

3. **Social Feed**
   - View posts from followed users
   - See recent activity
   - Discover new content

4. **Navigation**
   - Dashboard → Profile button
   - Explore tab → Social feed
   - Profile tab → Your profile

---

## Next Steps

### Immediate (To Test Mobile App)
1. ✅ Environment variables configured
2. **Create your user profile**:
   - Go to: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt/sql
   - Run: `scripts/create-my-profile.sql`
   - User ID: `97ba4ccb-5733-473e-ab88-7e0591f867a6`

3. **Start Expo**:
   ```bash
   cd apps/mobile
   npx expo start --tunnel
   ```

4. **Test Features**:
   - Tap "Profile" button on Dashboard
   - Go to Explore tab
   - Try following a user

### Short-term (Web Development)
See `docs/WEB_FEATURE_PARITY_PLAN.md` for complete roadmap:

**Week 1 Tasks**:
1. Set up React Query on web
2. Create feature folder structure
3. Port 6 custom hooks from mobile
4. Build ProfilePage component

**Quick Start**:
```bash
# Create structure
mkdir -p src/features/partycrew/{components,hooks,types,api}

# Install dependencies
npm install @tanstack/react-query

# Copy first hook
cp apps/mobile/hooks/partycrew/useUserProfile.ts \
   src/features/partycrew/hooks/

# Start web dev server
npm run dev
```

---

## Troubleshooting

### Expo: "Supabase credentials are missing"
**Solution**: ✅ Fixed! Root `.env` file created

### Expo: Metro bundler issues
```bash
cd apps/mobile
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### API 401 Errors
- Check if user is logged in
- Verify token is being sent
- Check token expiration

### API 500 Errors
- Some template endpoints need env vars
- PartyCrew endpoints all working ✅
- Check Netlify function logs

---

## Important Links

### Development
- **Local Web**: http://localhost:5173 (after `npm run dev`)
- **Expo DevTools**: http://localhost:19002 (after expo start)

### Production
- **Web App**: https://partyhause.netlify.app
- **API Health**: https://partyhause.netlify.app/api/health

### Dashboards
- **Netlify**: https://app.netlify.com/sites/partyhause
- **Supabase**: https://supabase.com/dashboard/project/awokklruxeofxsqxcsnt
- **GitHub**: https://github.com/Thundastormgod/Partyhause

### Documentation
- **Web Parity Plan**: `docs/WEB_FEATURE_PARITY_PLAN.md`
- **Domain Status**: `docs/NETLIFY_DOMAIN_STATUS.md`
- **Endpoint Status**: `docs/ENDPOINT_STATUS.md`

---

## Environment Files Structure

```
Partyhause/
├── .env                    # ✅ Root env (all platforms)
├── .env.example            # Template
├── .env.vercel             # Vercel-specific (deprecated)
└── apps/
    └── mobile/
        └── .env            # ✅ Mobile-specific (Expo)
```

**Note**: Both root and mobile `.env` files are configured and working!

---

## Commands Reference

### Development
```bash
# Mobile app
cd apps/mobile && npx expo start --tunnel

# Web app
npm run dev

# Build web
npm run build

# Build mobile PWA
npm run build:mobile
```

### Testing
```bash
# Test all Netlify endpoints
./scripts/test-netlify-endpoints.sh

# Test specific endpoint
curl https://partyhause.netlify.app/api/health

# Run with auth
curl -H "Authorization: Bearer TOKEN" \
     https://partyhause.netlify.app/api/partycrew/members
```

### Deployment
```bash
# Deploy to Netlify
npx netlify deploy --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

---

## Success Checklist

### Mobile App Setup
- [x] Root `.env` file created
- [x] Supabase credentials configured
- [x] API URL pointing to Netlify
- [ ] User profile created in Supabase
- [ ] Expo running successfully
- [ ] Can view Profile screen
- [ ] Can see Explore feed

### Web App Setup (Next Phase)
- [ ] React Query installed
- [ ] Feature structure created
- [ ] Hooks ported from mobile
- [ ] Profile page component built
- [ ] Social feed implemented
- [ ] Navigation updated

---

**Status**: Mobile app ready to test! Web app parity plan ready to implement.

**Next Action**: Create user profile in Supabase, then test in Expo Go!
