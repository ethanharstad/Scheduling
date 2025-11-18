import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Clock, User, Calendar } from 'lucide-react';

type StaffAssignmentWithId = {
  id: string;
  scheduleId?: string;
  staffMemberId: string;
  staffSlotId?: string;
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, unknown>;
};

export const Route = createFileRoute('/staff-assignments/')({
  component: StaffAssignmentManagement,
});

function StaffAssignmentManagement() {
  const [assignments, setAssignments] = useState<StaffAssignmentWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StaffAssignmentWithId | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      const response = await fetch('/api/staff-assignments');
      if (!response.ok) throw new Error('Failed to load staff assignments');
      const data = await response.json();
      const assignmentsWithDates = data.map((a: any) => ({
        ...a,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
      }));
      setAssignments(assignmentsWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff assignments');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff assignment?')) return;
    try {
      const response = await fetch(`/api/staff-assignments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete staff assignment');
      await loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff assignment');
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
          <h1 className="text-4xl font-bold text-white">Staff Assignments</h1>
          <button
            onClick={() => { setEditingAssignment(null); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Assignment
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Assignment</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <User className="w-4 h-4" />
                    Staff: {assignment.staffMemberId}
                  </div>
                  {assignment.scheduleId && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      Schedule: {assignment.scheduleId}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingAssignment(assignment); setShowForm(true); }}
                    className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  {assignment.startTime.toLocaleString()}
                </div>
                <div className="text-gray-400">
                  To: {assignment.endTime.toLocaleString()}
                </div>
                {assignment.staffSlotId && (
                  <div className="text-gray-400">
                    Slot: {assignment.staffSlotId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No staff assignments found. Click "Add Assignment" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <AssignmentFormModal
          assignment={editingAssignment}
          onClose={() => { setShowForm(false); setEditingAssignment(null); }}
          onSuccess={async () => { setShowForm(false); setEditingAssignment(null); await loadAssignments(); }}
        />
      )}
    </div>
  );
}

function AssignmentFormModal({ assignment, onClose, onSuccess }: { assignment: StaffAssignmentWithId | null; onClose: () => void; onSuccess: () => void; }) {
  const [formData, setFormData] = useState({
    id: assignment?.id || '',
    scheduleId: assignment?.scheduleId || '',
    staffMemberId: assignment?.staffMemberId || '',
    staffSlotId: assignment?.staffSlotId || '',
    startTime: assignment?.startTime
      ? new Date(assignment.startTime.getTime() - assignment.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endTime: assignment?.endTime
      ? new Date(assignment.endTime.getTime() - assignment.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
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
        scheduleId: formData.scheduleId || undefined,
        staffMemberId: formData.staffMemberId,
        staffSlotId: formData.staffSlotId || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        metadata: assignment?.metadata,
      };

      const url = assignment ? `/api/staff-assignments/${assignment.id}` : '/api/staff-assignments';
      const method = assignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff assignment');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {assignment ? 'Edit Staff Assignment' : 'Add Staff Assignment'}
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
              disabled={!!assignment}
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
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="staff-member-id"
            />
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Schedule ID (optional)</label>
            <input
              type="text"
              value={formData.scheduleId}
              onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Staff Slot ID (optional)</label>
            <input
              type="text"
              value={formData.staffSlotId}
              onChange={(e) => setFormData({ ...formData, staffSlotId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                  {assignment ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
