import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/event_controller.dart';
import '../../controllers/navigation_controller.dart';
import '../../utils/app_theme.dart';
import 'dashboard_screen.dart';
import 'events_screen.dart';
import 'games_screen.dart';
import 'profile_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  late NavigationController navController;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const EventsScreen(),
    const GamesScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    
    // Initialize controllers if not already done
    navController = Get.put(NavigationController());
    Get.put(EventController());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: PageView(
        controller: navController.pageController,
        onPageChanged: navController.onPageChanged,
        children: _screens,
      ),
      bottomNavigationBar: _buildProfessionalBottomNav(),
    );
  }

  Widget _buildProfessionalBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(
            color: AppColors.border,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.gray900.withOpacity(0.05),
            blurRadius: 24,
            offset: const Offset(0, -8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: SafeArea(
        child: Container(
          height: 88, // Professional height with padding
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.grid_view_rounded,
                activeIcon: Icons.grid_view,
                label: 'Home',
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.calendar_today_rounded,
                activeIcon: Icons.calendar_today,
                label: 'Events',
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.sports_esports_rounded,
                activeIcon: Icons.sports_esports,
                label: 'Games',
              ),
              _buildNavItem(
                index: 3,
                icon: Icons.person_rounded,
                activeIcon: Icons.person,
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    return Obx(() {
      final isActive = navController.currentIndex.value == index;
      
      return GestureDetector(
        onTap: () => navController.changeTab(index),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon with smooth transition
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(AppSpacing.xs),
                decoration: BoxDecoration(
                  color: isActive 
                      ? AppColors.primary.withOpacity(0.1) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isActive ? activeIcon : icon,
                  size: 24,
                  color: isActive 
                      ? AppColors.primary 
                      : AppColors.textTertiary,
                ),
              ),
              
              const SizedBox(height: AppSpacing.xs),
              
              // Label with professional typography
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: Theme.of(context).textTheme.labelSmall!.copyWith(
                  color: isActive 
                      ? AppColors.primary 
                      : AppColors.textTertiary,
                  fontWeight: isActive 
                      ? FontWeight.w600 
                      : FontWeight.w500,
                  letterSpacing: 0.1,
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      );
    });
  }
}