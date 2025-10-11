import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// Simple test script to check event creation
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://awokklruxeofxsqxcsnt.supabase.co',
    anonKey: '***REDACTED_JWT***',
  );
  
  final supabase = Supabase.instance.client;
  
  print('Testing event creation...');
  
  // Check authentication
  print('Current user: ${supabase.auth.currentUser?.id}');
  
  if (supabase.auth.currentUser == null) {
    print('User not authenticated - this is likely the issue!');
    return;
  }
  
  // Test event data
  final eventData = {
    'host_id': supabase.auth.currentUser!.id,
    'name': 'Test Event',
    'location': 'Test Location',
    'description': 'Test Description',
    'event_date': DateTime.now().toIso8601String(),
    'start_date': DateTime.now().toIso8601String(),
    'end_date': DateTime.now().toIso8601String(),
    'event_type': 'single_day',
    'created_at': DateTime.now().toIso8601String(),
    'updated_at': DateTime.now().toIso8601String(),
  };
  
  print('Attempting to create event with data: $eventData');
  
  try {
    final response = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
    
    print('Success! Event created: $response');
  } catch (e) {
    print('Error creating event: $e');
    print('Error type: ${e.runtimeType}');
  }
}