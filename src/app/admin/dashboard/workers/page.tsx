'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUser, FiPhone, FiMail, FiLock, FiShield, FiUserCheck, FiToggleLeft, FiToggleRight, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Worker {
  _id: string;
  name: string;
  phone: string;
  email: string;
  pageAccess: string[];
  isActive: boolean;
  createdAt: string;
}

const ALL_PAGES = [
  { key: 'invoices', label: 'الفواتير', icon: '🧾' },
  { key: 'products', label: 'المنتجات', icon: '📦' },
  { key: 'orders', label: 'الطلبات', icon: '🛒' },
  { key: 'customers', label: 'العملاء', icon: '👥' },
  { key: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

const emptyForm = { name: '', phone: '', email: '', password: '', pageAccess: [] as string[], isActive: true };

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

  const fetchWorkers = () => {
    fetch('/api/workers').then(r => r.json()).then(data => { setWorkers(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchWorkers(); }, []);

  const openCreate = () => {
    setEditingWorker(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingWorker(w);
    setForm({ name: w.name, phone: w.phone, email: w.email, password: '', pageAccess: w.pageAccess, isActive: w.isActive });
    setModalOpen(true);
  };

  const togglePage = (key: string) => {
    setForm(f => ({
      ...f,
      pageAccess: f.pageAccess.includes(key) ? f.pageAccess.filter(p => p !== key) : [...f.pageAccess, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (!editingWorker && !form.password.trim()) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }
    setSaving(true);
    try {
      const url = editingWorker ? `/api/workers/${editingWorker._id}` : '/api/workers';
      const method = editingWorker ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingWorker ? 'تم تحديث الموظف' : 'تم إضافة الموظف بنجاح');
        setModalOpen(false);
        fetchWorkers();
      } else {
        toast.error(data.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('تم حذف الموظف'); fetchWorkers(); }
    else toast.error('فشل الحذف');
  };

  const markAttendance = async (worker: Worker) => {
    setMarkingAttendance(worker._id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: worker._id, method: 'manual' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ تم تسجيل حضور ${worker.name}`);
      } else {
        toast.error(data.error || 'فشل تسجيل الحضور');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setMarkingAttendance(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers.length} موظف مسجل</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5B7B6D] text-white rounded-xl text-sm font-semibold hover:bg-[#4a6a5c] transition-all shadow-lg shadow-[#5B7B6D]/25 active:scale-95"
        >
          <FiPlus size={18} />
          إضافة موظف
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FiUserCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{workers.filter(w => w.isActive).length}</p>
              <p className="text-xs text-gray-500">موظف نشط</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <FiUser size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{workers.filter(w => !w.isActive).length}</p>
              <p className="text-xs text-gray-500">موظف غير نشط</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiShield size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{workers.length}</p>
              <p className="text-xs text-gray-500">إجمالي الموظفين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      {workers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">لا يوجد موظفون بعد</p>
          <p className="text-gray-300 text-sm mt-1">اضغط على "إضافة موظف" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div key={worker._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#5B7B6D] to-[#4a6a5c] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{worker.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold">{worker.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${worker.isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-gray-400/30 text-gray-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${worker.isActive ? 'bg-emerald-300' : 'bg-gray-400'}`} />
                        {worker.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(worker)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                      title="تعديل"
                    >
                      <FiEdit2 size={14} className="text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(worker._id)}
                      className="w-8 h-8 bg-red-400/30 hover:bg-red-400/50 rounded-lg flex items-center justify-center transition-colors"
                      title="حذف"
                    >
                      <FiTrash2 size={14} className="text-red-200" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiPhone size={14} className="text-gray-400 flex-shrink-0" />
                    <span dir="ltr">{worker.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMail size={14} className="text-gray-400 flex-shrink-0" />
                    <span dir="ltr" className="truncate">{worker.email}</span>
                  </div>
                </div>

                {/* Page Access Badges */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium">صلاحيات الوصول</p>
                  <div className="flex flex-wrap gap-1">
                    {(worker.pageAccess || []).length === 0 ? (
                      <span className="text-xs text-gray-300 italic">لا توجد صلاحيات</span>
                    ) : (
                      (worker.pageAccess || []).map(p => {
                        const page = ALL_PAGES.find(pg => pg.key === p);
                        return (
                          <span key={p} className="text-xs bg-[#5B7B6D]/10 text-[#5B7B6D] px-2 py-0.5 rounded-lg font-medium">
                            {page?.icon} {page?.label}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Mark Attendance Button */}
                <button
                  onClick={() => markAttendance(worker)}
                  disabled={markingAttendance === worker._id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 border border-emerald-100"
                >
                  {markingAttendance === worker._id ? (
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  ) : (
                    <FiCheckCircle size={16} />
                  )}
                  تسجيل الحضور يدوياً
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{editingWorker ? 'تعديل الموظف' : 'إضافة موظف جديد'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingWorker ? 'تحديث بيانات الموظف' : 'أدخل بيانات الموظف الجديد'}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                <FiX size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <FiUser size={13} className="inline ml-1" />
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="اسم الموظف"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <FiPhone size={13} className="inline ml-1" />
                  رقم الجوال *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <FiMail size={13} className="inline ml-1" />
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="worker@areej.com"
                  dir="ltr"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <FiLock size={13} className="inline ml-1" />
                  كلمة المرور {editingWorker && <span className="text-gray-400 font-normal">(اتركها فارغة للإبقاء على الحالية)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Page Access */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FiShield size={13} className="inline ml-1" />
                  صلاحيات الوصول للصفحات
                </label>
                <div className="space-y-2">
                  {ALL_PAGES.map(page => (
                    <button
                      key={page.key}
                      type="button"
                      onClick={() => togglePage(page.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.pageAccess.includes(page.key)
                          ? 'border-[#5B7B6D] bg-[#5B7B6D]/5 text-[#5B7B6D]'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{page.icon}</span>
                        <span>{page.label}</span>
                      </span>
                      <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        form.pageAccess.includes(page.key) ? 'border-[#5B7B6D] bg-[#5B7B6D]' : 'border-gray-300'
                      }`}>
                        {form.pageAccess.includes(page.key) && <FiCheck size={12} className="text-white" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-700">حالة الموظف</p>
                  <p className="text-xs text-gray-400 mt-0.5">{form.isActive ? 'الموظف نشط ويمكنه تسجيل الدخول' : 'الموظف غير نشط'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
                >
                  {form.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                  {form.isActive ? 'نشط' : 'غير نشط'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center gap-3 rounded-b-2xl">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#5B7B6D] text-white rounded-xl font-semibold text-sm hover:bg-[#4a6a5c] transition-all disabled:opacity-50 shadow-lg shadow-[#5B7B6D]/25"
              >
                {saving ? 'جاري الحفظ...' : editingWorker ? 'حفظ التغييرات' : 'إضافة الموظف'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
