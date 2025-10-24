# 📦 PartyHause - Package Versions Reference

**Last Updated:** October 21, 2025  
**Project:** PartyHause Event Management Platform

---

## 🎯 System Requirements

### Node.js & Package Managers
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
}
```

**Recommended Versions:**
- **Node.js:** v18.x or v20.x (LTS)
- **npm:** v8.x or v9.x
- **Current in project:** Node v24.5.0 (latest)

---

## 📱 Root Project Dependencies

### UI Components (Radix UI)
```json
{
  "@radix-ui/react-alert-dialog": "^1.0.5",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-hover-card": "^1.0.7",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-navigation-menu": "^1.1.4",
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-radio-group": "^1.1.3",
  "@radix-ui/react-scroll-area": "^1.2.10",
  "@radix-ui/react-select": "^1.2.2",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.5",
  "@radix-ui/react-tooltip": "^1.0.7"
}
```

### Core Framework
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.8.2",
  "vite": "7.1.9",
  "@vitejs/plugin-react-swc": "^3.3.2"
}
```

### State Management & Data Fetching
```json
{
  "zustand": "^4.4.1",
  "@tanstack/react-query": "^4.35.3"
}
```

### Backend & Database
```json
{
  "@supabase/supabase-js": "^2.36.0",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

### Email Services
```json
{
  "mailersend": "^2.6.0",
  "resend": "^6.0.3"
}
```
**Note:** Currently using **MailerSend** for production

### Utilities
```json
{
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^1.14.0",
  "date-fns": "^2.30.0",
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.279.0",
  "qrcode.react": "^3.1.0",
  "react-day-picker": "^8.8.2",
  "react-hook-form": "^7.46.2",
  "sanitize-html": "^2.9.0",
  "sonner": "^1.0.3",
  "zod": "^3.22.2"
}
```

### Deployment
```json
{
  "@vercel/node": "2.15.10",
  "next-themes": "^0.4.6"
}
```

---

## 📱 Mobile App Dependencies (apps/mobile)

### Expo Framework
```json
{
  "expo": "~54.0.13",
  "expo-router": "~6.0.11",
  "expo-constants": "~18.0.9",
  "expo-font": "~14.0.9",
  "expo-haptics": "~15.0.7",
  "expo-image": "~3.0.9",
  "expo-linking": "~8.0.8",
  "expo-splash-screen": "~31.0.10",
  "expo-status-bar": "~3.0.8",
  "expo-symbols": "~1.0.7",
  "expo-system-ui": "~6.0.7",
  "expo-web-browser": "~15.0.8"
}
```

### React Native
```json
{
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.4",
  "react-native-web": "~0.21.0"
}
```

### Navigation
```json
{
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/bottom-tabs": "^7.4.0",
  "@react-navigation/elements": "^2.6.3",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

### UI & Animations
```json
{
  "@expo/vector-icons": "^15.0.2",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-worklets": "0.5.1"
}
```

### Data & Storage
```json
{
  "@supabase/supabase-js": "^2.36.0",
  "@tanstack/react-query": "^5.66.0",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "zustand": "^4.4.1"
}
```

### Virtualization
```json
{
  "@react-native/virtualized-lists": "^0.81.1"
}
```

---

## 🛠️ Development Dependencies

### TypeScript
```json
{
  "typescript": "^5.2.2",
  "@types/node": "^20.6.3",
  "@types/react": "^18.2.22",
  "@types/react-dom": "^18.2.7"
}
```

### Testing
```json
{
  "vitest": "^3.2.4",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.8.0",
  "@testing-library/user-event": "^14.6.1",
  "@types/testing-library__jest-dom": "^5.14.9",
  "jsdom": "^26.1.0"
}
```

### Linting & Code Quality
```json
{
  "eslint": "^8.57.1",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.3",
  "@typescript-eslint/eslint-plugin": "^6.7.2",
  "@typescript-eslint/parser": "^6.7.2"
}
```

### CSS & Styling
```json
{
  "tailwindcss": "^3.3.3",
  "tailwindcss-animate": "^1.0.7",
  "autoprefixer": "^10.4.15",
  "postcss": "^8.4.30"
}
```

### Supabase CLI
```json
{
  "supabase": "^2.40.7"
}
```

---

## 📋 Installation Commands

### Full Install (Recommended)
```bash
# Clean install from root
npm ci

# Or fresh install
npm install
```

### Install Web Dependencies Only
```bash
npm install --workspace=root
```

### Install Mobile Dependencies
```bash
cd apps/mobile
npm install
```

---

## 🔄 Version Update Strategy

### Update All Packages to Latest Compatible
```bash
# Check outdated packages
npm outdated

# Update all non-breaking (patch & minor)
npm update

# Update specific package
npm install package-name@latest
```

### Update Mobile App
```bash
cd apps/mobile

# Update Expo SDK
npx expo install --fix

# Check compatibility
npx expo-doctor
```

---

## ⚠️ Critical Version Notes

### Known Issues & Compatibility

1. **React Version Mismatch**
   - Web: React 18.2.0
   - Mobile: React 19.1.0
   - **Note:** Different React versions for web vs mobile is expected with Expo SDK 54

2. **Vite Version**
   - Current: 7.1.9
   - **Note:** Latest major version, ensure compatibility with plugins

3. **Expo SDK**
   - Current: ~54.0.13
   - **Note:** Use `~` (tilde) to allow patch updates only
   - All expo-* packages must match SDK version

4. **React Query**
   - Web: v4.35.3
   - Mobile: v5.66.0
   - **Note:** Different major versions - API differences exist

5. **TypeScript**
   - Web: ^5.2.2
   - Mobile: ~5.9.2
   - **Note:** Both compatible with each other

---

## 🔍 Version Checking Commands

### Check Installed Versions
```bash
# All packages
npm list

# Specific package
npm list mailersend

# Node version
node --version

# npm version
npm --version

# Check mobile deps
cd apps/mobile && npm list
```

### Check for Security Vulnerabilities
```bash
npm audit

# Fix automatically
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force
```

---

## 📦 Package Lock Files

The project uses:
- **npm:** `package-lock.json` (root)
- **Bun:** `bun.lockb` (alternative package manager)

**Best Practice:**
- Commit lock files to version control
- Use `npm ci` in CI/CD pipelines
- Use `npm install` for local development

---

## 🚀 Production Build Versions

### Vercel Deployment
```json
{
  "node": "18.x",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Mobile App Build (EAS)
```json
{
  "expo": "~54.0.13",
  "runtimeVersion": "1.0.0",
  "ios": {
    "deploymentTarget": "13.4"
  },
  "android": {
    "compileSdkVersion": 34,
    "targetSdkVersion": 34,
    "minSdkVersion": 21
  }
}
```

---

## 📚 Documentation Links

### Official Docs
- [Expo SDK 54](https://docs.expo.dev/)
- [React 18](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [Supabase JS](https://supabase.com/docs/reference/javascript)
- [MailerSend SDK](https://developers.mailersend.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

## ✅ Verification Checklist

After installing packages, verify:

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts web app successfully
- [ ] `cd apps/mobile && npx expo start` launches mobile app
- [ ] `npm run lint` passes
- [ ] `npm run build:check` succeeds
- [ ] `npm run test:run` passes
- [ ] No peer dependency warnings
- [ ] No security vulnerabilities (run `npm audit`)

---

## 🔧 Troubleshooting

### Common Issues

**"Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"Peer dependency conflict"**
```bash
npm install --legacy-peer-deps
```

**"Expo version mismatch"**
```bash
cd apps/mobile
npx expo install --fix
```

**"Type errors after update"**
```bash
npm install --save-dev @types/package-name
```

---

**Last Package Audit:** October 21, 2025  
**Status:** ✅ All packages up to date and secure  
**Next Review:** Monthly or when security alert received
