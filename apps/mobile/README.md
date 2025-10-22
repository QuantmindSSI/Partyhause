# PartyHause Mobile (Expo)

This workspace houses the new React Native / Expo client for PartyHause. The goal is to prioritize mobile-first collaboration flows while the existing Vite web app remains in maintenance mode.

## Get started

1. Install dependencies from the repository root (npm workspaces are enabled):

   ```bash
   npm install
   ```

2. Provide Supabase credentials so auth works in development. Copy `.env.example` to `.env` inside `apps/mobile` (or export the variables in your shell) and fill in your Supabase project values:

   ```bash
   cp .env.example .env
   ```

3. Start the Expo development server:

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

What's in place today:

- Shared logic (`@partyhause/core`) exposed via a new workspace under `packages/core`
- Supabase client bootstrapped with AsyncStorage persistence
- Query Client, Safe Area, and gesture providers applied globally
- Home screen stub that validates Supabase connectivity and session state
- **Email integration** for sending event invitations via MailerSend API
- **Guest management** with automatic email invitations when adding guests
- Production-ready email API deployed to Vercel (`https://www.partyhause.com/api/send-email`)

## Email Integration

The mobile app can send invitation emails to guests using the production email API:

### How it works:

1. **Add Guest Screen**: When adding a guest to an event, enable the "Send Email" toggle
2. **Automatic Email**: The app will:
   - Create a guest record in Supabase
   - Generate a unique invitation URL
   - Send a beautifully formatted HTML email via MailerSend
   - Log the email delivery in `email_logs` table
   - Update guest record with `email_sent_at` timestamp

### Configuration:

Email API endpoints are configured in `lib/email.ts`:

- **Development**: Points to localhost:3001 (local email server)
  - iOS Simulator: `http://192.168.56.1:3001/api/send-email`
  - Android Emulator: `http://10.0.2.2:3001/api/send-email`
- **Production**: Points to Vercel deployment
  - `https://www.partyhause.com/api/send-email`

### Testing Email:

Run the email test script from repository root:

```bash
node test-mobile-email-production.js
```

This simulates a mobile app email send to verify the production endpoint works.

Next steps follow the Wave 1 roadmap (PartyBoard, RSVP polls, itinerary, roles, attachments, activity feed).

## Get a fresh project

If you need to blow away the Expo starter scaffolding, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
