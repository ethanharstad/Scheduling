import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Clock, Briefcase } from 'lucide-react';

type StaffSlotWithId = {
  id: string;
  scheduleRequirementId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  requiredQualifications: string[];
};

export const Route = createFileRoute('/staff-slots/')({
  component: StaffSlotManagement,
});

function StaffSlotManagement() {
  const [slots, setSlots] = useState<StaffSlotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<StaffSlotWithId | null>(null);

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    try {
      setLoading(true);
      const response = await fetch('/api/staff-slots');
      if (!response.ok) throw new Error('Failed to load staff slots');
      const data = await response.json();
      const slotsWithDates = data.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));
      setSlots(slotsWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff slots');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff slot?')) return;
    try {
      const response = await fetch(`/api/staff-slots/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete staff slot');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff slot');
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
          <h1 className="text-4xl font-bold text-white">Staff Slots</h1>
          <button
            onClick={() => { setEditingSlot(null); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Slot
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{slot.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {slot.startTime.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingSlot(slot); setShowForm(true); }}
                    className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-gray-400">
                  To: {slot.endTime.toLocaleString()}
                </div>
                <div>
                  <div className="text-gray-400 mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Required Qualifications:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.requiredQualifications.map((qual, idx) => (
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
            </div>
          ))}
        </div>

        {slots.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No staff slots found. Click "Add Slot" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <SlotFormModal
          slot={editingSlot}
          onClose={() => { setShowForm(false); setEditingSlot(null); }}
          onSuccess={async () => { setShowForm(false); setEditingSlot(null); await loadSlots(); }}
        />
      )}
    </div>
  );
}

function SlotFormModal({ slot, onClose, onSuccess }: { slot: StaffSlotWithId | null; onClose: () => void; onSuccess: () => void; }) {
  const [formData, setFormData] = useState({
    id: slot?.id || '',
    scheduleRequirementId: slot?.scheduleRequirementId || '',
    name: slot?.name || '',
    startTime: slot?.startTime
      ? new Date(slot.startTime.getTime() - slot.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endTime: slot?.endTime
      ? new Date(slot.endTime.getTime() - slot.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    requiredQualifications: slot?.requiredQualifications.join(', ') || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const qualificationsArray = formData.requiredQualifications
        .split(',')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const payload = {
        id: formData.id,
        scheduleRequirementId: formData.scheduleRequirementId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        requiredQualifications: qualificationsArray,
      };

      const url = slot ? `/api/staff-slots/${slot.id}` : '/api/staff-slots';
      const method = slot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff slot');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff slot');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {slot ? 'Edit Staff Slot' : 'Add Staff Slot'}
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
              disabled={!!slot}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="unique-id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Morning Shift"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Required Qualifications (comma-separated)</label>
            <input
              type="text"
              value={formData.requiredQualifications}
              onChange={(e) => setFormData({ ...formData, requiredQualifications: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="RN, BLS, ACLS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Requirement ID</label>
            <input
              type="text"
              value={formData.scheduleRequirementId}
              onChange={(e) => setFormData({ ...formData, scheduleRequirementId: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="schedule-requirement-id"
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
                  {slot ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
