import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Camera, Save, X, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const FIELD_CONFIG = {
  coach: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Executive Coach' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Mumbai, India' },
    { key: 'experience', label: 'Experience', type: 'text', placeholder: 'e.g. 15+ years' },
    { key: 'about', label: 'About', type: 'textarea', placeholder: 'Brief description about yourself...' },
    { key: 'expertise', label: 'Expertise', type: 'tags', placeholder: 'Add expertise area' },
    { key: 'domains', label: 'Domains', type: 'tags', placeholder: 'Add domain' },
    { key: 'certifications', label: 'Certifications', type: 'tags', placeholder: 'Add certification' },
  ],
  coachee: [
    { key: 'job_title', label: 'Job Title', type: 'text', placeholder: 'e.g. Senior Associate' },
    { key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Audit & Assurance' },
    { key: 'designation', label: 'Designation', type: 'text', placeholder: 'e.g. Manager' },
    { key: 'tier', label: 'Tier', type: 'select', options: ['T1', 'T2', 'T3', 'T4'] },
    { key: 'location', label: 'Location', type: 'select', options: ['MUM', 'DEL', 'BLR', 'HYD', 'CHN', 'PUN', 'KOL'] },
    { key: 'business_unit', label: 'Business Unit', type: 'text', placeholder: 'e.g. Audit & Assurance' },
    { key: 'competency', label: 'Competency', type: 'text', placeholder: 'e.g. External Audit' },
    { key: 'date_of_joining', label: 'Date of Joining', type: 'date' },
    { key: 'enrolment_type', label: 'Enrolment Type', type: 'select', options: ['Self-nomination', 'Coach-nominated', 'Manager-nominated'] },
    { key: 'reason_for_enrolment', label: 'Reason for Enrolment', type: 'textarea', placeholder: 'Why did you enrol in the coaching program?' },
  ],
  admin: [],
};

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tag) => onChange(value.filter(t => t !== tag));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 pl-2.5 pr-1 py-1 text-xs">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="text-sm h-9"
        />
        <Button type="button" size="sm" variant="outline" className="h-9 px-3" onClick={addTag} disabled={!input.trim()}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function ProfileEditModal({ open, onClose }) {
  const { user, refreshUser } = useApp();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const fileRef = useRef(null);

  const role = user?.role || 'coachee';
  const fields = FIELD_CONFIG[role] || [];

  const getVal = (key) => form[key] !== undefined ? form[key] : (user?.[key] ?? '');

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewAvatar(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await api.uploadAvatar(file);
      setField('avatar', result.avatar);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setPreviewAvatar(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const updates = {};
    for (const [key, val] of Object.entries(form)) {
      if (val !== user?.[key]) updates[key] = val;
    }
    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save');
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile(updates);
      await refreshUser();
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U';
  const displayAvatar = previewAvatar || form.avatar || user?.avatar;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm({}); setPreviewAvatar(null); onClose(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" data-testid="profile-edit-modal">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                disabled={uploading}
                data-testid="avatar-upload-btn"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-semibold text-foreground truncate">{user?.name}</p>
                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
              <Badge variant="outline" className="mt-1.5 text-xs capitalize">{role}</Badge>
            </div>
          </div>

          {/* Editable Fields */}
          {fields.length > 0 ? (
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{field.label}</label>
                  {field.type === 'text' && (
                    <Input
                      value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="text-sm h-9"
                      data-testid={`profile-field-${field.key}`}
                    />
                  )}
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="text-sm h-9"
                      data-testid={`profile-field-${field.key}`}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <textarea
                      value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      data-testid={`profile-field-${field.key}`}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-9"
                      data-testid={`profile-field-${field.key}`}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {field.type === 'tags' && (
                    <TagInput
                      value={getVal(field.key) || []}
                      onChange={(val) => setField(field.key, val)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click your photo to update your profile picture.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => { setForm({}); setPreviewAvatar(null); onClose(); }} data-testid="profile-cancel-btn">
              Cancel
            </Button>
            <Button className="bg-primary text-white" onClick={handleSave} disabled={saving || uploading} data-testid="profile-save-btn">
              {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
