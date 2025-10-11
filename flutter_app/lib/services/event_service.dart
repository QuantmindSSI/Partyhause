import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/event.dart';
import '../utils/exceptions.dart';

class EventService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Get all events for current user
  Future<List<Event>> getUserEvents() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw const AuthenticationException('User not authenticated');
      }

      final response = await _supabase
          .from('events')
          .select()
          .eq('host_id', userId)
          .order('start_date', ascending: true);

      return (response as List)
          .map((json) => Event.fromJson(json))
          .toList();
    } catch (e) {
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to fetch events: $e');
    }
  }

  // Get event by ID
  Future<Event?> getEvent(String eventId) async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .eq('id', eventId)
          .single();

      return Event.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  // Create new event
  Future<Event> createEvent(Event event) async {
    try {
      print('🔐 [DEBUG] EventService.createEvent() called');
      
      // Check authentication
      final currentUser = _supabase.auth.currentUser;
      print('🔐 [DEBUG] Current Supabase user: $currentUser');
      print('🔐 [DEBUG] User ID: ${currentUser?.id}');
      print('🔐 [DEBUG] User email: ${currentUser?.email}');
      
      if (currentUser?.id == null) {
        print('❌ [DEBUG] User not authenticated - currentUser.id is null');
        throw const AuthenticationException('User not authenticated');
      }

      final userId = currentUser!.id;
      print('✅ [DEBUG] User authenticated with ID: $userId');

      final eventData = event.toJson();
      print('📝 [DEBUG] Original event data: $eventData');
      
      eventData['host_id'] = userId;
      eventData.remove('id'); // Let database generate ID
      
      print('📝 [DEBUG] Final event data for database: $eventData');
      print('🔍 [DEBUG] Required fields check:');
      print('  - host_id: ${eventData['host_id']}');
      print('  - name: ${eventData['name']}');
      print('  - location: ${eventData['location']}');
      print('  - start_date: ${eventData['start_date']}');
      print('  - end_date: ${eventData['end_date']}');

      print('🚀 [DEBUG] Attempting database insertion...');
      final response = await _supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();

      print('✅ [DEBUG] Database insertion successful: $response');
      
      final createdEvent = Event.fromJson(response);
      print('🎉 [DEBUG] Event object created successfully: ${createdEvent.id}');
      
      return createdEvent;
    } catch (e) {
      print('💥 [DEBUG] Error in EventService.createEvent: $e');
      print('💥 [DEBUG] Error type: ${e.runtimeType}');
      print('💥 [DEBUG] Error details: ${e.toString()}');
      
      if (e is PostgrestException) {
        print('💥 [DEBUG] PostgrestException details:');
        print('  - code: ${e.code}');
        print('  - message: ${e.message}');
        print('  - details: ${e.details}');
        print('  - hint: ${e.hint}');
      }
      
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to create event: $e');
    }
  }

  // Update event
  Future<Event> updateEvent(Event event) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw const AuthenticationException('User not authenticated');
      }

      final response = await _supabase
          .from('events')
          .update(event.toJson())
          .eq('id', event.id)
          .eq('host_id', userId)
          .select()
          .single();

      return Event.fromJson(response);
    } catch (e) {
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to update event: $e');
    }
  }

  // Delete event
  Future<void> deleteEvent(String eventId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw const AuthenticationException('User not authenticated');
      }

      await _supabase
          .from('events')
          .delete()
          .eq('id', eventId)
          .eq('host_id', userId);
    } catch (e) {
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to delete event: $e');
    }
  }

  // Get upcoming events
  Future<List<Event>> getUpcomingEvents() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw const AuthenticationException('User not authenticated');
      }

      final now = DateTime.now().toIso8601String();
      final response = await _supabase
          .from('events')
          .select()
          .eq('host_id', userId)
          .gte('event_date', now)
          .order('event_date', ascending: true)
          .limit(10);

      return (response as List)
          .map((json) => Event.fromJson(json))
          .toList();
    } catch (e) {
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to fetch upcoming events: $e');
    }
  }

  // Get past events
  Future<List<Event>> getPastEvents() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw const AuthenticationException('User not authenticated');
      }

      final now = DateTime.now().toIso8601String();
      final response = await _supabase
          .from('events')
          .select()
          .eq('host_id', userId)
          .lt('event_date', now)
          .order('event_date', ascending: false)
          .limit(10);

      return (response as List)
          .map((json) => Event.fromJson(json))
          .toList();
    } catch (e) {
      if (e is AuthenticationException) rethrow;
      throw ServerException('Failed to fetch past events: $e');
    }
  }
}