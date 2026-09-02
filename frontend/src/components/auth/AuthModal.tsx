import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, Building } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'professional'>('student');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password, displayName, role);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded-xl p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex border-b border-border mb-6">
          <button
            className={`pb-3 font-medium text-sm px-4 border-b-2 transition-colors ${
              !isRegister
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-muted hover:text-primary'
            }`}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button
            className={`pb-3 font-medium text-sm px-4 border-b-2 transition-colors ${
              isRegister
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-muted hover:text-primary'
            }`}
            onClick={() => setIsRegister(true)}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-state-error/10 border border-state-error/30 text-state-error text-xs rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-muted" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="learner@university.edu"
                className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Account Role</label>
              <div className="relative">
                <Building className="h-4 w-4 absolute left-3 top-3 text-muted" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'student' | 'professional')}
                  className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="student">Student / Learner</option>
                  <option value="professional">Working Professional</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold py-2.5 rounded-md text-sm transition-colors mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
