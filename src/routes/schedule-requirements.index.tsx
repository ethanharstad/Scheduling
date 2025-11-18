import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Calendar, ClipboardList, ChevronDown, ChevronRight, Clock, Briefcase, AlertCircle, Users } from 'lucide-react';
import type { ScheduleRequirement } from '../types/ScheduleRequirement';
import type { StaffSlot } from '../types/StaffSlot';
import type { StaffConstraint, PreferenceLevel } from '../types/StaffConstraint';

type StaffSlotWithId = StaffSlot & {
  id: string;
  scheduleRequirementId: string;
};

type StaffConstraintWithIds = StaffConstraint & {
  id: string;
  staffMemberId: string;
  staffMemberName?: string;
};

export const Route = createFileRoute('/schedule-requirements/')({
  component: ScheduleRequirementManagement,
});

function ScheduleRequirementManagement() {
  const [requirements, setRequirements] = useState<ScheduleRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<ScheduleRequirement | null>(null);
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());
  const [staffSlots, setStaffSlots] = useState<Record<string, StaffSlotWithId[]>>({});
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<StaffSlotWithId | null>(null);
  const [currentRequirementId, setCurrentRequirementId] = useState<string | null>(null);
  const [overlappingConstraints, setOverlappingConstraints] = useState<Record<string, StaffConstraintWithIds[]>>({});

  useEffect(() => {
    loadRequirements();
  }, []);

  async function loadRequirements() {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule-requirements');
      if (!response.ok) {
        throw new Error('Failed to load schedule requirements');
      }
      const data = await response.json();
      // Convert date strings back to Date objects
      const requirementsWithDates = data.map((r: any) => ({
        ...r,
        scheduleStart: new Date(r.scheduleStart),
        scheduleEnd: new Date(r.scheduleEnd),
        staffSlots: r.staffSlots.map((slot: any) => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        })),
      }));
      setRequirements(requirementsWithDates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule requirements');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
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

      await loadRequirements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule requirement');
    }
  }

  function handleEdit(requirement: ScheduleRequirement) {
    setEditingRequirement(requirement);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingRequirement(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRequirement(null);
  }

  async function handleFormSuccess() {
    closeForm();
    await loadRequirements();
  }

  async function loadStaffSlotsForRequirement(requirementId: string) {
    try {
      const response = await fetch('/api/staff-slots');
      if (!response.ok) throw new Error('Failed to load staff slots');
      const data = await response.json();
      const slotsWithDates = data
        .filter((s: any) => s.scheduleRequirementId === requirementId)
        .map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }));
      setStaffSlots(prev => ({ ...prev, [requirementId]: slotsWithDates }));
    } catch (err) {
      console.error('Error loading staff slots:', err);
    }
  }

  function toggleRequirement(requirementId: string) {
    const newExpanded = new Set(expandedRequirements);
    if (newExpanded.has(requirementId)) {
      newExpanded.delete(requirementId);
    } else {
      newExpanded.add(requirementId);
      if (!staffSlots[requirementId]) {
        loadStaffSlotsForRequirement(requirementId);
      }
    }
    setExpandedRequirements(newExpanded);
  }

  function handleAddSlot(requirementId: string) {
    setCurrentRequirementId(requirementId);
    setEditingSlot(null);
    setShowSlotForm(true);
  }

  function handleEditSlot(slot: StaffSlotWithId) {
    setCurrentRequirementId(slot.scheduleRequirementId);
    setEditingSlot(slot);
    setShowSlotForm(true);
  }

  async function handleDeleteSlot(slotId: string, requirementId: string) {
    if (!confirm('Are you sure you want to delete this staff slot?')) return;
    try {
      const response = await fetch(`/api/staff-slots/${slotId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete staff slot');
      await loadStaffSlotsForRequirement(requirementId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff slot');
    }
  }

  async function handleSlotFormSuccess() {
    setShowSlotForm(false);
    setEditingSlot(null);
    if (currentRequirementId) {
      await loadStaffSlotsForRequirement(currentRequirementId);
    }
    setCurrentRequirementId(null);
  }

  async function loadOverlappingConstraintsForRequirement(requirementId: string) {
    try {
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) return;

      const [constraintsRes, staffRes] = await Promise.all([
        fetch('/api/staff-constraints'),
        fetch('/api/staff')
      ]);

      if (!constraintsRes.ok || !staffRes.ok) {
        throw new Error('Failed to load data');
      }

      const constraints = await constraintsRes.json();
      const staffMembers = await staffRes.json();

      // Create a map of staff IDs to names
      const staffMap = new Map(staffMembers.map((s: any) => [s.id, s.name]));

      // Filter constraints that overlap with the requirement's time range
      const overlapping = constraints
        .filter((c: any) => {
          const constraintStart = new Date(c.startTime);
          const constraintEnd = new Date(c.endTime);
          return constraintStart < requirement.scheduleEnd && constraintEnd > requirement.scheduleStart;
        })
        .map((c: any) => ({
          ...c,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
          staffMemberName: staffMap.get(c.staffMemberId) || 'Unknown'
        }));

      setOverlappingConstraints(prev => ({ ...prev, [requirementId]: overlapping }));
    } catch (err) {
      console.error('Error loading overlapping constraints:', err);
    }
  }

  function toggleRequirementWithConstraints(requirementId: string) {
    const newExpanded = new Set(expandedRequirements);
    if (newExpanded.has(requirementId)) {
      newExpanded.delete(requirementId);
    } else {
      newExpanded.add(requirementId);
      if (!staffSlots[requirementId]) {
        loadStaffSlotsForRequirement(requirementId);
      }
      if (!overlappingConstraints[requirementId]) {
        loadOverlappingConstraintsForRequirement(requirementId);
      }
    }
    setExpandedRequirements(newExpanded);
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
          <h1 className="text-4xl font-bold text-white">Schedule Requirements</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Requirement
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {requirements.map((requirement) => {
            const isExpanded = expandedRequirements.has(requirement.id);
            const slots = staffSlots[requirement.id] || [];
            const constraints = overlappingConstraints[requirement.id] || [];

            return (
              <div
                key={requirement.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRequirementWithConstraints(requirement.id)}
                        className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <h3 className="text-xl font-semibold text-white">
                        {requirement.name || requirement.id}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm ml-9 mt-1">
                      <Calendar className="w-4 h-4" />
                      {requirement.scheduleStart.toLocaleDateString()} - {requirement.scheduleEnd.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddSlot(requirement.id)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      title="Add Staff Slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(requirement)}
                      className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                      title="Edit Requirement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(requirement.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Requirement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm ml-9">
                  <div className="flex items-center gap-2 text-gray-400">
                    <ClipboardList className="w-4 h-4" />
                    Staff Slots: {slots.length}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    Overlapping Constraints: {constraints.length}
                  </div>
                  {requirement.metadata?.description && (
                    <div className="text-gray-400">
                      {requirement.metadata.description}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-9 space-y-3">
                    {slots.length === 0 ? (
                      <div className="text-gray-500 text-sm italic py-4">
                        No staff slots yet. Click the + button above to add one.
                      </div>
                    ) : (
                      slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 hover:border-cyan-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-2">{slot.name}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {slot.startTime.toLocaleString()} - {slot.endTime.toLocaleString()}
                                </div>
                                <div className="flex items-start gap-2 text-gray-400">
                                  <Briefcase className="w-3 h-3 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {slot.requiredQualifications.map((qual, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs"
                                      >
                                        {qual}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEditSlot(slot)}
                                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                                title="Edit Slot"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id, requirement.id)}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    <div className="pt-4 mt-4 border-t border-slate-600">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Staff Constraints During This Period
                      </h4>
                      {constraints.length === 0 ? (
                        <div className="text-gray-500 text-sm italic py-2">
                          No staff constraints overlap with this schedule requirement.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {constraints.map((constraint) => (
                            <div
                              key={constraint.id}
                              className={`border rounded-lg p-3 ${getPreferenceColor(constraint.preference)}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span className="font-medium text-sm">{constraint.staffMemberName}</span>
                                    <span className="text-xs capitalize">({constraint.preference.replace('_', ' ')})</span>
                                  </div>
                                  <div className="text-xs space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3" />
                                      {constraint.startTime.toLocaleString()} - {constraint.endTime.toLocaleString()}
                                    </div>
                                    {constraint.reason && (
                                      <div className="italic">Reason: {constraint.reason}</div>
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
                )}
              </div>
            );
          })}
        </div>

        {requirements.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No schedule requirements found. Click "Add Requirement" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <RequirementFormModal
          requirement={editingRequirement}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showSlotForm && (
        <SlotFormModal
          slot={editingSlot}
          requirementId={currentRequirementId}
          onClose={() => {
            setShowSlotForm(false);
            setEditingSlot(null);
            setCurrentRequirementId(null);
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
    id: requirement?.id || '',
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
        id: formData.id,
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
              ID
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              disabled={!!requirement}
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

interface SlotFormModalProps {
  slot: StaffSlotWithId | null;
  requirementId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function SlotFormModal({ slot, requirementId, onClose, onSuccess }: SlotFormModalProps) {
  const [formData, setFormData] = useState({
    id: slot?.id || '',
    scheduleRequirementId: slot?.scheduleRequirementId || requirementId || '',
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
              disabled={!slot && !!requirementId}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="schedule-requirement-id"
            />
            {!slot && requirementId && (
              <p className="text-xs text-gray-400 mt-1">Auto-filled from current requirement</p>
            )}
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
