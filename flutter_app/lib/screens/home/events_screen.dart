import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/event_controller.dart';
import '../../models/event.dart';
import '../../utils/app_theme.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All';
  bool _isGridView = false;
  
  final List<String> _filters = ['All', 'Upcoming', 'Past', 'This Week', 'This Month'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final eventController = Get.find<EventController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildProfessionalAppBar(),
      body: Column(
        children: [
          // Search and Filter Section
          _buildSearchAndFilters(),
          
          // Events List/Grid
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                await eventController.refreshEvents();
              },
              color: AppColors.primary,
              backgroundColor: AppColors.surface,
              child: Obx(() {
                final filteredEvents = _getFilteredEvents(eventController.events);
                
                if (eventController.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                return filteredEvents.isEmpty
                    ? _buildEmptyState()
                    : _isGridView
                        ? _buildGridView(filteredEvents)
                        : _buildListView(filteredEvents);
              }),
            ),
          ),
        ],
      ),
      floatingActionButton: _buildProfessionalFAB(),
    );
  }

  PreferredSizeWidget _buildProfessionalAppBar() {
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
              'Events',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.02,
              ),
            ),
            Text(
              'Discover amazing parties',
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
          margin: const EdgeInsets.only(right: AppSpacing.xs),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: _isGridView ? AppColors.primary.withOpacity(0.1) : AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(
                _isGridView ? Icons.view_list_rounded : Icons.grid_view_rounded,
                color: _isGridView ? AppColors.primary : AppColors.textSecondary,
                size: 20,
              ),
            ),
            onPressed: () {
              setState(() {
                _isGridView = !_isGridView;
              });
            },
            splashRadius: 24,
          ),
        ),
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
                Icons.filter_list_rounded,
                color: AppColors.textSecondary,
                size: 20,
              ),
            ),
            onPressed: () {
              _showFilterBottomSheet();
            },
            splashRadius: 24,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(color: AppColors.border),
        ),
      ),
      child: Column(
        children: [
          // Search Bar
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search events...',
                hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textTertiary,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: AppColors.textTertiary,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          setState(() {
                            _searchController.clear();
                          });
                        },
                        icon: Icon(
                          Icons.clear_rounded,
                          color: AppColors.textTertiary,
                        ),
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
              ),
              onChanged: (value) {
                setState(() {});
              },
            ),
          ),
          
          const SizedBox(height: AppSpacing.lg),
          
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: FilterChip(
                    label: Text(filter),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedFilter = filter;
                      });
                    },
                    labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: isSelected ? AppColors.textOnPrimary : AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                    backgroundColor: AppColors.surfaceElevated,
                    selectedColor: AppColors.primary,
                    checkmarkColor: AppColors.textOnPrimary,
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListView(List<Event> events) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.lg),
      itemCount: events.length,
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.lg),
      itemBuilder: (context, index) {
        final event = events[index];
        return _buildEventCard(event, false);
      },
    );
  }

  Widget _buildGridView(List<Event> events) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: AppSpacing.lg,
        mainAxisSpacing: AppSpacing.lg,
      ),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return _buildEventCard(event, true);
      },
    );
  }

  Widget _buildEventCard(Event event, bool isGridMode) {
    return GestureDetector(
      onTap: () {
        print('🔍 [DEBUG] Event card tapped: ${event.name}');
        print('🔍 [DEBUG] Event ID: ${event.id}');
        print('🔍 [DEBUG] Event data: ${event.toString()}');
        
        try {
          Get.toNamed('/event-details', arguments: event);
          print('✅ [DEBUG] Navigation to event details successful');
        } catch (e) {
          print('❌ [DEBUG] Navigation error: $e');
          Get.snackbar(
            'Error',
            'Failed to open event details: $e',
            snackPosition: SnackPosition.BOTTOM,
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [AppShadows.subtle],
        ),
        child: isGridMode ? _buildGridEventCard(event) : _buildListEventCard(event),
      ),
    );
  }

  Widget _buildListEventCard(Event event) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          // Event Image/Avatar
          Container(
            width: 80,
            height: 80,
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
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.textOnPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.lg),
          
          // Event Details
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
                
                const SizedBox(height: AppSpacing.sm),
                
                Row(
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      size: 16,
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
                      size: 16,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      _formatEventDate(event.eventDate),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Arrow Icon
          Icon(
            Icons.arrow_forward_ios_rounded,
            size: 16,
            color: AppColors.textTertiary,
          ),
        ],
      ),
    );
  }

  Widget _buildGridEventCard(Event event) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Event Image
        Expanded(
          flex: 3,
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primary,
                  AppColors.primaryDark,
                ],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Center(
              child: Text(
                event.name.substring(0, 1).toUpperCase(),
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: AppColors.textOnPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
        
        // Event Details
        Expanded(
          flex: 2,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.name,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const Spacer(),
                
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
                      _formatEventDate(event.eventDate),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                _searchController.text.isNotEmpty || _selectedFilter != 'All'
                    ? Icons.search_off_rounded
                    : Icons.event_busy_rounded,
                size: 48,
                color: AppColors.textTertiary,
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            Text(
              _searchController.text.isNotEmpty || _selectedFilter != 'All'
                  ? 'No events found'
                  : 'No events yet',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            Text(
              _searchController.text.isNotEmpty || _selectedFilter != 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            SizedBox(
              width: 160,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  Get.toNamed('/create-event');
                },
                icon: const Icon(Icons.add_rounded, size: 20),
                label: const Text('Create Event'),
              ),
            ),
          ],
        ),
      ),
    );
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

  void _showFilterBottomSheet() {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.gray300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            Text(
              'Filter Events',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            ...List.generate(_filters.length, (index) {
              final filter = _filters[index];
              final isSelected = _selectedFilter == filter;
              
              return Container(
                margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: ListTile(
                  title: Text(
                    filter,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                  trailing: isSelected
                      ? Icon(Icons.check_rounded, color: AppColors.primary)
                      : null,
                  onTap: () {
                    setState(() {
                      _selectedFilter = filter;
                    });
                    Get.back();
                  },
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  tileColor: isSelected ? AppColors.primary.withOpacity(0.1) : null,
                ),
              );
            }),
            
            const SizedBox(height: AppSpacing.lg),
            
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Get.back(),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }

  List<Event> _getFilteredEvents(List<Event> events) {
    List<Event> filteredEvents = events;

    // Apply text search filter
    if (_searchController.text.isNotEmpty) {
      filteredEvents = filteredEvents.where((event) =>
          event.name.toLowerCase().contains(_searchController.text.toLowerCase()) ||
          event.location.toLowerCase().contains(_searchController.text.toLowerCase())).toList();
    }

    // Apply category filter
    switch (_selectedFilter) {
      case 'Upcoming':
        filteredEvents = filteredEvents.where((event) => 
            event.eventDate.isAfter(DateTime.now())).toList();
        break;
      case 'Past':
        filteredEvents = filteredEvents.where((event) => 
            event.eventDate.isBefore(DateTime.now())).toList();
        break;
      case 'This Week':
        final now = DateTime.now();
        final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
        final endOfWeek = startOfWeek.add(const Duration(days: 6));
        filteredEvents = filteredEvents.where((event) => 
            event.eventDate.isAfter(startOfWeek) && 
            event.eventDate.isBefore(endOfWeek)).toList();
        break;
      case 'This Month':
        final now = DateTime.now();
        filteredEvents = filteredEvents.where((event) => 
            event.eventDate.year == now.year && 
            event.eventDate.month == now.month).toList();
        break;
      default:
        // 'All' - no additional filtering
        break;
    }

    return filteredEvents;
  }

  String _formatEventDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;
    
    if (difference == 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Tomorrow';
    } else if (difference == -1) {
      return 'Yesterday';
    } else if (difference < 7 && difference > 0) {
      return '${difference} days away';
    } else if (difference > -7 && difference < 0) {
      return '${difference.abs()} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}