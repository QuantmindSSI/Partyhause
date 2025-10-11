import 'package:equatable/equatable.dart';

class Game extends Equatable {
  final String id;
  final String eventId;
  final String type;
  final Map<String, dynamic> settings;
  final Map<String, dynamic> content;
  final int orderIndex;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Game({
    required this.id,
    required this.eventId,
    required this.type,
    this.settings = const {},
    this.content = const {},
    required this.orderIndex,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      type: json['type'] as String,
      settings: json['settings'] as Map<String, dynamic>? ?? {},
      content: json['content'] as Map<String, dynamic>? ?? {},
      orderIndex: json['order_index'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'type': type,
      'settings': settings,
      'content': content,
      'order_index': orderIndex,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Game copyWith({
    String? id,
    String? eventId,
    String? type,
    Map<String, dynamic>? settings,
    Map<String, dynamic>? content,
    int? orderIndex,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Game(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      type: type ?? this.type,
      settings: settings ?? this.settings,
      content: content ?? this.content,
      orderIndex: orderIndex ?? this.orderIndex,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, eventId, type, settings, content, orderIndex, createdAt, updatedAt];
}

enum GameSessionStatus { pending, active, completed }

class GameSession extends Equatable {
  final String id;
  final String gameId;
  final GameSessionStatus status;
  final int currentRound;
  final Map<String, dynamic> scores;
  final DateTime createdAt;
  final DateTime updatedAt;

  const GameSession({
    required this.id,
    required this.gameId,
    this.status = GameSessionStatus.pending,
    this.currentRound = 0,
    this.scores = const {},
    required this.createdAt,
    required this.updatedAt,
  });

  factory GameSession.fromJson(Map<String, dynamic> json) {
    GameSessionStatus parseStatus(String status) {
      switch (status) {
        case 'active':
          return GameSessionStatus.active;
        case 'completed':
          return GameSessionStatus.completed;
        default:
          return GameSessionStatus.pending;
      }
    }

    return GameSession(
      id: json['id'] as String,
      gameId: json['game_id'] as String,
      status: parseStatus(json['status'] as String),
      currentRound: json['current_round'] as int? ?? 0,
      scores: json['scores'] as Map<String, dynamic>? ?? {},
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    String statusToString(GameSessionStatus status) {
      switch (status) {
        case GameSessionStatus.active:
          return 'active';
        case GameSessionStatus.completed:
          return 'completed';
        default:
          return 'pending';
      }
    }

    return {
      'id': id,
      'game_id': gameId,
      'status': statusToString(status),
      'current_round': currentRound,
      'scores': scores,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  GameSession copyWith({
    String? id,
    String? gameId,
    GameSessionStatus? status,
    int? currentRound,
    Map<String, dynamic>? scores,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GameSession(
      id: id ?? this.id,
      gameId: gameId ?? this.gameId,
      status: status ?? this.status,
      currentRound: currentRound ?? this.currentRound,
      scores: scores ?? this.scores,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, gameId, status, currentRound, scores, createdAt, updatedAt];
}