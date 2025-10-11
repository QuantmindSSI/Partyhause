import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String? name;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? userMetadata;

  const User({
    required this.id,
    required this.email,
    this.name,
    required this.createdAt,
    required this.updatedAt,
    this.userMetadata,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      userMetadata: json['user_metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'user_metadata': userMetadata,
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? name,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? userMetadata,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      userMetadata: userMetadata ?? this.userMetadata,
    );
  }

  @override
  List<Object?> get props => [id, email, name, createdAt, updatedAt, userMetadata];
}