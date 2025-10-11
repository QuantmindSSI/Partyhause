import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/guest.dart';
import '../utils/exceptions.dart';

class GuestService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Get all guests for an event
  Future<List<Guest>> getEventGuests(String eventId) async {
    try {
      final response = await _supabase
          .from('guests')
          .select()
          .eq('event_id', eventId)
          .order('created_at', ascending: true);

      return (response as List)
          .map((json) => Guest.fromJson(json))
          .toList();
    } catch (e) {
      throw ServerException('Failed to fetch guests: $e');
    }
  }

  // Add guest to event
  Future<Guest> addGuest(Guest guest) async {
    try {
      final guestData = guest.toJson();
      guestData.remove('id'); // Let database generate ID

      final response = await _supabase
          .from('guests')
          .insert(guestData)
          .select()
          .single();

      return Guest.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to add guest: $e');
    }
  }

  // Update guest
  Future<Guest> updateGuest(Guest guest) async {
    try {
      final response = await _supabase
          .from('guests')
          .update(guest.toJson())
          .eq('id', guest.id)
          .select()
          .single();

      return Guest.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to update guest: $e');
    }
  }

  // Delete guest
  Future<void> deleteGuest(String guestId) async {
    try {
      await _supabase
          .from('guests')
          .delete()
          .eq('id', guestId);
    } catch (e) {
      throw ServerException('Failed to delete guest: $e');
    }
  }

  // Check in guest
  Future<Guest> checkInGuest(String guestId) async {
    try {
      final response = await _supabase
          .from('guests')
          .update({'is_checked_in': true})
          .eq('id', guestId)
          .select()
          .single();

      return Guest.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to check in guest: $e');
    }
  }

  // Check out guest
  Future<Guest> checkOutGuest(String guestId) async {
    try {
      final response = await _supabase
          .from('guests')
          .update({'is_checked_in': false})
          .eq('id', guestId)
          .select()
          .single();

      return Guest.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to check out guest: $e');
    }
  }

  // Get checked-in guests count
  Future<int> getCheckedInCount(String eventId) async {
    try {
      final response = await _supabase
          .from('guests')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_checked_in', true);

      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }

  // Get total guests count
  Future<int> getTotalGuestsCount(String eventId) async {
    try {
      final response = await _supabase
          .from('guests')
          .select('id')
          .eq('event_id', eventId);

      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }
}