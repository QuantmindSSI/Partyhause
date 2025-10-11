import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final authController = Get.find<AuthController>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Professional Profile Header
              _buildProfessionalHeader(),
              
              const SizedBox(height: AppSpacing.xl),
              
              // Quick Stats
              _buildQuickStats(),
              
              const SizedBox(height: AppSpacing.xl),
              
              // Settings Sections
              _buildSettingsSection(),
              
              const SizedBox(height: AppSpacing.xl),
              
              // Danger Zone
              _buildDangerZone(),
              
              const SizedBox(height: AppSpacing.xl),
              
              // App Info
              _buildAppInfo(),
              
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfessionalHeader() {
    return Obx(() {
      final user = authController.user;
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary,
              AppColors.primaryDark,
            ],
          ),
        ),
        child: Column(
          children: [
            // Top Bar
            Row(
              children: [
                Text(
                  'Profile',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppColors.textOnPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    onPressed: _showSettingsSheet,
                    icon: const Icon(
                      Icons.settings_rounded,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // Profile Avatar
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  (user?.name ?? user?.email ?? 'U').substring(0, 1).toUpperCase(),
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // User Info
            Text(
              user?.name ?? 'User Name',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textOnPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            
            const SizedBox(height: AppSpacing.xs),
            
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xs,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                user?.email ?? 'user@example.com',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textOnPrimary,
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // Edit Profile Button
            Container(
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [AppShadows.subtle],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _showEditProfileSheet(user),
                  borderRadius: BorderRadius.circular(16),
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.edit_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Text(
                          'Edit Profile',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildQuickStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Events Created',
              '5',
              Icons.event_rounded,
              AppColors.success,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: _buildStatCard(
              'Events Attended',
              '12',
              Icons.people_rounded,
              AppColors.warning,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: _buildStatCard(
              'Games Played',
              '28',
              Icons.casino_rounded,
              AppColors.info,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [AppShadows.subtle],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Settings',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [AppShadows.subtle],
            ),
            child: Column(
              children: [
                _buildProfessionalMenuItem(
                  icon: Icons.event_rounded,
                  title: 'My Events',
                  subtitle: 'View and manage your events',
                  onTap: () {
                    Get.snackbar(
                      'Coming Soon',
                      'Event management will be available soon',
                      snackPosition: SnackPosition.BOTTOM,
                    );
                  },
                  isFirst: true,
                ),
                _buildMenuDivider(),
                _buildProfessionalMenuItem(
                  icon: Icons.history_rounded,
                  title: 'Event History',
                  subtitle: 'Past events and activities',
                  onTap: () {
                    Get.snackbar(
                      'Coming Soon',
                      'Event history will be available soon',
                      snackPosition: SnackPosition.BOTTOM,
                    );
                  },
                ),
                _buildMenuDivider(),
                _buildProfessionalMenuItem(
                  icon: Icons.notifications_rounded,
                  title: 'Notifications',
                  subtitle: 'Manage notification preferences',
                  onTap: _showNotificationSettings,
                ),
                _buildMenuDivider(),
                _buildProfessionalMenuItem(
                  icon: Icons.privacy_tip_rounded,
                  title: 'Privacy & Security',
                  subtitle: 'Manage your privacy settings',
                  onTap: _showPrivacySettings,
                ),
                _buildMenuDivider(),
                _buildProfessionalMenuItem(
                  icon: Icons.help_rounded,
                  title: 'Help & Support',
                  subtitle: 'Get help and contact support',
                  onTap: _showHelpSupport,
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDangerZone() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Account',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [AppShadows.subtle],
            ),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.error.withOpacity(0.3)),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _showSignOutDialog(),
                      borderRadius: BorderRadius.circular(12),
                      child: Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.logout_rounded,
                              color: AppColors.error,
                              size: 20,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Text(
                              'Sign Out',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.error,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryDark],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.celebration_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PartyHaus',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Version 1.0.0',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => _showAboutDialog(),
                  child: Text(
                    'About',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfessionalMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isFirst = false,
    bool isLast = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.vertical(
          top: isFirst ? const Radius.circular(16) : Radius.zero,
          bottom: isLast ? const Radius.circular(16) : Radius.zero,
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuDivider() {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      color: AppColors.border,
    );
  }

  void _showSettingsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Text(
                    'App Settings',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            
            // Settings List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                children: [
                  _buildSettingsTile(
                    'Theme',
                    'Light mode',
                    Icons.brightness_6_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Theme settings will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                  _buildSettingsTile(
                    'Language',
                    'English',
                    Icons.language_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Language settings will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                  _buildSettingsTile(
                    'Data & Storage',
                    'Manage app data',
                    Icons.storage_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Storage settings will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditProfileSheet(dynamic user) {
    final nameController = TextEditingController(text: user?.name ?? '');
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Text(
                    'Edit Profile',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(
                      'Cancel',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
            
            // Form
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Column(
                  children: [
                    // Profile Photo Section
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Text(
                              (user?.name ?? user?.email ?? 'U').substring(0, 1).toUpperCase(),
                              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: IconButton(
                                onPressed: () {
                                  Get.snackbar(
                                    'Coming Soon',
                                    'Photo upload will be available soon',
                                    snackPosition: SnackPosition.BOTTOM,
                                  );
                                },
                                icon: const Icon(
                                  Icons.camera_alt_rounded,
                                  color: Colors.white,
                                  size: 16,
                                ),
                                iconSize: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.xl),
                    
                    // Name Field
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.backgroundSecondary,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: TextField(
                        controller: nameController,
                        decoration: InputDecoration(
                          labelText: 'Full Name',
                          labelStyle: TextStyle(color: AppColors.textTertiary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(AppSpacing.lg),
                        ),
                        style: TextStyle(color: AppColors.textPrimary),
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Email Field (Read-only)
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.backgroundSecondary.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: TextField(
                        controller: TextEditingController(text: user?.email ?? ''),
                        enabled: false,
                        decoration: InputDecoration(
                          labelText: 'Email',
                          labelStyle: TextStyle(color: AppColors.textTertiary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(AppSpacing.lg),
                        ),
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                    
                    const Spacer(),
                    
                    // Save Button
                    Container(
                      width: double.infinity,
                      height: 52,
                      margin: const EdgeInsets.only(bottom: AppSpacing.xl),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryDark],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [AppShadows.subtle],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () async {
                            if (nameController.text.trim().isNotEmpty && user != null) {
                              final updatedUser = user.copyWith(
                                name: nameController.text.trim(),
                                updatedAt: DateTime.now(),
                              );
                              await authController.updateUserProfile(updatedUser);
                              Navigator.pop(context);
                              Get.snackbar(
                                'Success',
                                'Profile updated successfully',
                                snackPosition: SnackPosition.BOTTOM,
                              );
                            }
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Center(
                            child: Text(
                              'Save Changes',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showNotificationSettings() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Text(
                    'Notifications',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            
            // Notification Settings
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                children: [
                  _buildToggleTile(
                    'Event Reminders',
                    'Get notified about upcoming events',
                    Icons.event_rounded,
                    true,
                  ),
                  _buildToggleTile(
                    'Game Invitations',
                    'Notifications for game invites',
                    Icons.casino_rounded,
                    true,
                  ),
                  _buildToggleTile(
                    'Guest Updates',
                    'When guests join or leave events',
                    Icons.people_rounded,
                    false,
                  ),
                  _buildToggleTile(
                    'App Updates',
                    'New features and announcements',
                    Icons.system_update_rounded,
                    true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPrivacySettings() {
    Get.snackbar(
      'Coming Soon',
      'Privacy settings will be available soon',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void _showHelpSupport() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Text(
                    'Help & Support',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            
            // Help Options
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                children: [
                  _buildHelpTile(
                    'FAQ',
                    'Frequently asked questions',
                    Icons.quiz_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'FAQ section will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                  _buildHelpTile(
                    'Contact Support',
                    'Get help from our team',
                    Icons.support_agent_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Support chat will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                  _buildHelpTile(
                    'Report a Bug',
                    'Let us know about issues',
                    Icons.bug_report_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Bug reporting will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                  _buildHelpTile(
                    'Feature Request',
                    'Suggest new features',
                    Icons.lightbulb_rounded,
                    () {
                      Get.snackbar(
                        'Coming Soon',
                        'Feature requests will be available soon',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSignOutDialog() {
    Get.dialog(
      AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Sign Out',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: Text(
          'Are you sure you want to sign out of your account?',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back();
              authController.signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Sign Out',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: 'PartyHaus',
      applicationVersion: '1.0.0',
      applicationLegalese: '© 2025 PartyHaus. All rights reserved.',
      children: [
        const SizedBox(height: 16),
        const Text(
          'PartyHaus is your ultimate event management companion. Create, manage, and enjoy unforgettable events with friends and family.',
        ),
      ],
    );
  }

  Widget _buildSettingsTile(String title, String value, IconData icon, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        value,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppColors.textTertiary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildToggleTile(String title, String subtitle, IconData icon, bool value) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: (newValue) {
              Get.snackbar(
                'Coming Soon',
                'Notification settings will be available soon',
                snackPosition: SnackPosition.BOTTOM,
              );
            },
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildHelpTile(String title, String subtitle, IconData icon, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppColors.textTertiary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}