"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Plus, Edit2, Trash2, X, Briefcase } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", duration: 30, price: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.businessId) return;

    // Listen natively to any changes in Services mapped strictly to this tenant
    const q = query(collection(db, "services"), where("businessId", "==", user.businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
    });

    return () => unsubscribe();
  }, [user]);

  const openNewModal = () => {
    setEditingService(null);
    setFormData({ name: "", duration: 30, price: 0, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setFormData({ name: svc.name, duration: svc.duration, price: svc.price, isActive: svc.isActive });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) {
      alert("Developer Error: Your account has no Business ID provisioned! (Please delete this user or register a NEW account so the Cloud Function can create your tenant).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        await updateDoc(doc(db, "services", editingService.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "services"), {
          ...formData,
          businessId: user.businessId, // Critical Security assignment
          createdAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save service", err);
      alert("Error saving service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      await deleteDoc(doc(db, "services", id));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Services</h1>
          <p className="text-slate-500 mt-1">Manage the appointments and packages you offer.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all w-max"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600">No services created yet.</p>
            <p className="text-sm mt-1">Add your first service so customers can start booking!</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{svc.name}</td>
                  <td className="px-6 py-4 text-slate-600">{svc.duration} mins</td>
                  <td className="px-6 py-4 text-slate-600">Rs. {svc.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${svc.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {svc.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(svc)} className="text-blue-600 hover:text-blue-800 p-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(svc.id)} className="text-red-500 hover:text-red-700 p-2 ml-2"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-out Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingService ? "Edit Service" : "New Service"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  placeholder="e.g. Dental Cleaning"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (mins)</label>
                  <input 
                    type="number" 
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (Rs.)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Visible to Public
                  <p className="text-xs text-slate-400 font-normal">If unchecked, customers cannot see or book this.</p>
                </label>
              </div>

              <div className="pt-8 w-full">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-md disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
