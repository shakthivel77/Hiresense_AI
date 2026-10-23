import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, Building2, School, Info } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApprovedCollege {
  id: string;
  name: string;
  code: string;
  domain?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // College affiliation fields
  const [approvedColleges, setApprovedColleges] = useState<ApprovedCollege[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [requestNewCollege, setRequestNewCollege] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [officialCollegeEmail, setOfficialCollegeEmail] = useState('');

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/colleges/approved')
        .then((res) => res.json())
        .then((body) => {
          if (body.success && Array.isArray(body.data)) {
            setApprovedColleges(body.data);
          }
        })
        .catch((err) => console.warn('[AuthModal] Could not fetch approved colleges:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    try {
      if (isRegister) {
        const collegeAffiliation = (selectedCollegeId || customCollegeName)
          ? {
              collegeId: selectedCollegeId || undefined,
              requestedCollegeName: customCollegeName || undefined,
              officialCollegeEmail: officialCollegeEmail.trim() || undefined,
            }
          : undefined;

        const result = await register(email, password, displayName, 'STUDENT', collegeAffiliation);
        if (result.sessionCreated) {
          onClose();
        } else {
          setInfoMessage(
            'Account created! A confirmation email has been sent. Please verify your email before signing in.'
          );
          setIsRegister(false);
        }
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleTabSwitch = (registerTab: boolean) => {
    setIsRegister(registerTab);
    setError('');
    setInfoMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-border w-full max-w-md rounded-xl p-6 relative shadow-2xl my-8">
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
            onClick={() => handleTabSwitch(false)}
          >
            Sign In
          </button>
          <button
            className={`pb-3 font-medium text-sm px-4 border-b-2 transition-colors ${
              isRegister
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-muted hover:text-primary'
            }`}
            onClick={() => handleTabSwitch(true)}
          >
            Register Student
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-state-error/10 border border-state-error/30 text-state-error text-xs rounded-md">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-state-success/10 border border-state-success/30 text-state-success text-xs rounded-md">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Full Name</label>
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
                placeholder="learner@example.com"
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

          {/* Optional College Affiliation on Registration */}
          {isRegister && (
            <div className="pt-2 border-t border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-primary flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-accent-secondary" />
                  College Affiliation <span className="text-[10px] text-muted font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRequestNewCollege(!requestNewCollege);
                    setSelectedCollegeId('');
                    setCustomCollegeName('');
                  }}
                  className="text-[11px] text-accent-primary hover:underline"
                >
                  {requestNewCollege ? 'Select from approved list' : "Can't find your college?"}
                </button>
              </div>

              {!requestNewCollege ? (
                <div>
                  <div className="relative">
                    <Building2 className="h-4 w-4 absolute left-3 top-3 text-muted" />
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      className="w-full bg-elevated border border-border rounded-md py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="">Independent Learner (No College)</option>
                      {approvedColleges.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customCollegeName}
                    onChange={(e) => setCustomCollegeName(e.target.value)}
                    placeholder="Enter official institution / college name"
                    className="w-full bg-elevated border border-border rounded-md py-2 px-3 text-sm text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Your college request will be reviewed by platform administrators.
                  </p>
                </div>
              )}

              {/* Show Official College Email input and Required Mandatory Note if College Selected */}
              {(selectedCollegeId || customCollegeName) && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">
                      Official College Email (Recommended)
                    </label>
                    <input
                      type="email"
                      value={officialCollegeEmail}
                      onChange={(e) => setOfficialCollegeEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full bg-elevated border border-border rounded-md py-1.5 px-3 text-xs text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  {/* Mandatory Registration Notice */}
                  <div className="p-3 bg-elevated border border-accent-primary/30 rounded-lg flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted leading-relaxed">
                      "If you are registering with your college affiliation, we recommend using your official college email address. This helps your institution identify and monitor your learning progress. College affiliation may be subject to verification."
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-base font-semibold py-2.5 rounded-md text-sm transition-colors mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Student Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
