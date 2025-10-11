import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/event_controller.dart';
import '../../controllers/auth_controller.dart';
import '../../models/event.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';

class EventDetailsScreen extends StatefulWidget {
  final Event event;

  const EventDetailsScreen({super.key, required this.event});

  @override
  State<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> {
  final eventController = Get.find<EventController>();
  final authController = Get.find<AuthController>();

  @override
  void initState() {
    super.initState();
    print('🔍 [DEBUG] EventDetailsScreen initialized');
    print('🔍 [DEBUG] Event received: ${widget.event.name}');
    print('🔍 [DEBUG] Event ID: ${widget.event.id}');
    print('🔍 [DEBUG] Event description: ${widget.event.description}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 300,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                onPressed: () => Get.back(),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.share_rounded, color: Colors.white),
                  onPressed: _shareEvent,
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
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
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Center(
                          child: Text(
                            widget.event.name.substring(0, 1).toUpperCase(),
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        widget.event.name,
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event Info Cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoCard(
                          'Date',
                          _formatEventDate(widget.event.eventDate),
                          Icons.calendar_today_rounded,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: _buildInfoCard(
                          'Time',
                          _formatEventTime(widget.event.eventDate),
                          Icons.schedule_rounded,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.md),

                  _buildInfoCard(
                    'Location',
                    widget.event.location,
                    Icons.location_on_rounded,
                    fullWidth: true,
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Description
                  Text(
                    'About this event',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      widget.event.description ?? 'No description available for this event.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.6,
                      ),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Host Info
                  Text(
                    'Event Host',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.primary, AppColors.primaryDark],
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                          child: Text(
                            widget.event.hostId.isNotEmpty 
                                ? widget.event.hostId.substring(0, 1).toUpperCase() 
                                : 'H',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Event Host',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                'Event Organizer',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.border),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            onPressed: _contactHost,
                            icon: Icon(
                              Icons.message_rounded,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Guest List Preview
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Going (0)',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      TextButton(
                        onPressed: _viewAllGuests,
                        child: Text(
                          'View All',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.people_outline_rounded,
                          size: 48,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'No guests yet',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          'Be the first to join this event!',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl * 2),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(
            top: BorderSide(color: AppColors.border),
          ),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: IconButton(
                  onPressed: _toggleFavorite,
                  icon: Icon(
                    Icons.favorite_border_rounded,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: CustomButton(
                  text: 'Join Event',
                  onPressed: _joinEvent,
                  icon: Icons.check_rounded,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon, {bool fullWidth = false}) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: AppColors.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.textTertiary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatEventDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]}, ${date.year}';
  }

  String _formatEventTime(DateTime date) {
    final hour = date.hour == 0 ? 12 : (date.hour > 12 ? date.hour - 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  void _shareEvent() {
    Get.snackbar(
      'Coming Soon',
      'Event sharing will be available soon',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void _contactHost() {
    Get.snackbar(
      'Coming Soon',
      'Host messaging will be available soon',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void _viewAllGuests() {
    Get.snackbar(
      'Coming Soon',
      'Guest list will be available soon',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void _toggleFavorite() {
    Get.snackbar(
      'Coming Soon',
      'Favorites will be available soon',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void _joinEvent() {
    Get.snackbar(
      'Success',
      'You have joined the event!',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: AppColors.success,
      colorText: Colors.white,
    );
  }
}