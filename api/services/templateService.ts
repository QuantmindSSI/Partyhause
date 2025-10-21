// Template Service - Business logic for event templates
// Handles template retrieval, validation, and event creation from templates

import { createClient } from '@supabase/supabase-js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  hero_image_url: string;
  price_tier: 'free' | 'premium' | 'purchase';
  price_amount?: number;
  author_id?: string;
  default_payload: TemplatePayload;
  required_fields_schema?: object;
  featured: boolean;
  published: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplatePayload {
  event: {
    title?: string;
    description?: string;
    duration_hours?: number;
    visibility?: string;
    category?: string;
    tags?: string[];
  };
  partyboard?: PartyBoardTask[];
  features?: {
    games?: string[];
    polls?: string[];
    budget?: boolean;
    emailSequence?: string[];
    [key: string]: any;
  };
  budget?: {
    items: BudgetItem[];
    total_estimated?: number;
    per_person_estimated?: number;
  };
  emails?: {
    [key: string]: string;
  };
  customization_hints?: {
    required_fields?: string[];
    recommended_guest_count?: string;
    setup_time_minutes?: number;
    [key: string]: any;
  };
}

export interface PartyBoardTask {
  title: string;
  description?: string;
  due_offset_days: number;
  assignee_role?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface BudgetItem {
  label: string;
  estimated: number;
  notes?: string;
  split?: boolean;
}

export interface TemplateFilters {
  category?: string;
  featured?: boolean;
  price_tier?: 'free' | 'premium' | 'purchase';
}

export interface CreateEventResult {
  event_id: string;
  success: boolean;
  created: {
    event: boolean;
    partyboard_tasks: number;
    features_enabled: string[];
    email_sequence: number;
    budget_items: number;
  };
}

export class TemplateService {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all templates with optional filters
   */
  async getTemplates(filters: TemplateFilters = {}): Promise<Template[]> {
    let query = this.supabase
      .from('templates')
      .select('*')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('usage_count', { ascending: false });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters.price_tier) {
      query = query.eq('price_tier', filters.price_tier);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single template by slug
   */
  async getTemplateBySlug(slug: string): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      throw new Error(`Template not found: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Template not found: ${error.message}`);
    }

    return data;
  }

  /**
   * Deep merge template payload with user overrides
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  /**
   * Validate overrides against template's required fields schema
   */
  private validateOverrides(
    template: Template,
    overrides: Partial<TemplatePayload>
  ): { valid: boolean; errors?: any[] } {
    if (!template.required_fields_schema) {
      return { valid: true };
    }

    const validate = ajv.compile(template.required_fields_schema);
    const valid = validate(overrides.event || {});

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate task due dates based on event date and offset
   */
  private calculateDueDate(eventDate: Date, offsetDays: number): Date {
    const dueDate = new Date(eventDate);
    dueDate.setDate(dueDate.getDate() - offsetDays);
    return dueDate;
  }

  /**
   * Create an event from a template with user overrides
   */
  async createEventFromTemplate(
    userId: string,
    templateId: string,
    overrides: Partial<TemplatePayload>
  ): Promise<CreateEventResult> {
    // 1. Load template
    const template = await this.getTemplateById(templateId);

    // 2. Validate overrides
    const validation = this.validateOverrides(template, overrides);
    if (!validation.valid) {
      throw new Error(
        `Validation failed: ${JSON.stringify(validation.errors)}`
      );
    }

    // 3. Merge template with overrides
    const payload = this.deepMerge(template.default_payload, overrides);

    // 4. Ensure required event fields
    if (!payload.event.date) {
      throw new Error('Event date is required');
    }

    // 5. Create event
    const { data: event, error: eventError } = await this.supabase
      .from('events')
      .insert({
        host_id: userId,
        title: payload.event.title,
        description: payload.event.description,
        start_date: payload.event.date,
        location: payload.event.location || '',
        visibility: payload.event.visibility || 'private',
        category: payload.event.category,
        tags: payload.event.tags || [],
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to create event: ${eventError.message}`);
    }

    const result: CreateEventResult = {
      event_id: event.id,
      success: true,
      created: {
        event: true,
        partyboard_tasks: 0,
        features_enabled: [],
        email_sequence: 0,
        budget_items: 0,
      },
    };

    // 6. Create PartyBoard tasks
    if (payload.partyboard && payload.partyboard.length > 0) {
      const eventDate = new Date(payload.event.date);
      const tasks = payload.partyboard.map((task: PartyBoardTask) => ({
        event_id: event.id,
        title: task.title,
        description: task.description || '',
        due_date: this.calculateDueDate(eventDate, task.due_offset_days),
        assignee_role: task.assignee_role || 'host',
        priority: task.priority || 'medium',
        status: 'pending',
      }));

      const { error: tasksError } = await this.supabase
        .from('partyboard_tasks')
        .insert(tasks);

      if (!tasksError) {
        result.created.partyboard_tasks = tasks.length;
      }
    }

    // 7. Create budget items
    if (payload.budget && payload.budget.items && payload.budget.items.length > 0) {
      const budgetItems = payload.budget.items.map((item: BudgetItem) => ({
        event_id: event.id,
        label: item.label,
        estimated_amount: item.estimated,
        actual_amount: null,
        notes: item.notes || '',
        split: item.split || false,
      }));

      const { error: budgetError } = await this.supabase
        .from('budget_items')
        .insert(budgetItems);

      if (!budgetError) {
        result.created.budget_items = budgetItems.length;
      }
    }

    // 8. Track features enabled
    if (payload.features) {
      const features = [];
      if (payload.features.games) features.push(...payload.features.games);
      if (payload.features.polls) features.push(...payload.features.polls);
      if (payload.features.budget) features.push('budget');
      result.created.features_enabled = features;
    }

    // 9. Track email sequence
    if (payload.emails) {
      result.created.email_sequence = Object.keys(payload.emails).length;
    }

    // 10. Track template usage
    await this.supabase.from('template_usage').insert({
      template_id: templateId,
      user_id: userId,
      event_id: event.id,
    });

    return result;
  }

  /**
   * Create a new template (admin only)
   */
  async createTemplate(
    userId: string,
    templateData: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
  ): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .insert({
        ...templateData,
        author_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing template (admin only)
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<Template>
  ): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  }
}
