import 'package:equatable/equatable.dart';

enum EventType { singleDay, multiDay }

class Event extends Equatable {
  final String id;
  final String hostId;
  final String name;
  final DateTime eventDate;
  final DateTime? startDate;
  final DateTime? endDate;
  final String location;
  final String? description;
  final String? spotifyPlaylistUrl;
  final String? activeGameId;
  final EventType eventType;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Event({
    required this.id,
    required this.hostId,
    required this.name,
    required this.eventDate,
    this.startDate,
    this.endDate,
    required this.location,
    this.description,
    this.spotifyPlaylistUrl,
    this.activeGameId,
    this.eventType = EventType.singleDay,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      hostId: json['host_id'] as String,
      name: json['name'] as String,
      eventDate: DateTime.parse(json['event_date'] as String),
      startDate: json['start_date'] != null 
          ? DateTime.parse(json['start_date'] as String) 
          : null,
      endDate: json['end_date'] != null 
          ? DateTime.parse(json['end_date'] as String) 
          : null,
      location: json['location'] as String,
      description: json['description'] as String?,
      spotifyPlaylistUrl: json['spotify_playlist_url'] as String?,
      activeGameId: json['active_game_id'] as String?,
      eventType: json['event_type'] == 'multi_day' 
          ? EventType.multiDay 
          : EventType.singleDay,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'host_id': hostId,
      'name': name,
      'event_date': eventDate.toIso8601String(),
      'start_date': (startDate ?? eventDate).toIso8601String(), // Fallback to eventDate if null
      'end_date': (endDate ?? eventDate).toIso8601String(), // Fallback to eventDate if null
      'location': location,
      'description': description,
      'spotify_playlist_url': spotifyPlaylistUrl,
      'active_game_id': activeGameId,
      'event_type': eventType == EventType.multiDay ? 'multi_day' : 'single_day',
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Event copyWith({
    String? id,
    String? hostId,
    String? name,
    DateTime? eventDate,
    DateTime? startDate,
    DateTime? endDate,
    String? location,
    String? description,
    String? spotifyPlaylistUrl,
    String? activeGameId,
    EventType? eventType,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Event(
      id: id ?? this.id,
      hostId: hostId ?? this.hostId,
      name: name ?? this.name,
      eventDate: eventDate ?? this.eventDate,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      location: location ?? this.location,
      description: description ?? this.description,
      spotifyPlaylistUrl: spotifyPlaylistUrl ?? this.spotifyPlaylistUrl,
      activeGameId: activeGameId ?? this.activeGameId,
      eventType: eventType ?? this.eventType,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id, hostId, name, eventDate, startDate, endDate, 
        location, description, spotifyPlaylistUrl, activeGameId, 
        eventType, createdAt, updatedAt
      ];
}