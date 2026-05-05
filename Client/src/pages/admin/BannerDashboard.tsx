import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Image,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  GripVertical,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";

const API = "http://localhost:3000/api/banners";
const UPLOAD_API = "http://localhost:3000/api/uploads";

interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const EMPTY_FORM = { title: "", imageUrl: "", link: "", isActive: true, sortOrder: 0 };

const BannerDashboard = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      const res = await axios.get<Banner[]>(API);
      setBanners(res.data);
    } catch {
      setError("Không thể tải danh sách banner.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreviewUrl("");
    setError("");
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner._id);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setPreviewUrl(banner.imageUrl);
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreviewUrl("");
    setError("");
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const res = await axios.post<{ url: string }>(UPLOAD_API, {
          dataUrl,
          fileName: file.name,
        });
        setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
        setPreviewUrl(res.data.url);
      } catch {
        setError("Upload ảnh thất bại.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Vui lòng nhập tiêu đề banner."); return; }
    if (!form.imageUrl.trim()) { setError("Vui lòng chọn ảnh banner."); return; }
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, form);
      } else {
        await axios.post(API, form);
      }
      await fetchBanners();
      closeModal();
    } catch {
      setError("Lưu banner thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await axios.put(`${API}/${banner._id}`, { ...banner, isActive: !banner.isActive });
      await fetchBanners();
    } catch {
      setError("Cập nhật trạng thái thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/${deleteId}`);
      await fetchBanners();
    } catch {
      setError("Xóa banner thất bại.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Image className="text-blue-600" size={30} />
            Quản lý Banner
          </h1>
          <p className="text-slate-500 mt-1">Thêm, chỉnh sửa và sắp xếp banner hiển thị trang chủ.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all text-sm"
        >
          <Plus size={18} /> Thêm Banner
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Banner Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="bg-slate-100 p-5 rounded-full mb-4">
            <Image className="text-slate-400" size={36} />
          </div>
          <p className="text-slate-600 font-semibold text-lg">Chưa có banner nào</p>
          <p className="text-slate-400 text-sm mt-1">Nhấn "Thêm Banner" để tạo banner đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {banners.map((banner, idx) => (
            <div
              key={banner._id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                banner.isActive ? "border-slate-100" : "border-slate-200 opacity-60"
              }`}
            >
              {/* Image */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x200?text=Banner";
                  }}
                />
                {/* Sort badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  <GripVertical size={12} /> #{idx + 1}
                </div>
                {/* Active badge */}
                <div
                  className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-lg ${
                    banner.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-400 text-white"
                  }`}
                >
                  {banner.isActive ? "Đang hiển thị" : "Đã ẩn"}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-base truncate mb-1">{banner.title}</h3>
                {banner.link && (
                  <p className="text-xs text-blue-500 flex items-center gap-1 truncate mb-3">
                    <LinkIcon size={11} />
                    {banner.link}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      banner.isActive
                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    {banner.isActive ? (
                      <><ToggleRight size={15} /> Ẩn</>
                    ) : (
                      <><ToggleLeft size={15} /> Hiện</>
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                  <button
                    onClick={() => setDeleteId(banner._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all ml-auto"
                  >
                    <Trash2 size={13} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editId ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tiêu đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề banner..."
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Ảnh Banner <span className="text-rose-500">*</span>
                </label>
                {previewUrl && (
                  <div className="relative mb-2 rounded-xl overflow-hidden h-36 bg-slate-100">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPreviewUrl(""); setForm((p) => ({ ...p, imageUrl: "" })); }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageFile(file);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Đang upload...
                    </div>
                  ) : (
                    <>
                      <Image className="mx-auto text-slate-400 mb-2" size={28} />
                      <p className="text-sm text-slate-500">Kéo thả hoặc <span className="text-blue-600 font-semibold">chọn ảnh</span></p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP tối đa 10MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Liên kết (tuỳ chọn)
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                  <span className="px-3 text-slate-400"><LinkIcon size={15} /></span>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.link}
                    onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                    className="flex-1 py-2.5 pr-4 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Sort order + Active */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thứ tự</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
                  <button
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      form.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {form.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {form.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {editId ? "Cập nhật" : "Tạo Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="bg-rose-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-rose-600" size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xóa Banner?</h3>
            <p className="text-slate-500 text-sm mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerDashboard;
