import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/game.dart';
import '../utils/exceptions.dart';

class GameService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Get all games for an event
  Future<List<Game>> getEventGames(String eventId) async {
    try {
      final response = await _supabase
          .from('games')
          .select()
          .eq('event_id', eventId)
          .order('order_index', ascending: true);

      return (response as List)
          .map((json) => Game.fromJson(json))
          .toList();
    } catch (e) {
      throw ServerException('Failed to fetch games: ${e.toString()}');
    }
  }

  // Create new game
  Future<Game> createGame(Game game) async {
    try {
      final gameData = game.toJson();
      gameData.remove('id'); // Let database generate ID

      final response = await _supabase
          .from('games')
          .insert(gameData)
          .select()
          .single();

      return Game.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to create game: ${e.toString()}');
    }
  }

  // Update game
  Future<Game> updateGame(Game game) async {
    try {
      final response = await _supabase
          .from('games')
          .update(game.toJson())
          .eq('id', game.id)
          .select()
          .single();

      return Game.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to update game: ${e.toString()}');
    }
  }

  // Delete game
  Future<void> deleteGame(String gameId) async {
    try {
      await _supabase
          .from('games')
          .delete()
          .eq('id', gameId);
    } catch (e) {
      throw ServerException('Failed to delete game: ${e.toString()}');
    }
  }

  // Reorder games
  Future<void> reorderGames(List<Game> games) async {
    try {
      final updates = games.asMap().entries.map((entry) {
        final index = entry.key;
        final game = entry.value;
        return {
          'id': game.id,
          'order_index': index,
        };
      }).toList();

      for (final update in updates) {
        await _supabase
            .from('games')
            .update({'order_index': update['order_index']})
            .eq('id', update['id'] as Object);
      }
    } catch (e) {
      throw ServerException('Failed to reorder games: ${e.toString()}');
    }
  }

  // Get game sessions for a game
  Future<List<GameSession>> getGameSessions(String gameId) async {
    try {
      final response = await _supabase
          .from('game_sessions')
          .select()
          .eq('game_id', gameId)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => GameSession.fromJson(json))
          .toList();
    } catch (e) {
      throw ServerException('Failed to fetch game sessions: ${e.toString()}');
    }
  }

  // Create game session
  Future<GameSession> createGameSession(GameSession session) async {
    try {
      final sessionData = session.toJson();
      sessionData.remove('id'); // Let database generate ID

      final response = await _supabase
          .from('game_sessions')
          .insert(sessionData)
          .select()
          .single();

      return GameSession.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to create game session: ${e.toString()}');
    }
  }

  // Update game session
  Future<GameSession> updateGameSession(GameSession session) async {
    try {
      final response = await _supabase
          .from('game_sessions')
          .update(session.toJson())
          .eq('id', session.id)
          .select()
          .single();

      return GameSession.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to update game session: ${e.toString()}');
    }
  }

  // Start game session
  Future<GameSession> startGameSession(String sessionId) async {
    try {
      final response = await _supabase
          .from('game_sessions')
          .update({'status': 'active'})
          .eq('id', sessionId)
          .select()
          .single();

      return GameSession.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to start game session: ${e.toString()}');
    }
  }

  // End game session
  Future<GameSession> endGameSession(String sessionId) async {
    try {
      final response = await _supabase
          .from('game_sessions')
          .update({'status': 'completed'})
          .eq('id', sessionId)
          .select()
          .single();

      return GameSession.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to end game session: ${e.toString()}');
    }
  }

  // Update game session scores
  Future<GameSession> updateGameSessionScores(
    String sessionId,
    Map<String, dynamic> scores,
  ) async {
    try {
      final response = await _supabase
          .from('game_sessions')
          .update({'scores': scores})
          .eq('id', sessionId)
          .select()
          .single();

      return GameSession.fromJson(response);
    } catch (e) {
      throw ServerException('Failed to update game session scores: ${e.toString()}');
    }
  }
}