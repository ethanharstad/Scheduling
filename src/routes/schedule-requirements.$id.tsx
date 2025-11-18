import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, X, Check, Clock, AlertCircle, Calendar, ClipboardList, User } from 'lucide-react';
import type { ScheduleRequirement } from '../types/ScheduleRequirement';
import type { StaffSlot } from '../types/StaffSlot';
import type { StaffConstraint, PreferenceLevel } from '../types/StaffConstraint';

type StaffSlotWithIds = StaffSlot & { id: string; scheduleRequirementId: string };
type StaffConstraintWithIds = StaffConstraint & { id: string; staffMemberId: string };

export const Route = createFileRoute('/schedule-requirements/$id')({
  component: ScheduleRequirementDetail,
});

function ScheduleRequirementDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<ScheduleRequirement | null>(null);
  const [staffSlots, setStaffSlots] = useState<StaffSlotWithIds[]>([]);
  const [overlappingConstraints, setOverlappingConstraints] = useState<(StaffConstraintWithIds & { staffName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<ScheduleRequirement | null>(null);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<StaffSlotWithIds | null>(null);

  useEffect(() => {
    loadRequirement();
    loadStaffSlots();
    loadOverlappingConstraints();
  }, [id]);

  async function loadRequirement() {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule-requirements/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load schedule requirement');
      }
      const data = await response.json();
      setRequirement({
        ...data,
        scheduleStart: new Date(data.scheduleStart),
        scheduleEnd: new Date(data.scheduleEnd),
        staffSlots: [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule requirement');
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffSlots() {
    try {
      const response = await fetch('/api/staff-slots');
      if (!response.ok) throw new Error('Failed to load staff slots');
      const data = await response.json();
      const slotsWithDates = data
        .filter((s: any) => s.scheduleRequirementId === id)
        .map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }));
      setStaffSlots(slotsWithDates);
    } catch (err) {
      console.error('Error loading staff slots:', err);
    }
  }

  async function loadOverlappingConstraints() {
    try {
      const [constraintsResponse, staffResponse] = await Promise.all([
        fetch('/api/staff-constraints'),
        fetch('/api/staff'),
      ]);

      if (!constraintsResponse.ok || !staffResponse.ok) {
        throw new Error('Failed to load constraints or staff');
      }

      const constraints = await constraintsResponse.json();
      const staff = await staffResponse.json();

      const staffMap = new Map(staff.map((s: any) => [s.id, s.name]));

      const requirementData = await fetch(`/api/schedule-requirements/${id}`).then(r => r.json());
      const scheduleStart = new Date(requirementData.scheduleStart);
      const scheduleEnd = new Date(requirementData.scheduleEnd);

      const overlapping = constraints
        .filter((c: any) => {
          const constraintStart = new Date(c.startTime);
          const constraintEnd = new Date(c.endTime);
          return constraintStart < scheduleEnd && scheduleStart < constraintEnd;
        })
        .map((c: any) => ({
          ...c,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
          staffName: staffMap.get(c.staffMemberId) || 'Unknown',
        }));

      setOverlappingConstraints(overlapping);
    } catch (err) {
      console.error('Error loading overlapping constraints:', err);
    }
  }

  async function handleDeleteRequirement() {
    if (!confirm('Are you sure you want to delete this schedule requirement?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedule-requirements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule requirement');
      }

      navigate({ to: '/schedule-requirements' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule requirement');
    }
  }

  function handleEdit() {
    setEditingRequirement(requirement);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRequirement(null);
  }

  async function handleFormSuccess() {
    closeForm();
    await loadRequirement();
  }

  function handleAddSlot() {
    setEditingSlot(null);
    setShowSlotForm(true);
  }

  function handleEditSlot(slot: StaffSlotWithIds) {
    setEditingSlot(slot);
    setShowSlotForm(true);
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Are you sure you want to delete this staff slot?')) return;
    try {
      const response = await fetch(`/api/staff-slots/${slotId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete staff slot');
      await loadStaffSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff slot');
    }
  }

  async function handleSlotFormSuccess() {
    setShowSlotForm(false);
    setEditingSlot(null);
    await loadStaffSlots();
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

  if (!requirement) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Schedule requirement not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate({ to: '/schedule-requirements' })}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Schedule Requirements
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{requirement.name || requirement.id}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-lg">
                <Calendar className="w-5 h-5" />
                <span>
                  {requirement.scheduleStart.toLocaleDateString()} - {requirement.scheduleEnd.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDeleteRequirement}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {requirement.metadata?.description && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">{requirement.metadata.description}</p>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Staff Slots ({staffSlots.length})
            </h2>
            <button
              onClick={handleAddSlot}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </div>

          {staffSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No staff slots yet. Click "Add Slot" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {staffSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border border-slate-600 bg-slate-700/30 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-white mb-2">{slot.name}</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {slot.startTime.toLocaleString()} - {slot.endTime.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Required Qualifications: {slot.requiredQualifications.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                        title="Edit Slot"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Overlapping Staff Constraints ({overlappingConstraints.length})
            </h2>
          </div>

          {overlappingConstraints.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No overlapping staff constraints found.
            </div>
          ) : (
            <div className="space-y-3">
              {overlappingConstraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className={`border rounded-lg p-4 ${getPreferenceColor(constraint.preference)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5" />
                        <span className="font-semibold text-lg">{constraint.staffName}</span>
                        <span className="text-sm opacity-75">•</span>
                        <span className="font-medium capitalize">
                          {constraint.preference.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {constraint.startTime.toLocaleString()} - {constraint.endTime.toLocaleString()}
                        </div>
                        {constraint.reason && (
                          <div className="italic mt-2">
                            Reason: {constraint.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <RequirementFormModal
          requirement={editingRequirement}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showSlotForm && (
        <StaffSlotFormModal
          slot={editingSlot}
          scheduleRequirementId={id}
          onClose={() => {
            setShowSlotForm(false);
            setEditingSlot(null);
          }}
          onSuccess={handleSlotFormSuccess}
        />
      )}
    </div>
  );
}

interface RequirementFormModalProps {
  requirement: ScheduleRequirement | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RequirementFormModal({ requirement, onClose, onSuccess }: RequirementFormModalProps) {
  const [formData, setFormData] = useState({
    name: requirement?.name || '',
    scheduleStart: requirement?.scheduleStart
      ? requirement.scheduleStart.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    scheduleEnd: requirement?.scheduleEnd
      ? requirement.scheduleEnd.toISOString().split('T')[0]
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
        ...(requirement ? { id: requirement.id } : {}),
        name: formData.name || undefined,
        scheduleStart: formData.scheduleStart,
        scheduleEnd: formData.scheduleEnd,
        staffSlots: requirement?.staffSlots || [],
        metadata: requirement?.metadata,
      };

      const url = requirement ? `/api/schedule-requirements/${requirement.id}` : '/api/schedule-requirements';
      const method = requirement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule requirement');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule requirement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {requirement ? 'Edit Schedule Requirement' : 'Add Schedule Requirement'}
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
              Name (optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Holiday Coverage"
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
                  {requirement ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StaffSlotFormModalProps {
  slot: StaffSlotWithIds | null;
  scheduleRequirementId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function StaffSlotFormModal({ slot, scheduleRequirementId, onClose, onSuccess }: StaffSlotFormModalProps) {
  const [formData, setFormData] = useState({
    scheduleRequirementId: slot?.scheduleRequirementId || scheduleRequirementId || '',
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
        ...(slot ? { id: slot.id } : {}),
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Requirement ID</label>
            <input
              type="text"
              value={formData.scheduleRequirementId}
              onChange={(e) => setFormData({ ...formData, scheduleRequirementId: e.target.value })}
              required
              disabled
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="schedule-requirement-id"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-filled from current schedule requirement</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Morning Shift Nurse"
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
