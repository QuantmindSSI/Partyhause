import { z } from 'zod';

// Event validation schema
export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  host_id: z.string().uuid('Invalid host ID'),
  name: z.string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must be less than 100 characters')
    .trim(),
  event_date: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed > new Date();
    }, 'Event date must be in the future'),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim(),
  spotify_playlist_url: z.string()
    .url('Invalid Spotify URL')
    .optional()
    .or(z.literal(''))
    .refine((url) => {
      if (!url) return true;
      return url.includes('spotify.com') || url.includes('spotify.link');
    }, 'Must be a valid Spotify URL'),
});

// Guest validation schema
export const guestSchema = z.object({
  id: z.string().uuid().optional(),
  event_id: z.string().uuid('Invalid event ID'),
  name: z.string()
    .min(1, 'Guest name is required')
    .max(50, 'Guest name must be less than 50 characters')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email address is too long'),
  is_checked_in: z.boolean().default(false),
});

// User validation schema
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address'),
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .trim()
    .optional(),
  user_metadata: z.object({
    name: z.string().optional(),
  }).optional(),
});

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Form validation helpers
export const validateEvent = (data: unknown) => {
  try {
    return { success: true, data: eventSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateGuest = (data: unknown) => {
  try {
    return { success: true, data: guestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateSignIn = (data: unknown) => {
  try {
    return { success: true, data: signInSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateSignUp = (data: unknown) => {
  try {
    return { success: true, data: signUpSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

// Type exports
export type EventInput = z.infer<typeof eventSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
