import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/event_controller.dart';
import '../../controllers/navigation_controller.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authController = Get.find<AuthController>();
    final eventController = Get.find<EventController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildProfessionalAppBar(context),
      body: RefreshIndicator(
        onRefresh: () async {
          await eventController.refreshEvents();
        },
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              _buildWelcomeSection(context, authController),
              const SizedBox(height: AppSpacing.xxl),
              
              // Quick Stats Cards
              _buildQuickStats(context, eventController),
              const SizedBox(height: AppSpacing.xxl),
              
              // Quick Actions
              _buildQuickActions(context),
              const SizedBox(height: AppSpacing.xxl),
              
              // Upcoming Events
              _buildUpcomingEvents(context, eventController),
              const SizedBox(height: AppSpacing.xxl),
              
              // Recent Activity
              _buildRecentActivity(context),
              
              // Bottom padding for FAB
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
      floatingActionButton: _buildProfessionalFAB(),
    );
  }

  PreferredSizeWidget _buildProfessionalAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.surface,
      elevation: 0,
      scrolledUnderElevation: 1,
      shadowColor: AppColors.gray200,
      surfaceTintColor: Colors.transparent,
      toolbarHeight: 72,
      title: Padding(
        padding: const EdgeInsets.only(left: AppSpacing.xs),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.02,
              ),
            ),
            Text(
              'Manage your events',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: AppSpacing.sm),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                color: AppColors.textSecondary,
                size: 20,
              ),
            ),
            onPressed: () {
              // TODO: Implement notifications
            },
            splashRadius: 24,
          ),
        ),
      ],
    );
  }

  Widget _buildWelcomeSection(BuildContext context, AuthController authController) {
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
          borderRadius: BorderRadius.circular(20),
          boxShadow: [AppShadows.soft],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Good ${_getGreeting()},',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textOnPrimary.withOpacity(0.8),
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        user?.name ?? 'Party Host',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.textOnPrimary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.02,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.textOnPrimary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.person_rounded,
                    color: AppColors.textOnPrimary,
                    size: 28,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Ready to create amazing events and unforgettable memories?',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textOnPrimary.withOpacity(0.9),
                fontWeight: FontWeight.w400,
                height: 1.5,
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildQuickStats(BuildContext context, EventController eventController) {
    return Obx(() {
      return Row(
        children: [
          Expanded(
            child: _buildStatCard(
              context: context,
              title: 'Total Events',
              value: '${eventController.events.length}',
              icon: Icons.event_rounded,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: _buildStatCard(
              context: context,
              title: 'Upcoming',
              value: '${eventController.upcomingEvents.length}',
              icon: Icons.schedule_rounded,
              color: AppColors.secondary,
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: _buildStatCard(
              context: context,
              title: 'This Month',
              value: '${_getThisMonthEvents(eventController)}',
              icon: Icons.calendar_month_rounded,
              color: AppColors.success,
            ),
          ),
        ],
      );
    });
  }

  Widget _buildStatCard({
    required BuildContext context,
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [AppShadows.subtle],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.02,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            title,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.01,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.lg,
          crossAxisSpacing: AppSpacing.lg,
          childAspectRatio: 1.1,
          children: [
            _buildActionCard(
              context: context,
              icon: Icons.add_rounded,
              title: 'Create Event',
              subtitle: 'Start planning your next event',
              color: AppColors.primary,
              onTap: () {
                Get.toNamed('/create-event');
              },
            ),
            _buildActionCard(
              context: context,
              icon: Icons.qr_code_scanner_rounded,
              title: 'Scan QR Code',
              subtitle: 'Join an existing event',
              color: AppColors.secondary,
              onTap: () {
                _showQRScanner(context);
              },
            ),
            _buildActionCard(
              context: context,
              icon: Icons.group_add_rounded,
              title: 'Invite Friends',
              subtitle: 'Share the fun with others',
              color: AppColors.success,
              onTap: () {
                _showInviteFriends(context);
              },
            ),
            _buildActionCard(
              context: context,
              icon: Icons.analytics_rounded,
              title: 'View Analytics',
              subtitle: 'Check your event insights',
              color: AppColors.warning,
              onTap: () {
                _showAnalytics(context);
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [AppShadows.subtle],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
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
            const SizedBox(height: AppSpacing.md),
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
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingEvents(BuildContext context, EventController eventController) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Events',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.01,
              ),
            ),
            TextButton.icon(
              onPressed: () {
                // Navigate to events tab
                Get.find<NavigationController>().changeTab(1);
              },
              icon: Icon(
                Icons.arrow_forward_rounded,
                size: 16,
                color: AppColors.primary,
              ),
              label: Text(
                'See All',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        Obx(() {
          if (eventController.isLoading) {
            return Container(
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            );
          }

          final upcomingEvents = eventController.upcomingEvents;
          
          if (upcomingEvents.isEmpty) {
            return Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.xxxl),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.event_busy_rounded,
                      size: 32,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'No upcoming events',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Create your first event to get started',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textTertiary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  SizedBox(
                    width: 140,
                    height: 40,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Get.toNamed('/create-event');
                      },
                      icon: const Icon(Icons.add_rounded, size: 16),
                      label: const Text('Create Event'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: upcomingEvents.length.clamp(0, 3), // Show max 3 events
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final event = upcomingEvents[index];
              return Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [AppShadows.subtle],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.primary,
                            AppColors.primaryDark,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          event.name.substring(0, 1).toUpperCase(),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.textOnPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            event.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Row(
                            children: [
                              Icon(
                                Icons.location_on_rounded,
                                size: 14,
                                color: AppColors.textTertiary,
                              ),
                              const SizedBox(width: AppSpacing.xs),
                              Expanded(
                                child: Text(
                                  event.location,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Row(
                            children: [
                              Icon(
                                Icons.schedule_rounded,
                                size: 14,
                                color: AppColors.textTertiary,
                              ),
                              const SizedBox(width: AppSpacing.xs),
                              Text(
                                _formatDate(event.eventDate),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
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
              );
            },
          );
        }),
      ],
    );
  }

  Widget _buildRecentActivity(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.01,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.xxxl),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.history_rounded,
                  size: 32,
                  color: AppColors.textTertiary,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'No recent activity',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Activity will appear here once you start creating and managing events',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textTertiary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;
    
    if (difference == 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Tomorrow';
    } else if (difference < 7) {
      return '${difference} days';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'morning';
    } else if (hour < 17) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }

  int _getThisMonthEvents(EventController eventController) {
    final now = DateTime.now();
    return eventController.events.where((event) {
      return event.eventDate.year == now.year && 
             event.eventDate.month == now.month;
    }).length;
  }

  Widget _buildProfessionalFAB() {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primaryDark,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Get.toNamed('/create-event');
          },
          borderRadius: BorderRadius.circular(20),
          child: const Icon(
            Icons.add_rounded,
            color: Colors.white,
            size: 28,
          ),
        ),
      ),
    );
  }

  void _showQRScanner(BuildContext context) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Icon(
              Icons.qr_code_scanner_rounded,
              size: 64,
              color: AppColors.primary,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'QR Code Scanner',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Scan QR codes to quickly join events or access special features.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Get.back();
                  Get.snackbar(
                    'QR Scanner',
                    'QR scanner will be implemented in the next update',
                    snackPosition: SnackPosition.BOTTOM,
                  );
                },
                icon: const Icon(Icons.camera_alt_rounded),
                label: const Text('Open Camera'),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextButton(
              onPressed: () => Get.back(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }

  void _showInviteFriends(BuildContext context) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Icon(
              Icons.group_add_rounded,
              size: 64,
              color: AppColors.success,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Invite Friends',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Share the PartyHaus experience with your friends and make your events even more memorable.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Get.back();
                  Get.snackbar(
                    'Invite Friends',
                    'Friend invitation feature will be available soon',
                    snackPosition: SnackPosition.BOTTOM,
                  );
                },
                icon: const Icon(Icons.share_rounded),
                label: const Text('Share App'),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextButton(
              onPressed: () => Get.back(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }

  void _showAnalytics(BuildContext context) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Icon(
              Icons.analytics_rounded,
              size: 64,
              color: AppColors.warning,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Analytics Dashboard',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Get detailed insights about your events, guest engagement, and performance metrics.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Get.back();
                  Get.snackbar(
                    'Analytics',
                    'Analytics dashboard will be available in a future update',
                    snackPosition: SnackPosition.BOTTOM,
                  );
                },
                icon: const Icon(Icons.bar_chart_rounded),
                label: const Text('View Analytics'),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextButton(
              onPressed: () => Get.back(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }
}