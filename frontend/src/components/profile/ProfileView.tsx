import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Building, Target, Github, Linkedin, CheckCircle, Save } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, token } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [institution, setInstitution] = useState('Computer Science Department');
  const [careerGoal, setCareerGoal] = useState('Full-Stack Software Engineer');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border text-center text-muted">
        Please sign in to view and manage your competency profile.
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'mock-dev-token'}`,
        },
        body: JSON.stringify({
          displayName,
          institution,
          careerGoal,
          githubUrl,
          linkedinUrl,
        }),
      });

      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (err) {
      setMessage('Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Learner Profile Settings</h2>
          <p className="text-xs text-muted">Maintain your career goal, institution, and profile links.</p>
        </div>
        <div className="flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-md border border-border text-xs">
          <span className="text-muted">Account ID:</span>
          <span className="font-mono text-accent-primary">{user.id.substring(0, 8)}...</span>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-state-success/10 border border-state-success/30 text-state-success text-xs rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
          <div className="relative">
            <User className="h-4 w-4 absolute left-3 top-3 text-muted" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Email Address (Read-only)</label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full bg-elevated/50 border border-border rounded-md py-2 px-3 text-sm text-muted cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Institution / University</label>
          <div className="relative">
            <Building className="h-4 w-4 absolute left-3 top-3 text-muted" />
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Target Career Goal</label>
          <div className="relative">
            <Target className="h-4 w-4 absolute left-3 top-3 text-muted" />
            <input
              type="text"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">GitHub Profile URL (Optional)</label>
          <div className="relative">
            <Github className="h-4 w-4 absolute left-3 top-3 text-muted" />
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">LinkedIn Profile URL (Optional)</label>
          <div className="relative">
            <Linkedin className="h-4 w-4 absolute left-3 top-3 text-muted" />
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold py-2 px-5 rounded-md text-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
