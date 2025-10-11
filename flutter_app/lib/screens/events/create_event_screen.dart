import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/event_controller.dart';
import '../../controllers/auth_controller.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class CreateEventScreen extends StatefulWidget {
  const CreateEventScreen({super.key});

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Get.back(),
        ),
        title: Text(
          'Create Event',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Event Image Section
              Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        Icons.add_a_photo_rounded,
                        size: 40,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Add Event Photo',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Optional',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // Event Name
              Text(
                'Event Name',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CustomTextField(
                controller: _nameController,
                label: 'Event Name',
                hint: 'Enter event name',
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Event name is required';
                  }
                  return null;
                },
              ),

              const SizedBox(height: AppSpacing.lg),

              // Description
              Text(
                'Description',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CustomTextField(
                controller: _descriptionController,
                label: 'Description',
                hint: 'Tell people about your event',
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Description is required';
                  }
                  return null;
                },
              ),

              const SizedBox(height: AppSpacing.lg),

              // Location
              Text(
                'Location',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CustomTextField(
                controller: _locationController,
                label: 'Location',
                hint: 'Where will this event take place?',
                prefixIcon: Icons.location_on_rounded,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Location is required';
                  }
                  return null;
                },
              ),

              const SizedBox(height: AppSpacing.lg),

              // Date & Time
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Date',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        GestureDetector(
                          onTap: _selectDate,
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.calendar_today_rounded,
                                  color: AppColors.textTertiary,
                                  size: 20,
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Text(
                                  _selectedDate != null
                                      ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                                      : 'Select date',
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: _selectedDate != null
                                        ? AppColors.textPrimary
                                        : AppColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Time',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        GestureDetector(
                          onTap: _selectTime,
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.schedule_rounded,
                                  color: AppColors.textTertiary,
                                  size: 20,
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Text(
                                  _selectedTime != null
                                      ? _selectedTime!.format(context)
                                      : 'Select time',
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: _selectedTime != null
                                        ? AppColors.textPrimary
                                        : AppColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl * 2),

              // Create Button
              CustomButton(
                text: _isLoading ? 'Creating...' : 'Create Event',
                onPressed: _isLoading ? null : _createEvent,
                width: double.infinity,
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  Future<void> _createEvent() async {
    print('🚀 [DEBUG] _createEvent() called - button clicked!');
    print('🚀 [DEBUG] Form key current state: ${_formKey.currentState}');
    
    if (!_formKey.currentState!.validate()) {
      print('❌ [DEBUG] Form validation failed');
      return;
    }
    print('✅ [DEBUG] Form validation passed');

    if (_selectedDate == null) {
      print('❌ [DEBUG] No date selected');
      Get.snackbar(
        'Validation Error',
        'Please select a date for the event',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }
    print('✅ [DEBUG] Date selected: $_selectedDate');

    if (_selectedTime == null) {
      print('❌ [DEBUG] No time selected');
      Get.snackbar(
        'Validation Error',
        'Please select a time for the event',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }
    print('✅ [DEBUG] Time selected: $_selectedTime');

    print('🔄 [DEBUG] Setting loading state to true');
    setState(() {
      _isLoading = true;
    });

    try {
      print('🔍 [DEBUG] Getting EventController...');
      final eventController = Get.find<EventController>();
      print('✅ [DEBUG] EventController found: $eventController');
      
      // Check authentication status
      try {
        print('🔐 [DEBUG] Checking authentication status...');
        final authController = Get.find<AuthController>();
        print('🔐 [DEBUG] AuthController found: $authController');
        print('🔐 [DEBUG] Is authenticated: ${authController.isAuthenticated}');
        print('🔐 [DEBUG] Current user: ${authController.user}');
        print('🔐 [DEBUG] User ID: ${authController.user?.id}');
      } catch (authError) {
        print('❌ [DEBUG] Error getting AuthController: $authError');
      }
      
      // Combine date and time
      final eventDateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
      print('📅 [DEBUG] Combined event date/time: $eventDateTime');

      print('📝 [DEBUG] Form data:');
      print('  - Name: "${_nameController.text.trim()}"');
      print('  - Description: "${_descriptionController.text.trim()}"');
      print('  - Location: "${_locationController.text.trim()}"');
      print('  - DateTime: $eventDateTime');

      print('🚀 [DEBUG] Calling eventController.createEventFromData...');
      final result = await eventController.createEventFromData(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        location: _locationController.text.trim(),
        eventDate: eventDateTime,
      );
      
      print('✅ [DEBUG] createEventFromData completed with result: $result');

      if (result) {
        print('🎉 [DEBUG] Event creation successful, navigating back');
        Get.back(); // Go back to events screen
        Get.snackbar(
          'Success',
          'Event created successfully!',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppColors.success,
          colorText: Colors.white,
        );
      } else {
        print('❌ [DEBUG] Event creation returned false');
        Get.snackbar(
          'Error',
          'Failed to create event - returned false',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppColors.error,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      print('💥 [DEBUG] Exception in _createEvent: $e');
      print('💥 [DEBUG] Exception type: ${e.runtimeType}');
      print('💥 [DEBUG] Stack trace: ${StackTrace.current}');
      Get.snackbar(
        'Error',
        'Failed to create event: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColors.error,
        colorText: Colors.white,
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}