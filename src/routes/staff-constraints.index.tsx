import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Clock, User } from 'lucide-react';
import type { StaffConstraint, PreferenceLevel } from '../types/StaffConstraint';

type StaffConstraintWithIds = StaffConstraint & { id: string; staffMemberId: string };

export const Route = createFileRoute('/staff-constraints/')({
  component: StaffConstraintManagement,
});

function StaffConstraintManagement() {
  const [constraints, setConstraints] = useState<StaffConstraintWithIds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<StaffConstraintWithIds | null>(null);

  useEffect(() => {
    loadConstraints();
  }, []);

  async function loadConstraints() {
    try {
      setLoading(true);
      const response = await fetch('/api/staff-constraints');
      if (!response.ok) {
        throw new Error('Failed to load staff constraints');
      }
      const data = await response.json();
      const constraintsWithDates = data.map((c: any) => ({
        ...c,
        startTime: new Date(c.startTime),
        endTime: new Date(c.endTime),
      }));
      setConstraints(constraintsWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff constraints');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff constraint?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff-constraints/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff constraint');
      }

      await loadConstraints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff constraint');
    }
  }

  function handleEdit(constraint: StaffConstraintWithIds) {
    setEditingConstraint(constraint);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingConstraint(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingConstraint(null);
  }

  async function handleFormSuccess() {
    closeForm();
    await loadConstraints();
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
          <h1 className="text-4xl font-bold text-white">Staff Constraints</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Constraint
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {constraints.map((constraint) => (
            <div
              key={constraint.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-2 ${getPreferenceColor(constraint.preference)}`}>
                    {constraint.preference.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <User className="w-4 h-4" />
                    Staff: {constraint.staffMemberId}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(constraint)}
                    className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(constraint.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  {constraint.startTime.toLocaleString()} - {constraint.endTime.toLocaleString()}
                </div>
                {constraint.reason && (
                  <div className="text-gray-400 italic">
                    "{constraint.reason}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {constraints.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No staff constraints found. Click "Add Constraint" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <ConstraintFormModal
          constraint={editingConstraint}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

interface ConstraintFormModalProps {
  constraint: StaffConstraintWithIds | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ConstraintFormModal({ constraint, onClose, onSuccess }: ConstraintFormModalProps) {
  const [formData, setFormData] = useState({
    id: constraint?.id || '',
    staffMemberId: constraint?.staffMemberId || '',
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
        headers: {
          'Content-Type': 'application/json',
        },
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
              disabled={!!constraint}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="unique-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staff Member ID
            </label>
            <input
              type="text"
              value={formData.staffMemberId}
              onChange={(e) => setFormData({ ...formData, staffMemberId: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="staff-member-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preference Level
            </label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (optional)
            </label>
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
