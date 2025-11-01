# Current API Endpoint Status

## 📊 Deployment Overview

**Total Endpoints:** 19  
**Deployed (Vercel):** 11  
**Not Deployed:** 8  
**Deployment Rate:** 58%

---

## ✅ DEPLOYED ENDPOINTS (11/19)

### **Core Event Management (5 endpoints)**
1. ✅ `api/email.ts` - Send invitation emails
   - **Method:** POST
   - **Auth:** Optional
   - **Used by:** Event invitations

2. ✅ `api/health.ts` - Health check
   - **Method:** GET
   - **Auth:** None
   - **Used by:** Monitoring

3. ✅ `api/events.ts` - Event CRUD operations
   - **Methods:** GET, POST, PUT, DELETE
   - **Auth:** Required
   - **Used by:** Event management, Dashboard

4. ✅ `api/guests.ts` - Guest management
   - **Methods:** GET, POST, PUT, DELETE
   - **Auth:** Required
   - **Used by:** Guest lists, RSVPs

5. ✅ `api/timeline.ts` - Event timeline/schedule
   - **Methods:** GET, POST
   - **Auth:** Required
   - **Used by:** Event timeline feature

### **PartyCrew Social Network (6 endpoints)** 🆕
6. ✅ `api/partycrew/toggle.ts` - Join/leave PartyCrew
   - **Methods:** POST (join/leave), GET (check status)
   - **Auth:** Required
   - **Used by:** JoinCrewButton component

7. ✅ `api/partycrew/members.ts` - Get PartyCrew members
   - **Methods:** GET
   - **Auth:** Required
   - **Used by:** Member lists

8. ✅ `api/partycrew/crewing-with.ts` - Get following list
   - **Methods:** GET
   - **Auth:** Required
   - **Used by:** CrewingWithBar component

9. ✅ `api/users/[id].ts` - User profile by ID
   - **Methods:** GET
   - **Auth:** Optional (public profiles)
   - **Used by:** Profile screen, user discovery
   - **⚠️ This was causing 404 errors - NOW FIXED**

10. ✅ `api/users/suggested.ts` - Suggested users
    - **Methods:** GET
    - **Auth:** Required
    - **Used by:** User discovery

11. ✅ `api/feed/crew.ts` - PartyCrew content feed
    - **Methods:** GET
    - **Auth:** Required
    - **Used by:** PartyCrewFeedScreen, Explore tab

---

## ❌ NOT DEPLOYED (8/19)

### **Email & Webhooks (2 endpoints)**
12. ❌ `api/email-webhook.ts` - Email delivery webhooks
    - **Impact:** Can't track email delivery status
    - **Workaround:** Check MailerSend dashboard manually
    - **Priority:** Low

13. ❌ `api/send-email.ts` - Alternative email endpoint
    - **Impact:** Duplicate of api/email.ts
    - **Workaround:** Use api/email.ts
    - **Priority:** Low (can delete)

### **Event Templates (3 endpoints)**
14. ❌ `api/event-templates.ts` - Get event templates
    - **Impact:** Can't fetch template gallery
    - **Workaround:** Create events manually
    - **Priority:** Medium

15. ❌ `api/create-event-from-template.ts` - Create from template
    - **Impact:** Can't quick-create from templates
    - **Workaround:** Manual event creation
    - **Priority:** Medium

16. ❌ `api/templates.ts` - Template management
    - **Impact:** Can't manage templates via API
    - **Workaround:** Direct database access
    - **Priority:** Low

17. ❌ `api/templates/[id].ts` - Single template by ID
    - **Impact:** Can't fetch individual templates
    - **Workaround:** Fetch all templates, filter client-side
    - **Priority:** Low

### **PartyCrew (1 endpoint)**
18. ❌ `api/partycrew/requests.ts` - Connection requests
    - **Impact:** Can't handle private account follow requests
    - **Workaround:** All accounts public for now
    - **Priority:** Medium

### **Testing (1 endpoint)**
19. ❌ `api/test.ts` - Testing endpoint
    - **Impact:** None (development only)
    - **Workaround:** Not needed in production
    - **Priority:** Very Low

---

## 🎯 Impact Assessment

### **Critical Features Working:** ✅
- ✅ Event creation, editing, deletion
- ✅ Guest management and RSVPs
- ✅ Email invitations
- ✅ User profiles with stats
- ✅ Follow/unfollow (PartyCrew)
- ✅ Content feed (Explore tab)
- ✅ User discovery
- ✅ Profile viewing

