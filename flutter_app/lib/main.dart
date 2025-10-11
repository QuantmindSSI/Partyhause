import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/main_navigation.dart';
import 'screens/events/create_event_screen.dart';
import 'screens/events/event_details_screen.dart';
import 'controllers/auth_controller.dart';
import 'utils/app_theme.dart';
import 'constants/app_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );
  
  // Initialize GetX controllers
  Get.put(AuthController());
  
  runApp(const PartyHausApp());
}

class PartyHausApp extends StatelessWidget {
  const PartyHausApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'PartyHaus',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const SplashScreen(),
      getPages: [
        GetPage(name: '/splash', page: () => const SplashScreen()),
        GetPage(name: '/login', page: () => const LoginScreen()),
        GetPage(name: '/home', page: () => const MainNavigation()),
        GetPage(name: '/create-event', page: () => const CreateEventScreen()),
        GetPage(
          name: '/event-details', 
          page: () => EventDetailsScreen(event: Get.arguments),
        ),
      ],
      debugShowCheckedModeBanner: false,
    );
  }
}