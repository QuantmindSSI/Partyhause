import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user.dart' as app_user;
import '../services/auth_service.dart';

class AuthController extends GetxController {
  final AuthService _authService = AuthService();

  // Observable state
  final Rx<app_user.User?> _user = Rx<app_user.User?>(null);
  final RxBool _isLoading = false.obs;
  final RxBool _isAuthenticated = false.obs;

  // Getters
  app_user.User? get user => _user.value;
  bool get isLoading => _isLoading.value;
  bool get isAuthenticated => _isAuthenticated.value;

  @override
  void onInit() {
    super.onInit();
    _initAuthListener();
    _checkCurrentSession();
  }

  void _initAuthListener() {
    _authService.authStateChanges.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      switch (event) {
        case AuthChangeEvent.signedIn:
          _handleSignedIn(session);
          break;
        case AuthChangeEvent.signedOut:
          _handleSignedOut();
          break;
        case AuthChangeEvent.tokenRefreshed:
          _handleTokenRefreshed(session);
          break;
        default:
          break;
      }
    });
  }

  Future<void> _checkCurrentSession() async {
    _isLoading.value = true;
    try {
      final session = _authService.currentSession;
      if (session != null) {
        await _handleSignedIn(session);
      }
    } catch (e) {
      print('Error checking current session: $e');
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> _handleSignedIn(Session? session) async {
    if (session?.user != null) {
      _isAuthenticated.value = true;
      
      // Try to get user profile from database
      final userProfile = await _authService.getUserProfile(session!.user.id);
      
      if (userProfile != null) {
        _user.value = userProfile;
      } else {
        // Create user profile from auth user
        final newUser = app_user.User(
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.userMetadata?['name'] ?? 
                session.user.email?.split('@')[0],
          createdAt: DateTime.parse(session.user.createdAt),
          updatedAt: DateTime.now(),
          userMetadata: session.user.userMetadata,
        );
        
        // Save to database
        final success = await _authService.updateUserProfile(newUser);
        if (success) {
          _user.value = newUser;
        }
      }
    }
  }

  void _handleSignedOut() {
    _user.value = null;
    _isAuthenticated.value = false;
  }

  Future<void> _handleTokenRefreshed(Session? session) async {
    if (session?.user != null && _user.value != null) {
      // Optionally refresh user data
      final userProfile = await _authService.getUserProfile(session!.user.id);
      if (userProfile != null) {
        _user.value = userProfile;
      }
    }
  }

  // Sign in
  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _isLoading.value = true;
    try {
      final response = await _authService.signIn(
        email: email,
        password: password,
      );

      if (response.success) {
        Get.snackbar(
          'Success',
          'Welcome back!',
          snackPosition: SnackPosition.BOTTOM,
        );
        return true;
      } else {
        Get.snackbar(
          'Error',
          response.error ?? 'Sign in failed',
          snackPosition: SnackPosition.BOTTOM,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'An unexpected error occurred',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Sign up
  Future<bool> signUp({
    required String email,
    required String password,
    String? name,
  }) async {
    _isLoading.value = true;
    try {
      final response = await _authService.signUp(
        email: email,
        password: password,
        name: name,
      );

      if (response.success) {
        Get.snackbar(
          'Success',
          response.message ?? 'Account created successfully',
          snackPosition: SnackPosition.BOTTOM,
        );
        return true;
      } else {
        Get.snackbar(
          'Error',
          response.error ?? 'Sign up failed',
          snackPosition: SnackPosition.BOTTOM,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'An unexpected error occurred',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Sign out
  Future<void> signOut() async {
    _isLoading.value = true;
    try {
      final success = await _authService.signOut();
      if (success) {
        Get.offAllNamed('/login');
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'Sign out failed',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      _isLoading.value = false;
    }
  }

  // Reset password
  Future<bool> resetPassword({required String email}) async {
    _isLoading.value = true;
    try {
      final response = await _authService.resetPassword(email: email);
      
      if (response.success) {
        Get.snackbar(
          'Success',
          response.message ?? 'Password reset instructions sent',
          snackPosition: SnackPosition.BOTTOM,
        );
        return true;
      } else {
        Get.snackbar(
          'Error',
          response.error ?? 'Password reset failed',
          snackPosition: SnackPosition.BOTTOM,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'An unexpected error occurred',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      _isLoading.value = false;
    }
  }

  // Update user profile
  Future<void> updateUserProfile(app_user.User updatedUser) async {
    try {
      final success = await _authService.updateUserProfile(updatedUser);
      if (success) {
        _user.value = updatedUser;
        Get.snackbar(
          'Success',
          'Profile updated successfully',
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        Get.snackbar(
          'Error',
          'Failed to update profile',
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'An unexpected error occurred',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
}