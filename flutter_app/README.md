# PartyHaus Flutter Mobile App

A Flutter mobile application for PartyHaus event management platform.

## 🚀 Quick Start

### Prerequisites
- Flutter SDK (>=3.10.0)
- Dart SDK (>=3.0.0)
- Android Studio / VS Code with Flutter extensions
- Android device/emulator or iOS device/simulator

### Installation

1. **Navigate to the Flutter app directory:**
   ```bash
   cd flutter_app
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Run the app:**
   ```bash
   flutter run
   ```

## 🧪 Testing Authentication Flow

### Test Account Setup
The app connects to the existing PartyHaus Supabase backend. You can test with:

1. **Create a new account** using the Sign Up tab
2. **Sign in** with existing credentials from the web app
3. **Test password reset** functionality

### Authentication Features to Test

✅ **Sign Up Flow:**
- Navigate to Sign Up tab
- Enter name, email, and password
- Verify form validation works
- Check if account is created successfully
- Verify email confirmation (if enabled)

✅ **Sign In Flow:**
- Enter existing email and password
- Test form validation
- Verify successful login redirects to Dashboard
- Check if user data loads correctly

✅ **Navigation:**
- Test bottom navigation between tabs
- Verify Dashboard shows welcome message
- Check Events tab loads (empty state initially)
- Verify Profile tab shows user information

✅ **Sign Out:**
- Go to Profile tab
- Tap Sign Out button
- Confirm sign out dialog
- Verify redirect to login screen

### Expected Behavior

1. **Splash Screen (2 seconds)**
   - Shows PartyHaus logo and loading animation
   - Checks authentication state
   - Routes to Login or Dashboard

2. **Login Screen**
   - Toggle between Sign In and Sign Up
   - Form validation with real-time feedback
   - Loading states during authentication
   - Success/error messages via snackbars

3. **Dashboard Screen**
   - Personalized welcome message
   - Quick action cards
   - Upcoming events section (empty initially)
   - Floating action button for creating events

4. **Profile Screen**
   - User avatar with initials
   - Edit profile functionality
   - Menu items for settings
   - Sign out with confirmation

## 🔧 Development Configuration

### Debug Mode
The app runs in debug mode by default with:
- Hot reload enabled
- Debug console logging
- Development environment variables

### Database Connection
- Uses the same Supabase backend as the web app
- Connects to: `https://awokklruxeofxsqxcsnt.supabase.co`
- Shares user accounts and data with web application

### State Management
- Uses GetX for reactive state management
- Controllers handle authentication and business logic
- Automatic state persistence and restoration

## 📱 Supported Platforms

- **Android:** API level 21+ (Android 5.0+)
- **iOS:** iOS 12.0+
- **Web:** Chrome, Firefox, Safari (via Flutter Web)

## 🛠 Troubleshooting

### Common Issues

1. **Dependencies not found:**
   ```bash
   flutter clean
   flutter pub get
   ```

2. **Build errors:**
   ```bash
   flutter doctor
   flutter upgrade
   ```

3. **Network connection issues:**
   - Check internet connection
   - Verify Supabase URL in `lib/constants/app_config.dart`

4. **Authentication failures:**
   - Verify Supabase credentials
   - Check email format and password requirements
   - Enable email confirmation in Supabase dashboard if needed

### Debug Logs
Check the Flutter console for detailed error messages and authentication flow logs.

## 📋 Testing Checklist

- [ ] App launches without errors
- [ ] Splash screen appears and transitions correctly
- [ ] Login screen loads with proper styling
- [ ] Sign up creates new account
- [ ] Sign in works with valid credentials
- [ ] Form validation shows appropriate errors
- [ ] Loading states display during auth operations
- [ ] Dashboard loads after successful login
- [ ] Bottom navigation works correctly
- [ ] Profile shows user information
- [ ] Sign out returns to login screen
- [ ] App state persists across restarts

## 🔄 Next Steps

After testing authentication:
1. Implement event creation screens
2. Add event management features
3. Build games integration
4. Add push notifications
5. Implement offline support

## 📞 Support

If you encounter issues during testing:
1. Check the troubleshooting section above
2. Review Flutter console logs
3. Verify Supabase backend connectivity
4. Ensure all dependencies are properly installed