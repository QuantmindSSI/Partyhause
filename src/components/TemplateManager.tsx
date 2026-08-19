import React, { useEffect, useState, useRef } from 'react';
import sanitize from 'sanitize-html';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/PageShell';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Mail, Plus, Loader2 } from 'lucide-react';

// Strict allowlist sanitizer for template previews. The previous regex-based
// strip (<script> only) was trivially bypassed with event-handler attributes
// (<img onerror=...>), <iframe>, javascript: URLs, etc.
const safePreview = (html: string): string =>
  sanitize(html, {
    allowedTags: [
      'a', 'b', 'strong', 'i', 'em', 'u', 's', 'p', 'br', 'hr', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'pre', 'code',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['style', 'class', 'align'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Never allow scriptable style expressions
    allowedStyles: {
      '*': {
        color: [/^.*$/],
        'background-color': [/^.*$/],
        'text-align': [/^.*$/],
        'font-size': [/^.*$/],
        'font-weight': [/^.*$/],
        padding: [/^.*$/],
        margin: [/^.*$/],
        'border-radius': [/^.*$/],
      },
    },
  });

interface Template {
  id: string;
  host_id: string;
  name: string;
  subject: string;
  body_html?: string | null;
  body_markdown?: string | null;
  is_default: boolean;
  created_at: string;
}

export const TemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  // Sandboxed full preview (replaces the old window.open + document.write,
  // which executed template HTML in a fully-privileged new document).
  const [popupPreviewHtml, setPopupPreviewHtml] = useState<string | null>(null);
  // Dirty-check & confirm discard
  const initialFormRef = useRef<{ name: string; subject: string; body: string; isMarkdown: boolean } | null>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  // Delete confirmation (replaces window.confirm)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiGet<{ templates?: Template[] }>('/api/invite-templates');
      if (error) throw error;
      setTemplates(data?.templates || []);
    } catch (e) {
      console.error('Failed to fetch templates', e);
      toast({ title: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (isMarkdown) {
      // simple markdown -> html: use a minimal converter to avoid adding a heavy dep
      const html = body
        .replace(/\r\n/g, '\n')
        .split('\n\n')
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      setPreviewHtml(html);
    } else {
      setPreviewHtml(body);
    }
  }, [body, isMarkdown]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSubject('');
    setBody('');
    initialFormRef.current = { name: '', subject: '', body: '', isMarkdown: false };
    setIsMarkdown(false);
    setIsDefault(false);
    setOpenForm(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body_html || t.body_markdown || '');
    setIsMarkdown(!!t.body_markdown && !t.body_html);
    initialFormRef.current = {
      name: t.name,
      subject: t.subject,
      body: t.body_html || t.body_markdown || '',
      isMarkdown: !!t.body_markdown && !t.body_html,
    };
    setIsDefault(!!t.is_default);
    setOpenForm(true);
  };

  const isFormDirty = () => {
    const initial = initialFormRef.current;
    if (!initial) return false;
    return initial.name !== name || initial.subject !== subject || initial.body !== body || initial.isMarkdown !== isMarkdown;
  };

  const closeFormImmediate = () => {
    setOpenForm(false);
    setEditing(null);
    initialFormRef.current = null;
    setShowConfirmDiscard(false);
  };

  const attemptCloseForm = () => {
    if (isFormDirty()) {
      setShowConfirmDiscard(true);
    } else {
      closeFormImmediate();
    }
  };

  const saveTemplate = async () => {
    if (!name.trim() || !subject.trim()) {
      toast({ title: 'Name and subject required', variant: 'destructive' });
      return;
    }

    try {
      // The API clears other defaults for this host automatically when
      // is_default=true is sent on create/update.
      if (editing) {
        const updates: Record<string, unknown> = { name: name.trim(), subject: subject.trim() };
        if (isMarkdown) updates.body_markdown = body;
        else updates.body_html = body;
        updates.is_default = !!isDefault;

        const { error } = await apiPut(`/api/invite-templates/${encodeURIComponent(editing.id)}`, updates);
        if (error) throw error;
        toast({ title: 'Template updated' });
      } else {
        const insert: Record<string, unknown> = { name: name.trim(), subject: subject.trim() };
        if (isMarkdown) insert.body_markdown = body;
        else insert.body_html = body;
        insert.is_default = !!isDefault;

        const { error } = await apiPost('/api/invite-templates', insert);
        if (error) throw error;
        toast({ title: 'Template created' });
      }

      closeFormImmediate();
      fetchTemplates();
    } catch (e: any) {
      console.error('Save failed', e);
      toast({ title: 'Save failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await apiDelete(`/api/invite-templates/${encodeURIComponent(id)}`);
      if (error) throw error;
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } catch (e: any) {
      console.error('Delete failed', e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      // The API clears other defaults for this host when is_default=true.
      const { error } = await apiPut(`/api/invite-templates/${encodeURIComponent(id)}`, { is_default: true });
      if (error) throw error;
      toast({ title: 'Default template set' });
      fetchTemplates();
    } catch (e: any) {
      console.error('Set default failed', e);
      toast({ title: 'Set default failed', variant: 'destructive' });
    }
  };

  return (
    <PageShell
      title="Invite Templates"
      subtitle="Reusable email templates for your event invitations"
      maxWidth="lg"
      onBack={() => usePartyStore.getState().setCurrentPage('dashboard')}
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Template
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No templates yet"
          description="Create your first invitation template to reuse across events."
          action={{ label: 'Create Template', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{t.name}</p>
                    {t.is_default && <Badge variant="secondary">Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{t.subject}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    Edit
                  </Button>
                  {!t.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(t.id)}>
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPopupPreviewHtml(safePreview(t.body_html || t.body_markdown || ''))}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDeleteId(t.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit form (Radix Dialog: focus trap, Escape and aria handled) */}
      <Dialog open={openForm} onOpenChange={(open) => { if (!open) attemptCloseForm(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Placeholders like <code>{'{{guest_name}}'}</code>, <code>{'{{event_name}}'}</code> and{' '}
              <code>{'{{rsvp_url}}'}</code> are replaced when invitations are sent.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                name="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-subject">Subject</Label>
              <Input
                id="template-subject"
                name="template-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="template-markdown"
                checked={isMarkdown}
                onCheckedChange={(checked) => setIsMarkdown(checked === true)}
              />
              <Label htmlFor="template-markdown" className="text-sm font-normal">
                Use Markdown
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="template-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="template-default" className="text-sm font-normal">
                Set as default
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="template-body">Body</Label>
              <Textarea
                id="template-body"
                name="template-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preview</Label>
              <div
                className="border rounded-md p-3 h-72 overflow-auto bg-card"
                dangerouslySetInnerHTML={{ __html: safePreview(previewHtml) }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={attemptCloseForm}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes confirmation */}
      <AlertDialog open={showConfirmDiscard} onOpenChange={setShowConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this template. Discarding them cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={closeFormImmediate}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (pendingDeleteId) deleteTemplate(pendingDeleteId); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sandboxed template preview */}
      <Dialog open={popupPreviewHtml !== null} onOpenChange={(open) => { if (!open) setPopupPreviewHtml(null); }}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {/* Empty sandbox: no scripts, no same-origin, no forms/popups. */}
          <iframe
            title="Template preview"
            sandbox=""
            srcDoc={popupPreviewHtml ?? ''}
            className="flex-1 w-full border-0 bg-white rounded-md"
          />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default TemplateManager;
