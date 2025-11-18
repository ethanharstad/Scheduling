import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Calendar } from 'lucide-react';
import type { Schedule } from '../types/Schedule';

export const Route = createFileRoute('/schedules/')({
  component: ScheduleManagement,
});

function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      setLoading(true);
      const response = await fetch('/api/schedules');
      if (!response.ok) {
        throw new Error('Failed to load schedules');
      }
      const data = await response.json();
      // Convert date strings back to Date objects
      const schedulesWithDates = data.map((s: any) => ({
        ...s,
        scheduleStart: new Date(s.scheduleStart),
        scheduleEnd: new Date(s.scheduleEnd),
        assignments: s.assignments.map((a: any) => ({
          ...a,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
        })),
      }));
      setSchedules(schedulesWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    }
  }

  function handleEdit(schedule: Schedule) {
    setEditingSchedule(schedule);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingSchedule(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSchedule(null);
  }

  async function handleFormSuccess() {
    closeForm();
    await loadSchedules();
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
          <h1 className="text-4xl font-bold text-white">Schedule Management</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Schedule
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {schedule.name || schedule.id}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {schedule.scheduleStart.toLocaleDateString()} - {schedule.scheduleEnd.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-gray-400">
                  Assignments: {schedule.assignments.length}
                </div>
                <div className="text-gray-400">
                  Unfilled Slots: {schedule.unfilledSlots.length}
                </div>
                {schedule.metadata?.algorithm && (
                  <div className="text-gray-400">
                    Algorithm: {schedule.metadata.algorithm}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No schedules found. Click "Add Schedule" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <ScheduleFormModal
          schedule={editingSchedule}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

interface ScheduleFormModalProps {
  schedule: Schedule | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ScheduleFormModal({ schedule, onClose, onSuccess }: ScheduleFormModalProps) {
  const [formData, setFormData] = useState({
    id: schedule?.id || '',
    name: schedule?.name || '',
    scheduleStart: schedule?.scheduleStart
      ? schedule.scheduleStart.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    scheduleEnd: schedule?.scheduleEnd
      ? schedule.scheduleEnd.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
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
        name: formData.name || undefined,
        scheduleStart: formData.scheduleStart,
        scheduleEnd: formData.scheduleEnd,
        assignments: schedule?.assignments || [],
        unfilledSlots: schedule?.unfilledSlots || [],
        sourceRequirement: schedule?.sourceRequirement,
        metadata: schedule?.metadata,
      };

      const url = schedule ? `/api/schedules/${schedule.id}` : '/api/schedules';
      const method = schedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {schedule ? 'Edit Schedule' : 'Add Schedule'}
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
              disabled={!!schedule}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="unique-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Week of Nov 13-19"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule Start
            </label>
            <input
              type="date"
              value={formData.scheduleStart}
              onChange={(e) =>
                setFormData({ ...formData, scheduleStart: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule End
            </label>
            <input
              type="date"
              value={formData.scheduleEnd}
              onChange={(e) =>
                setFormData({ ...formData, scheduleEnd: e.target.value })
              }
              required
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
                  {schedule ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
