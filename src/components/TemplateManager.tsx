import React, { useEffect, useState, useRef } from 'react';
import sanitize from 'sanitize-html';
import { useToast } from '@/hooks/use-toast';

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
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { usePartyStore } from '@/store/usePartyStore';

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
  const modalRef = useRef<HTMLDivElement | null>(null);

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
      try {
        // Basic conversion for headers, links and paragraphs
        let html = body
          .replace(/\r\n/g, '\n')
          .split('\n\n')
          .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        setPreviewHtml(html);
      } catch (e) {
        setPreviewHtml(body);
      }
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
    setIsDefault(false);
    setOpenForm(true);
  };

  const navigateBackToDashboard = () => {
    if (isFormDirty()) {
      setShowConfirmDiscard(true);
      // If user confirms discard, the confirm dialog's Discard handler will call closeFormImmediate.
      // We'll navigate after closing the form by listening for close; but to keep it simple, call navigation in Discard handler instead.
    } else {
      usePartyStore.getState().setCurrentPage('dashboard');
    }
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body_html || t.body_markdown || '');
    setIsMarkdown(!!t.body_markdown && !t.body_html);
    initialFormRef.current = { name: t.name, subject: t.subject, body: t.body_html || t.body_markdown || '', isMarkdown: !!t.body_markdown && !t.body_html };
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

  // Focus trap: keep focus within modal when open
  useEffect(() => {
    if (!openForm || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        attemptCloseForm();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openForm, modalRef.current, name, subject, body, isMarkdown]);

  const saveTemplate = async () => {
    if (!name.trim() || !subject.trim()) {
      toast({ title: 'Name and subject required', variant: 'destructive' });
      return;
    }

    try {
      // The API clears other defaults for this host automatically when
      // is_default=true is sent on create/update, so no explicit clear is
      // needed here. Auth stays on Supabase; the user id is not required.

      if (editing) {
        const updates: any = { name: name.trim(), subject: subject.trim() };
        if (isMarkdown) updates.body_markdown = body;
        else updates.body_html = body;
        updates.is_default = !!isDefault;

        const { error } = await apiPut(`/api/invite-templates/${encodeURIComponent(editing.id)}`, updates);
        if (error) throw error;
        toast({ title: 'Template updated' });
      } else {
        const insert: any = { name: name.trim(), subject: subject.trim() };
        if (isMarkdown) insert.body_markdown = body;
        else insert.body_html = body;
        insert.is_default = !!isDefault;

        const { error } = await apiPost('/api/invite-templates', insert);
        if (error) throw error;
        toast({ title: 'Template created' });
      }

      setOpenForm(false);
      fetchTemplates();
    } catch (e: any) {
      console.error('Save failed', e);
      toast({ title: 'Save failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      const { error } = await apiDelete(`/api/invite-templates/${encodeURIComponent(id)}`);
      if (error) throw error;
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } catch (e: any) {
      console.error('Delete failed', e);
      toast({ title: 'Delete failed', variant: 'destructive' });
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={() => usePartyStore.getState().setCurrentPage('dashboard')}>Back to dashboard</button>
          <h2 className="text-xl font-semibold">Invite Templates</h2>
        </div>
        <div>
          <button className="btn" onClick={openCreate}>Create Template</button>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="p-3 border rounded flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <strong>{t.name}</strong>
                  {t.is_default && <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Default</span>}
                </div>
                <div className="text-sm text-muted-foreground">{t.subject}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => openEdit(t)}>Edit</button>
                <button className="btn btn-ghost" onClick={() => setDefault(t.id)}>Set Default</button>
                <button className="btn btn-ghost" onClick={() => setPopupPreviewHtml(safePreview(t.body_html || t.body_markdown || ''))}>Preview</button>
                <button className="btn btn-destructive" onClick={() => deleteTemplate(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {openForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 z-50"
          onClick={() => attemptCloseForm()}
          tabIndex={-1}
        >
          <div ref={modalRef} className="bg-white rounded-lg shadow max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Template' : 'Create Template'}</h3>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost" onClick={() => navigateBackToDashboard()}>Back to dashboard</button>
                <button aria-label="Close" className="ml-4 text-gray-500 hover:text-gray-700" onClick={() => attemptCloseForm()}>✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input mt-1 w-full" />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={isMarkdown} onChange={(e) => setIsMarkdown(e.target.checked)} />
                <span className="text-sm">Use Markdown</span>
              </label>
            </div>
            <div className="mt-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                <span className="text-sm">Set as default</span>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Body</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="textarea mt-1 w-full" />
                <div className="text-sm text-muted-foreground mt-2">You can use placeholders like <code>{"{{guest_name}}"}</code>, <code>{"{{event_name}}"}</code>, <code>{"{{rsvp_url}}"}</code></div>
              </div>
              <div>
                <label className="block text-sm font-medium">Preview</label>
                <div className="border rounded p-3 mt-1 h-72 overflow-auto" dangerouslySetInnerHTML={{ __html: safePreview(previewHtml) }} />
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center gap-2">
              <div>
                <button className="btn" onClick={() => attemptCloseForm()}>Cancel</button>
              </div>
              <div>
                <button className="btn btn-primary" onClick={saveTemplate}>{editing ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmDiscard && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow">
            <h4 className="text-lg font-semibold mb-2">Are you sure?</h4>
            <p className="text-sm text-muted-foreground mb-4">You have unsaved changes. Discard them?</p>
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setShowConfirmDiscard(false)}>Continue editing</button>
              <button className="btn btn-destructive" onClick={() => { closeFormImmediate(); usePartyStore.getState().setCurrentPage('dashboard'); }}>Discard changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Sandboxed template preview modal */}
      {popupPreviewHtml !== null && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setPopupPreviewHtml(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Template preview"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold">Template Preview</h4>
              <button className="btn btn-ghost" onClick={() => setPopupPreviewHtml(null)} aria-label="Close preview">
                Close
              </button>
            </div>
            {/* Empty sandbox: no scripts, no same-origin, no forms/popups. */}
            <iframe
              title="Template preview"
              sandbox=""
              srcDoc={popupPreviewHtml}
              className="flex-1 w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
