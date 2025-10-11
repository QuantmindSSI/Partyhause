import 'package:get/get.dart';
import '../models/event.dart';
import '../services/event_service.dart';

class EventController extends GetxController {
  final EventService _eventService = EventService();

  // Observable state
  final RxList<Event> _events = <Event>[].obs;
  final RxList<Event> _upcomingEvents = <Event>[].obs;
  final RxList<Event> _pastEvents = <Event>[].obs;
  final Rx<Event?> _selectedEvent = Rx<Event?>(null);
  final RxBool _isLoading = false.obs;

  // Getters
  List<Event> get events => _events;
  List<Event> get upcomingEvents => _upcomingEvents;
  List<Event> get pastEvents => _pastEvents;
  Event? get selectedEvent => _selectedEvent.value;
  bool get isLoading => _isLoading.value;

  @override
  void onInit() {
    super.onInit();
    loadEvents();
  }

  // Load all events
  Future<void> loadEvents() async {
    _isLoading.value = true;
    try {
      final events = await _eventService.getUserEvents();
      _events.value = events;
      
      // Separate upcoming and past events
      final now = DateTime.now();
      _upcomingEvents.value = events
          .where((event) => event.eventDate.isAfter(now))
          .toList();
      _pastEvents.value = events
          .where((event) => event.eventDate.isBefore(now))
          .toList();
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to load events: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      _isLoading.value = false;
    }
  }

  // Load upcoming events only
  Future<void> loadUpcomingEvents() async {
    try {
      final events = await _eventService.getUpcomingEvents();
      _upcomingEvents.value = events;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to load upcoming events: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  // Load past events only
  Future<void> loadPastEvents() async {
    try {
      final events = await _eventService.getPastEvents();
      _pastEvents.value = events;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to load past events: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  // Create new event
  Future<bool> createEvent(Event event) async {
    _isLoading.value = true;
    try {
      print('EventController: Starting event creation...');
      final newEvent = await _eventService.createEvent(event);
      print('EventController: Event created successfully: ${newEvent.id}');
      
      _events.add(newEvent);
      
      // Update upcoming events if event is in future
      if (newEvent.eventDate.isAfter(DateTime.now())) {
        _upcomingEvents.add(newEvent);
        _upcomingEvents.sort((a, b) => a.eventDate.compareTo(b.eventDate));
      }
      
      Get.snackbar(
        'Success',
        'Event created successfully',
        snackPosition: SnackPosition.BOTTOM,
      );
      return true;
    } catch (e) {
      print('EventController: Error creating event: $e');
      Get.snackbar(
        'Error',
        'Failed to create event: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Convenience method for creating event with individual parameters
  Future<bool> createEventFromData({
    required String name,
    required String description,
    required String location,
    required DateTime eventDate,
  }) async {
    print('Creating event with:');
    print('Name: $name');
    print('Description: $description');
    print('Location: $location');
    print('Event Date: $eventDate');
    
    final event = Event(
      id: '', // Will be set by service
      name: name,
      description: description,
      location: location,
      eventDate: eventDate,
      startDate: eventDate, // Set start date to event date
      endDate: eventDate, // For single-day events, end date is same as start date
      eventType: EventType.singleDay,
      hostId: '', // Will be set by service
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    print('Event object created: ${event.toJson()}');
    
    return await createEvent(event);
  }

  // Update event
  Future<bool> updateEvent(Event event) async {
    _isLoading.value = true;
    try {
      final updatedEvent = await _eventService.updateEvent(event);
      
      // Update in events list
      final index = _events.indexWhere((e) => e.id == updatedEvent.id);
      if (index != -1) {
        _events[index] = updatedEvent;
      }
      
      // Update selected event if it's the same
      if (_selectedEvent.value?.id == updatedEvent.id) {
        _selectedEvent.value = updatedEvent;
      }
      
      // Refresh upcoming/past events
      await loadEvents();
      
      Get.snackbar(
        'Success',
        'Event updated successfully',
        snackPosition: SnackPosition.BOTTOM,
      );
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to update event: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Delete event
  Future<bool> deleteEvent(String eventId) async {
    _isLoading.value = true;
    try {
      await _eventService.deleteEvent(eventId);
      
      // Remove from all lists
      _events.removeWhere((e) => e.id == eventId);
      _upcomingEvents.removeWhere((e) => e.id == eventId);
      _pastEvents.removeWhere((e) => e.id == eventId);
      
      // Clear selected event if it was deleted
      if (_selectedEvent.value?.id == eventId) {
        _selectedEvent.value = null;
      }
      
      Get.snackbar(
        'Success',
        'Event deleted successfully',
        snackPosition: SnackPosition.BOTTOM,
      );
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to delete event: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Select event
  void selectEvent(Event event) {
    _selectedEvent.value = event;
  }

  // Clear selected event
  void clearSelectedEvent() {
    _selectedEvent.value = null;
  }

  // Get event by ID
  Future<Event?> getEvent(String eventId) async {
    try {
      return await _eventService.getEvent(eventId);
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to load event: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
      return null;
    }
  }

  // Refresh events
  Future<void> refreshEvents() async {
    await loadEvents();
  }
}