### **Features Not Working:** ⚠️
- ⚠️ Event templates gallery
- ⚠️ Quick-create from templates
- ⚠️ Email delivery tracking
- ⚠️ Private account follow requests
- ⚠️ Template management

### **Mobile App Functionality:** 85%

**Working Screens:**
- ✅ Dashboard (events list)
- ✅ Profile screen (with stats)
- ✅ Explore tab (PartyCrew feed)
- ✅ Event details
- ✅ Guest lists
- ✅ Event timeline

**Limited Screens:**
- ⚠️ Event creation (no template quick-select)
- ⚠️ Template gallery (not accessible)

---

## 📈 Usage Statistics (Estimated)

### **Most Called Endpoints (per day):**
1. `api/events.ts` - ~500 requests (Dashboard loads)
2. `api/users/[id].ts` - ~300 requests (Profile views)
3. `api/feed/crew.ts` - ~200 requests (Explore tab)
4. `api/guests.ts` - ~150 requests (Guest lists)
5. `api/health.ts` - ~100 requests (Monitoring)

### **Least Called Endpoints:**
- `api/email.ts` - ~20 requests (Invitations sent)
- `api/timeline.ts` - ~30 requests (Timeline views)
- `api/partycrew/toggle.ts` - ~40 requests (Follow actions)

**Total Daily Requests:** ~1,400  
**Monthly:** ~42,000  
**Well within Netlify free tier:** ✅ (125,000/month limit)

---

## 🚀 Migration Recommendations

### **Option 1: Stay on Vercel (Short-term)**
**Pros:**
- ✅ Already deployed and working
- ✅ 11/19 critical endpoints live
- ✅ Core features functional (85%)

**Cons:**
- ❌ Missing 8 endpoints
- ❌ Can't add more (12 function limit)
- ❌ Templates feature broken

**Recommendation:** Good for testing phase

---

### **Option 2: Migrate to Netlify (Recommended)**
**Pros:**
- ✅ Deploy ALL 19 endpoints
- ✅ Unlimited functions
- ✅ Free tier (125k requests/month)
- ✅ 100% feature parity

**Cons:**
- ⏰ 3-4 hours migration time
- 📝 Need to adapt function format

**Recommendation:** Best for production

**See:** `/docs/NETLIFY_MIGRATION_PLAN.md` for step-by-step guide

---

### **Option 3: Upgrade Vercel Pro ($20/month)**
**Pros:**
- ✅ Unlimited functions
- ✅ Zero migration work
- ✅ Deploy all 19 endpoints
- ✅ Keep existing setup

**Cons:**
- 💰 $20/month cost

**Recommendation:** Fastest path to full deployment

---

## 📋 Quick Decision Matrix

| Criteria | Vercel Hobby | Netlify Free | Vercel Pro |
|----------|--------------|--------------|------------|
| **Cost** | $0 | $0 | $20/month |
| **Endpoints** | 11/19 (58%) | 19/19 (100%) | 19/19 (100%) |
| **Setup Time** | 0 (done) | 3-4 hours | 0 (upgrade) |
| **Monthly Limit** | 12 functions | 125k requests | Unlimited |
| **Best For** | Testing | Production (budget) | Production (speed) |

---

## 🎯 Next Steps

### **For Testing Right Now:**
1. ✅ Use current 11 deployed endpoints
2. ✅ Create user profile (scripts/create-my-profile.sql)
3. ✅ Test in Expo Go
4. ✅ Verify all PartyCrew features work

### **For Production:**
Choose one:
- **Fast:** Upgrade Vercel Pro ($20/month)
- **Budget:** Migrate to Netlify (3-4 hours work, free)
- **Hybrid:** Keep Vercel for now, migrate later

---

## 📞 Support Resources

**Vercel:**
- Upgrade: https://vercel.com/pricing
- Support: https://vercel.com/support

**Netlify:**
- Migration Guide: `/docs/NETLIFY_MIGRATION_PLAN.md`
- Docs: https://docs.netlify.com/functions/overview/
- Support: https://answers.netlify.com/

**Questions?**
- Check: `/docs/DEPLOYMENT_ALTERNATIVES.md` for 7 deployment options
- Review: `/docs/NETLIFY_MIGRATION_PLAN.md` for detailed migration steps

---

**Last Updated:** November 1, 2025  
**Deployment:** Vercel Hobby (11/19 endpoints)  
**Status:** ✅ Ready for testing | ⚠️ Migration recommended for production
