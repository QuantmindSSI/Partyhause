import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

class CustomTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final int? maxLines;
  final bool enabled;

  const CustomTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.onChanged,
    this.maxLines = 1,
    this.enabled = true,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Professional Label
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            widget.label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        
        // Professional Input Field
        Focus(
          onFocusChange: (focused) {
            setState(() {
              _isFocused = focused;
            });
          },
          child: TextFormField(
            controller: widget.controller,
            obscureText: widget.obscureText,
            keyboardType: widget.keyboardType,
            validator: widget.validator,
            onChanged: widget.onChanged,
            maxLines: widget.maxLines,
            enabled: widget.enabled,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w400,
            ),
            decoration: InputDecoration(
              hintText: widget.hint,
              hintStyle: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.textTertiary,
                fontWeight: FontWeight.w400,
              ),
              prefixIcon: widget.prefixIcon != null 
                  ? Container(
                      margin: const EdgeInsets.only(right: 12),
                      child: Icon(
                        widget.prefixIcon,
                        color: _isFocused 
                            ? AppColors.primary 
                            : AppColors.textTertiary,
                        size: 20,
                      ),
                    )
                  : null,
              suffixIcon: widget.suffixIcon,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.lg,
              ),
              filled: true,
              fillColor: AppColors.surface,
              
              // Professional Borders
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.error, width: 1),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.error, width: 2),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.borderLight, width: 1),
              ),
            ),
          ),
        ),
      ],
    );
  }
}