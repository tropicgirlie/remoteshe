import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Heart, Baby, Users, Brain, Shield, Leaf } from "lucide-react";
import { perksAPI, companiesAPI } from "../../lib/api";
import { Perk, Company } from "../../lib/types";
import { toast } from "sonner";

const PERK_TYPES = [
  { value: 'Egg Freezing', label: 'Egg Freezing', icon: Heart, color: 'pink', category: 'FERTILITY' },
  { value: 'Menopause Support', label: 'Menopause Support', icon: Users, color: 'orange', category: 'WELLNESS' },
  { value: 'Miscarriage Leave', label: 'Miscarriage Leave', icon: Heart, color: 'blue', category: 'FAMILY' },
  { value: 'Childcare Stipend', label: 'Childcare Stipend', icon: Baby, color: 'green', category: 'FAMILY' },
  { value: 'Returnship Programs', label: 'Returnship Programs', icon: Brain, color: 'purple', category: 'CAREER' },
  { value: 'Lactation Support', label: 'Lactation Support', icon: Heart, color: 'pink', category: 'FERTILITY' },
  { value: 'Mental Health Coverage', label: 'Mental Health Coverage', icon: Shield, color: 'blue', category: 'WELLNESS' },
  { value: 'Family Planning', label: 'Family Planning', icon: Leaf, color: 'green', category: 'FAMILY' },
  { value: 'Adoption Assistance', label: 'Adoption Assistance', icon: Baby, color: 'purple', category: 'FAMILY' },
  { value: 'Parental Leave Coaching', label: 'Parental Leave Coaching', icon: Brain, color: 'orange', category: 'CAREER' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-500', border: 'border-pink-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-200' },
  orange: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-200' },
};

function PerkCard({ perk, companyName, onEdit, onDelete }: {
  perk: Perk;
  companyName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const perkDef = PERK_TYPES.find(p => p.value === perk.perk_type) || PERK_TYPES[0];
  const Icon = perkDef.icon;
  const colors = COLOR_MAP[perkDef.color];
  return (
    <div className={`border rounded-xl p-4 ${colors.bg} ${colors.border} relative group`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>
          {perkDef.category}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/60 transition-colors">
            <Pencil className={`w-3 h-3 ${colors.icon}`} />
          </button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/60 transition-colors">
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
      <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${colors.icon}`} />
      </div>
      <p className={`text-sm font-bold mb-0.5 ${colors.text}`}>{perk.perk_type}</p>
      <p className="text-xs text-gray-500 line-clamp-2">{perk.description || companyName}</p>
      {perk.verified && (
        <div className="mt-2 text-[10px] font-semibold text-green-600">✓ Verified</div>
      )}
    </div>
  );
}

export function AdminPerks() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPerk, setEditingPerk] = useState<Perk | null>(null);
  const [formData, setFormData] = useState({
    company_id: '',
    perk_type: '',
    description: '',
    verified: false,
    source_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [perksData, companiesData] = await Promise.all([
        perksAPI.getAll(),
        companiesAPI.getAll(),
      ]);
      setPerks(perksData);
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load perks");
    } finally {
      setLoading(false);
    }
  };

  const openForm = (perk?: Perk) => {
    if (perk) {
      setEditingPerk(perk);
      setFormData({ company_id: perk.company_id, perk_type: perk.perk_type, description: perk.description || '', verified: perk.verified || false, source_url: perk.source_url || '' });
    } else {
      setEditingPerk(null);
      setFormData({ company_id: '', perk_type: '', description: '', verified: false, source_url: '' });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPerk(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this perk?")) return;
    try {
      await perksAPI.delete(id);
      toast.success("Perk deleted");
      loadData();
    } catch {
      toast.error("Failed to delete perk");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPerk) {
        await perksAPI.update(editingPerk.id, formData);
        toast.success("Perk updated");
      } else {
        await perksAPI.create(formData);
        toast.success("Perk created");
      }
      closeForm();
      loadData();
    } catch {
      toast.error("Failed to save perk");
    } finally {
      setSaving(false);
    }
  };

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || '—';

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perks Registry</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define structured perks that companies can associate with their profiles.</p>
        </div>
        <button
          onClick={() => openForm()}
          disabled={companies.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Perk Category
        </button>
      </div>

      {companies.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Add at least one company before creating perks.
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">{editingPerk ? 'Edit Perk' : 'Add New Perk'}</h2>
            <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Company *</label>
                <select
                  required
                  value={formData.company_id}
                  onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
                >
                  <option value="">Select company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Perk Type *</label>
                <select
                  required
                  value={formData.perk_type}
                  onChange={e => setFormData({ ...formData, perk_type: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
                >
                  <option value="">Select perk type...</option>
                  {PERK_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe this perk..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Source URL</label>
              <input
                type="url"
                value={formData.source_url}
                onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://company.com/benefits"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                className="w-4 h-4 accent-[#5B39C8] rounded"
              />
              <span className="text-sm text-gray-700">Mark as Verified</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-[#5B39C8] text-white text-sm font-bold rounded-lg hover:bg-[#4a2fb0] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Perk'}
              </button>
              <button type="button" onClick={closeForm} className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Perks Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : perks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">No perks yet. Define care benefits for companies!</p>
          {companies.length > 0 && (
            <button
              onClick={() => openForm()}
              className="px-5 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg"
            >
              Add First Perk
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {perks.map(perk => (
            <PerkCard
              key={perk.id}
              perk={perk}
              companyName={getCompanyName(perk.company_id)}
              onEdit={() => openForm(perk)}
              onDelete={() => handleDelete(perk.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
