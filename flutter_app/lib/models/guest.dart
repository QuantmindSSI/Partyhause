import 'package:equatable/equatable.dart';

class Guest extends Equatable {
  final String id;
  final String eventId;
  final String name;
  final String email;
  final bool isCheckedIn;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Guest({
    required this.id,
    required this.eventId,
    required this.name,
    required this.email,
    this.isCheckedIn = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Guest.fromJson(Map<String, dynamic> json) {
    return Guest(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      isCheckedIn: json['is_checked_in'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'name': name,
      'email': email,
      'is_checked_in': isCheckedIn,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Guest copyWith({
    String? id,
    String? eventId,
    String? name,
    String? email,
    bool? isCheckedIn,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Guest(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      name: name ?? this.name,
      email: email ?? this.email,
      isCheckedIn: isCheckedIn ?? this.isCheckedIn,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, eventId, name, email, isCheckedIn, createdAt, updatedAt];
}