# Testing PartyCrew in Expo Go - Quick Guide

## 🎯 What You Can Test Now

With the latest changes, you can test the PartyCrew features in Expo Go! Here's what's been integrated:

### ✅ **Profile Button** (Home Tab)
- Location: Dashboard header (top right)
- Icon: Person circle icon
- Action: Taps opens your profile screen
- Shows: PartyCrew count, Crewing count, Events hosted, Haus Score

### ✅ **PartyCrew Feed** (Explore Tab)
- Location: Explore tab (bottom navigation)
- Shows: Timeline of content from creators you're following
- Features:
  - Filter tabs (All / Events / Tips / Recaps)
  - Horizontal scroll of followed creators
  - Pull-to-refresh
  - Infinite scroll
  - Like/comment/share buttons

---

## 🚀 Steps to Test in Expo Go

### Step 1: Deploy Database (One-Time Setup)
**Time: 5 minutes**

1. Open your Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/editor
   ```

2. Go to **SQL Editor** (left sidebar)

3. Click **New Query**

4. Copy the entire contents of this file:
   ```
   /supabase/migrations/20251101_partycrew_social_network.sql
   ```

5. Paste into SQL Editor and click **RUN**

6. ✅ Verify success:
   - Should see: "Success. No rows returned"
   - Check Tables tab - should see 12 new tables:
     - user_profiles
     - connections
     - connection_requests
     - user_blocks
     - partycrew_posts
     - post_likes
     - post_comments
     - post_shares
     - poll_votes
     - notifications
     - feed_read_status
     - content_interactions

---

### Step 2: Create User Profile (Required)
**Time: 2 minutes**

Since you're an existing user, you need to create your user profile:

1. Go to Supabase Dashboard → **SQL Editor**

2. Run this query (replace with your user ID):
   ```sql
   -- Get your user ID first
   SELECT id, email FROM auth.users;
   
   -- Then create your profile (use your ID from above)
   INSERT INTO public.user_profiles (
     id, 
     username, 
     display_name,
     bio,
     account_type
   ) VALUES (
     'YOUR_USER_ID_HERE',
     'your_username',
     'Your Display Name',
     'Party enthusiast 🎉',
     'creator'
   );
   ```

3. ✅ Verify: Query should return "Success"

---

### Step 3: Open Expo Go
**Time: 1 minute**

1. Open Expo Go app on your phone

2. Scan the QR code from your terminal or connect via LAN

3. Wait for app to load and sign in

4. You should now see:
   - ✅ Profile icon in dashboard header (top right)
   - ✅ "PartyCrew" tab when you tap Explore

---

## 📱 What to Test

### Test 1: View Your Profile
```
1. Tap the profile icon (person circle) in dashboard header
2. You should see:
   ✓ Your display name and username
   ✓ Stats: 0 PartyCrew, 0 Crewing, X Events, 0 Haus Score
   ✓ "Edit Profile" button (since it's your profile)
   ✓ Bio text
```

### Test 2: PartyCrew Feed Empty State
```
1. Tap the "Explore" tab (bottom navigation)
2. You should see:
   ✓ "PartyCrew" header
   ✓ "Content from your crew" subtitle
   ✓ Empty state: "Welcome to PartyCrew!"
   ✓ "Explore Creators" button
```

### Test 3: Profile from Another User
Since you don't have other users yet, this won't work until you:
- Create a test user OR
- Have a friend sign up

---

## 🧪 Advanced Testing (Optional)

### Create Test Data

To see the feed in action, you need test posts. Run this in Supabase SQL Editor:

```sql
-- Create a test post (replace YOUR_USER_ID)
INSERT INTO public.partycrew_posts (
  creator_id,
  content_type,
  title,
  body,
  visibility
) VALUES (
  'YOUR_USER_ID',
  'tip',
  'Pro Party Tip 💡',
  'Always have a backup playlist ready in case the DJ doesn''t show up!',
  'public'
);

-- Create another post
INSERT INTO public.partycrew_posts (
  creator_id,
  content_type,
  title,
  body,
  visibility
) VALUES (
  'YOUR_USER_ID',
  'event_announcement',
  'Epic House Party This Weekend! 🎉',
  'Join us for the party of the year. Bring your friends!',
  'public'
);
```

Then pull-to-refresh the Explore tab to see your posts!

---

## 🐛 Troubleshooting

### "No profile data" or errors
**Solution**: Make sure you created your user profile (Step 2)

### Feed shows "Welcome to PartyCrew" forever
**Expected**: You don't have any connections yet. Create test posts (see above) or:
1. Create a second test user
2. Follow them (test JoinCrewButton)
3. Have them create posts

### Profile button does nothing
**Check**: 
- Make sure you ran the database migration
- Check console for errors (shake device → Debug → Remote JS Debugging)

### API errors (401, 403, 500)
**Check**:
- Your Supabase auth is working
- Bearer token is being sent (check Network tab)
- RLS policies are enabled

---

## 🎨 What You'll See

### Dashboard with Profile Button
```
┌────────────────────────────────────┐
│  Hey there! 👋         [👤] [📄] [Sign Out] │
│  your@email.com                     │
├────────────────────────────────────┤
│  Your Events                        │
│  [Event cards...]                   │
└────────────────────────────────────┘
```

### Profile Screen
```
┌────────────────────────────────────┐
│  [Cover Photo]                      │
│                                     │
│    [Avatar]                         │
│    Your Display Name                │
│    @your_username                   │
│                                     │
│    [Edit Profile Button]            │
│                                     │
│  Bio text goes here...              │
│                                     │
│  📍 Location  🔗 Website            │
│                                     │
├─────┬─────┬─────┬─────────────────┤
│  0  │  0  │  2  │       0          │
│ Crew│Crew │Event│  Haus Score     │
└─────┴─────┴─────┴─────────────────┘
```

### PartyCrew Feed (Explore Tab)
```
┌────────────────────────────────────┐
│  PartyCrew                          │
│  Content from your crew             │
├────────────────────────────────────┤
│  [Horizontal scroll: followed creators] │
├────────────────────────────────────┤
│  [All] [🎉 Events] [💡 Tips] [✨ Recaps] │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ [Avatar] Creator Name ✓      │  │
│  │ 💡 Party Tip • 2h ago        │  │
│  ├──────────────────────────────┤  │
│  │ Pro Party Tip                │  │
│  │ Always have a backup...      │  │
│  ├──────────────────────────────┤  │
│  │ 🤍 5  💬 2  ↗️ 1             │  │
│  └──────────────────────────────┘  │
│                                     │
│  [More posts...]                    │
└────────────────────────────────────┘
```

---

## ✅ Success Checklist

Before you consider testing complete:

- [ ] Database migration deployed successfully
- [ ] User profile created in database
- [ ] App loads without errors in Expo Go
- [ ] Profile button visible in dashboard header
- [ ] Profile screen opens when tapping button
- [ ] Profile shows your stats (0 PartyCrew, 0 Crewing, etc.)
- [ ] Explore tab shows "PartyCrew" header
- [ ] Feed shows empty state OR test posts
- [ ] Filter tabs are visible (All/Events/Tips/Recaps)
- [ ] Pull-to-refresh works (triggers loading spinner)
- [ ] No console errors

---

## 🚀 Next Steps After Testing

Once basic testing is complete:

1. **Test JoinCrew Button**
   - Create a second test user
   - Navigate to their profile
   - Tap "Join Crew"
   - Verify counts update

2. **Test Feed Algorithm**
   - Follow test users
   - Create various content types
   - Verify feed ranking

3. **Test Interactions**
   - Implement like endpoint
   - Test comment navigation
   - Test share functionality

4. **Deploy to Production**
   - Build standalone app
   - Test on TestFlight/Play Store beta
   - Gather user feedback

---

## 📞 Need Help?

If you encounter issues:

1. **Check Console Logs**
   - Shake device → Debug menu
   - Look for errors in red

2. **Check Network Requests**
   - Use Chrome DevTools
   - Check Network tab for API calls

3. **Verify Database**
   - Check Supabase Dashboard
   - Look at Table Editor
   - Verify RLS policies are enabled

4. **Test API Directly**
   - Use curl commands from docs
   - Test authentication flow
   - Verify endpoints respond

---

**Status**: Ready for Testing! 🎉  
**Time to Test**: 15-30 minutes  
**Prerequisites**: Database deployed, User profile created
