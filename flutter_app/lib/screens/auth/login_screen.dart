import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:form_validator/form_validator.dart';
import '../../controllers/auth_controller.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  
  late TabController _tabController;
  bool _isPasswordVisible = false;
  bool _isSignUp = false;

  final AuthController _authController = Get.find<AuthController>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _isSignUp = _tabController.index == 1;
      });
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_isSignUp) {
      final success = await _authController.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        name: _nameController.text.trim().isNotEmpty 
            ? _nameController.text.trim() 
            : null,
      );
      
      if (success) {
        Get.offAllNamed('/home');
      }
    } else {
      final success = await _authController.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      
      if (success) {
        Get.offAllNamed('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.xxl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xxxl),
              // Header
              _buildHeader(),
              const SizedBox(height: AppSpacing.xxxl),
              // Tab Bar
              _buildTabBar(),
              const SizedBox(height: AppSpacing.xxl),
              // Form
              _buildForm(),
              const SizedBox(height: AppSpacing.xl),
              // Submit Button
              Obx(() => _buildSubmitButton()),
              if (!_isSignUp) ...[
                const SizedBox(height: AppSpacing.lg),
                _buildForgotPassword(),
              ],
              const SizedBox(height: AppSpacing.xxxl),
              _buildDivider(),
              const SizedBox(height: AppSpacing.xl),
              _buildSocialLogin(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Professional App Icon
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primary,
                AppColors.primaryDark,
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [AppShadows.soft],
          ),
          child: const Icon(
            Icons.celebration_outlined,
            size: 44,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        
        // Welcome Text
        Text(
          'Welcome back',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Sign in to your account to continue',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [AppShadows.subtle],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: AppColors.textPrimary,
        unselectedLabelColor: AppColors.textSecondary,
        labelStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
        dividerColor: Colors.transparent,
        splashFactory: NoSplash.splashFactory,
        overlayColor: MaterialStateProperty.all(Colors.transparent),
        tabs: const [
          Tab(text: 'Sign In'),
          Tab(text: 'Sign Up'),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_isSignUp) ...[
            CustomTextField(
              controller: _nameController,
              label: 'Full Name',
              hint: 'Enter your full name',
              prefixIcon: Icons.person_outline_rounded,
              validator: ValidationBuilder()
                  .minLength(2, 'Name must be at least 2 characters')
                  .build(),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
          CustomTextField(
            controller: _emailController,
            label: 'Email Address',
            hint: 'Enter your email address',
            prefixIcon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            validator: ValidationBuilder()
                .email('Please enter a valid email address')
                .required('Email address is required')
                .build(),
          ),
          const SizedBox(height: AppSpacing.lg),
          CustomTextField(
            controller: _passwordController,
            label: 'Password',
            hint: 'Enter your password',
            prefixIcon: Icons.lock_outline_rounded,
            obscureText: !_isPasswordVisible,
            suffixIcon: IconButton(
              icon: Icon(
                _isPasswordVisible 
                    ? Icons.visibility_outlined 
                    : Icons.visibility_off_outlined,
                color: AppColors.textTertiary,
                size: 20,
              ),
              onPressed: () {
                setState(() {
                  _isPasswordVisible = !_isPasswordVisible;
                });
              },
              splashRadius: 20,
            ),
            validator: ValidationBuilder()
                .minLength(6, 'Password must be at least 6 characters')
                .required('Password is required')
                .build(),
          ),
        ],
      ),
    );
  }

  Widget _buildForgotPassword() {
    return Align(
      alignment: Alignment.centerRight,
      child: TextButton(
        onPressed: () {
          _showForgotPasswordDialog();
        },
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: Text(
          'Forgot your password?',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(
          child: Divider(
            color: AppColors.divider,
            thickness: 1,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Text(
            'OR',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.textTertiary,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.5,
            ),
          ),
        ),
        const Expanded(
          child: Divider(
            color: AppColors.divider,
            thickness: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildSocialLogin() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton.icon(
            onPressed: () {
              // TODO: Implement Google Sign In
              Get.snackbar(
                'Coming Soon',
                'Google Sign In will be available soon',
                snackPosition: SnackPosition.BOTTOM,
              );
            },
            icon: Icon(
              Icons.g_mobiledata_rounded, 
              size: 24,
              color: AppColors.textSecondary,
            ),
            label: Text(
              _isSignUp ? 'Sign up with Google' : 'Sign in with Google',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textSecondary,
              side: const BorderSide(color: AppColors.border),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: EdgeInsets.zero,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      width: double.infinity,
      height: 56, // Professional height
      child: ElevatedButton(
        onPressed: _authController.isLoading ? null : _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: EdgeInsets.zero,
        ).copyWith(
          backgroundColor: MaterialStateProperty.resolveWith((states) {
            if (states.contains(MaterialState.disabled)) {
              return AppColors.gray300;
            }
            if (states.contains(MaterialState.pressed)) {
              return AppColors.primaryDark;
            }
            return AppColors.primary;
          }),
        ),
        child: _authController.isLoading
            ? SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.textOnPrimary,
                  ),
                ),
              )
            : Text(
                _isSignUp ? 'Create Account' : 'Sign In',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textOnPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController();
    
    Get.dialog(
      AlertDialog(
        title: const Text('Reset Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter your email address to receive password reset instructions.'),
            const SizedBox(height: 16),
            CustomTextField(
              controller: emailController,
              label: 'Email',
              hint: 'Enter your email',
              prefixIcon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (emailController.text.trim().isNotEmpty) {
                Get.back();
                await _authController.resetPassword(
                  email: emailController.text.trim(),
                );
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}