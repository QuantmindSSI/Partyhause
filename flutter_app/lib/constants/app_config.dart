class AppConfig {
  // Supabase Configuration - Use the same backend as web app
  static const String supabaseUrl = 'https://awokklruxeofxsqxcsnt.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b2trbHJ1eGVvZnhzcXhjc250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTgyNTQsImV4cCI6MjA3Mjk3NDI1NH0.h4fqb_G2ssrqHjVSUTHMHVe4f009Nu706j57lK1NaS0';
  
  // App Information
  static const String appName = 'PartyHaus';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String userKey = 'party_user';
  static const String themeKey = 'theme_mode';
  static const String firstLaunchKey = 'first_launch';
  
  // Navigation Keys
  static const String homeRoute = '/home';
  static const String loginRoute = '/login';
  static const String splashRoute = '/splash';
  
  // Validation
  static const int minPasswordLength = 6;
  static const int maxEventNameLength = 100;
  static const int maxEventDescriptionLength = 500;
  
  // UI Constants
  static const double borderRadius = 12.0;
  static const double buttonHeight = 48.0;
  static const double defaultPadding = 16.0;
  static const double largeSpacing = 24.0;
  static const double smallSpacing = 8.0;
}