import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, ChevronDown, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import type { StaffMember } from '../types/StaffMember';
import type { StaffConstraint, PreferenceLevel } from '../types/StaffConstraint';

type StaffConstraintWithIds = StaffConstraint & { id: string; staffMemberId: string };

export const Route = createFileRoute('/staff/')({
  component: StaffManagement,
});

function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());
  const [staffConstraints, setStaffConstraints] = useState<Record<string, StaffConstraintWithIds[]>>({});
  const [showConstraintForm, setShowConstraintForm] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<StaffConstraintWithIds | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      if (!response.ok) {
        throw new Error('Failed to load staff members');
      }
      const data = await response.json();
      // Convert date strings back to Date objects
      const staffWithDates = data.map((s: any) => ({
        ...s,
        startOfService: new Date(s.startOfService),
      }));
      setStaff(staffWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff member');
      }

      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
    }
  }

  function handleEdit(staffMember: StaffMember) {
    setEditingStaff(staffMember);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingStaff(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingStaff(null);
  }

  async function handleFormSuccess() {
    closeForm();
    await loadStaff();
  }

  async function loadConstraintsForStaff(staffId: string) {
    try {
      const response = await fetch('/api/staff-constraints');
      if (!response.ok) throw new Error('Failed to load staff constraints');
      const data = await response.json();
      const constraintsWithDates = data
        .filter((c: any) => c.staffMemberId === staffId)
        .map((c: any) => ({
          ...c,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
        }));
      setStaffConstraints(prev => ({ ...prev, [staffId]: constraintsWithDates }));
    } catch (err) {
      console.error('Error loading staff constraints:', err);
    }
  }

  function toggleStaffExpansion(staffId: string) {
    const newExpanded = new Set(expandedStaff);
    if (newExpanded.has(staffId)) {
      newExpanded.delete(staffId);
    } else {
      newExpanded.add(staffId);
      if (!staffConstraints[staffId]) {
        loadConstraintsForStaff(staffId);
      }
    }
    setExpandedStaff(newExpanded);
  }

  function handleAddConstraint(staffId: string) {
    setCurrentStaffId(staffId);
    setEditingConstraint(null);
    setShowConstraintForm(true);
  }

  function handleEditConstraint(constraint: StaffConstraintWithIds) {
    setCurrentStaffId(constraint.staffMemberId);
    setEditingConstraint(constraint);
    setShowConstraintForm(true);
  }

  async function handleDeleteConstraint(constraintId: string, staffId: string) {
    if (!confirm('Are you sure you want to delete this constraint?')) return;
    try {
      const response = await fetch(`/api/staff-constraints/${constraintId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete constraint');
      await loadConstraintsForStaff(staffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete constraint');
    }
  }

  async function handleConstraintFormSuccess() {
    setShowConstraintForm(false);
    setEditingConstraint(null);
    if (currentStaffId) {
      await loadConstraintsForStaff(currentStaffId);
    }
    setCurrentStaffId(null);
  }

  function getPreferenceColor(preference: PreferenceLevel): string {
    switch (preference) {
      case 'unavailable':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'not_preferred':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      case 'preferred':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Staff Management</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Staff Member
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {staff.map((member) => {
            const isExpanded = expandedStaff.has(member.id);
            const constraints = staffConstraints[member.id] || [];

            return (
              <div
                key={member.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleStaffExpansion(member.id)}
                        className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {member.name}
                        </h3>
                        <p className="text-gray-400 text-sm">Rank: {member.rank}</p>
                      </div>
                    </div>
                    <div className="ml-9 mt-2 space-y-1 text-sm">
                      <div className="text-gray-400">
                        Started: {member.startOfService.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        Constraints: {constraints.length}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddConstraint(member.id)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      title="Add Constraint"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                      title="Edit Staff Member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Staff Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm ml-9">
                  <div>
                    <div className="text-gray-400 mb-1">Qualifications:</div>
                    <div className="flex flex-wrap gap-2">
                      {member.qualifications.map((qual, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs"
                        >
                          {qual}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-9 space-y-3">
                    {constraints.length === 0 ? (
                      <div className="text-gray-500 text-sm italic py-4">
                        No constraints yet. Click the + button above to add one.
                      </div>
                    ) : (
                      constraints.map((constraint) => (
                        <div
                          key={constraint.id}
                          className={`border rounded-lg p-4 hover:border-cyan-500/30 transition-all ${getPreferenceColor(constraint.preference)}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium capitalize">{constraint.preference.replace('_', ' ')}</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {constraint.startTime.toLocaleString()} - {constraint.endTime.toLocaleString()}
                                </div>
                                {constraint.reason && (
                                  <div className="text-sm italic">
                                    Reason: {constraint.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEditConstraint(constraint)}
                                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                                title="Edit Constraint"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteConstraint(constraint.id, member.id)}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                title="Delete Constraint"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {staff.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No staff members found. Click "Add Staff Member" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <StaffFormModal
          staff={editingStaff}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showConstraintForm && (
        <ConstraintFormModal
          constraint={editingConstraint}
          staffId={currentStaffId}
          onClose={() => {
            setShowConstraintForm(false);
            setEditingConstraint(null);
            setCurrentStaffId(null);
          }}
          onSuccess={handleConstraintFormSuccess}
        />
      )}
    </div>
  );
}

interface StaffFormModalProps {
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

function StaffFormModal({ staff, onClose, onSuccess }: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    id: staff?.id || '',
    name: staff?.name || '',
    rank: staff?.rank || 0,
    startOfService: staff?.startOfService
      ? staff.startOfService.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    qualifications: staff?.qualifications.join(', ') || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const qualificationsArray = formData.qualifications
        .split(',')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const payload = {
        id: formData.id,
        name: formData.name,
        rank: Number(formData.rank),
        startOfService: formData.startOfService,
        qualifications: qualificationsArray,
        constraints: staff?.constraints,
      };

      const url = staff ? `/api/staff/${staff.id}` : '/api/staff';
      const method = staff ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff member');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              disabled={!!staff}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="unique-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rank
            </label>
            <input
              type="number"
              value={formData.rank}
              onChange={(e) =>
                setFormData({ ...formData, rank: Number(e.target.value) })
              }
              required
              min="0"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start of Service
            </label>
            <input
              type="date"
              value={formData.startOfService}
              onChange={(e) =>
                setFormData({ ...formData, startOfService: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Qualifications (comma-separated)
            </label>
            <input
              type="text"
              value={formData.qualifications}
              onChange={(e) =>
                setFormData({ ...formData, qualifications: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="RN, BLS, ACLS"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {staff ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConstraintFormModalProps {
  constraint: StaffConstraintWithIds | null;
  staffId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ConstraintFormModal({ constraint, staffId, onClose, onSuccess }: ConstraintFormModalProps) {
  const [formData, setFormData] = useState({
    id: constraint?.id || '',
    staffMemberId: constraint?.staffMemberId || staffId || '',
    startTime: constraint?.startTime
      ? new Date(constraint.startTime.getTime() - constraint.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endTime: constraint?.endTime
      ? new Date(constraint.endTime.getTime() - constraint.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    preference: constraint?.preference || 'neutral' as PreferenceLevel,
    reason: constraint?.reason || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        id: formData.id,
        staffMemberId: formData.staffMemberId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        preference: formData.preference,
        reason: formData.reason || undefined,
      };

      const url = constraint ? `/api/staff-constraints/${constraint.id}` : '/api/staff-constraints';
      const method = constraint ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff constraint');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff constraint');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {constraint ? 'Edit Staff Constraint' : 'Add Staff Constraint'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              disabled={!!constraint}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="unique-id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Staff Member ID</label>
            <input
              type="text"
              value={formData.staffMemberId}
              onChange={(e) => setFormData({ ...formData, staffMemberId: e.target.value })}
              required
              disabled={!constraint && !!staffId}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="staff-member-id"
            />
            {!constraint && staffId && (
              <p className="text-xs text-gray-400 mt-1">Auto-filled from current staff member</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preference Level</label>
            <select
              value={formData.preference}
              onChange={(e) => setFormData({ ...formData, preference: e.target.value as PreferenceLevel })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="unavailable">Unavailable</option>
              <option value="not_preferred">Not Preferred</option>
              <option value="neutral">Neutral</option>
              <option value="preferred">Preferred</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="School pickup, Medical appointment, etc."
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {constraint ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
