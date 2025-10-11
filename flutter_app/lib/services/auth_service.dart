import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user.dart' as app_user;
import '../utils/exceptions.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Get current user session
  Session? get currentSession => _supabase.auth.currentSession;
  User? get currentUser => _supabase.auth.currentUser;

  // Listen to auth state changes
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  // Sign in with email and password
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        return AuthResponse(
          success: true,
          user: response.user,
          session: response.session,
        );
      } else {
        return const AuthResponse(
          success: false,
          error: 'No user returned from authentication',
        );
      }
    } on AuthException catch (e) {
      return AuthResponse(
        success: false,
        error: e.message,
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        error: 'An unexpected error occurred: $e',
      );
    }
  }

  // Sign up with email and password
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    String? name,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': name ?? email.split('@')[0],
        },
      );

      return AuthResponse(
        success: true,
        user: response.user,
        session: response.session,
        message: response.user?.emailConfirmedAt == null 
            ? 'Please check your email to confirm your account' 
            : 'Account created successfully',
      );
    } on AuthException catch (e) {
      return AuthResponse(
        success: false,
        error: e.message,
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        error: 'An unexpected error occurred: $e',
      );
    }
  }

  // Sign out
  Future<bool> signOut() async {
    try {
      await _supabase.auth.signOut();
      return true;
    } catch (e) {
      return false;
    }
  }

  // Reset password
  Future<AuthResponse> resetPassword({required String email}) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
      return const AuthResponse(
        success: true,
        message: 'Password reset instructions sent to your email',
      );
    } on AuthException catch (e) {
      return AuthResponse(
        success: false,
        error: e.message,
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        error: 'An unexpected error occurred: $e',
      );
    }
  }

  // Update password
  Future<AuthResponse> updatePassword({required String password}) async {
    try {
      final response = await _supabase.auth.updateUser(
        UserAttributes(password: password),
      );

      return AuthResponse(
        success: true,
        user: response.user,
        message: 'Password updated successfully',
      );
    } on AuthException catch (e) {
      return AuthResponse(
        success: false,
        error: e.message,
      );
    } catch (e) {
      return AuthResponse(
        success: false,
        error: 'An unexpected error occurred: $e',
      );
    }
  }

  // Get user profile from users table
  Future<app_user.User?> getUserProfile(String userId) async {
    try {
      final response = await _supabase
          .from('users')
          .select()
          .eq('id', userId)
          .single();

      return app_user.User.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  // Update user profile in users table
  Future<bool> updateUserProfile(app_user.User user) async {
    try {
      await _supabase
          .from('users')
          .upsert(user.toJson())
          .eq('id', user.id);
      return true;
    } catch (e) {
      return false;
    }
  }
}

class AuthResponse {
  final bool success;
  final User? user;
  final Session? session;
  final String? error;
  final String? message;

  const AuthResponse({
    required this.success,
    this.user,
    this.session,
    this.error,
    this.message,
  });
}