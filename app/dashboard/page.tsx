"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Customer = { id: string; name: string };
type Asset = { id: string; name: string; customer_id: string };
type TeamMember = { user_id: string; role: string };
type Evidence = { id: string; file_url: string; type: string };
type WorkOrder = { 
  id: string; 
  description: string; 
  status: string; 
  customer: { name: string };
  asset?: { name: string };
  assigned_to?: string;
  evidences?: Evidence[];
};

export default function DashboardHome() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  
  // NUEVO: Estado para controlar qué imagen se está viendo en pantalla completa
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: tenantData } = await supabase.from("tenants").select("id").single();
    if (tenantData) {
      setTenantId(tenantData.id);
      
      const { data: customersData } = await supabase.from("customers").select("id, name");
      if (customersData) setCustomers(customersData);

      const { data: assetsData } = await supabase.from("assets").select("id, name, customer_id");
      if (assetsData) setAssets(assetsData);

      const { data: teamData } = await supabase.from("tenant_users").select("user_id, role").eq("tenant_id", tenantData.id);
      if (teamData) setTeamMembers(teamData);

      const { data: ordersData } = await supabase
        .from("work_orders")
        .select(`id, description, status, assigned_to, customer:customers(name), asset:assets(name), evidences:work_order_evidences(id, file_url, type)`)
        .order("created_at", { ascending: false });
        
      if (ordersData) setWorkOrders(ordersData as any);
    }
    setLoading(false);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !selectedCustomerId || !description) return;

    setLoading(true);
    const { error } = await supabase.from("work_orders").insert([{
      tenant_id: tenantId, customer_id: selectedCustomerId, asset_id: selectedAssetId || null,
      assigned_to: selectedAssignee || null, description: description, status: "pending"
    }]);

    if (!error) {
      setDescription(""); setSelectedCustomerId(""); setSelectedAssetId(""); setSelectedAssignee(""); fetchInitialData();
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("work_orders").update({ status: newStatus }).eq("id", orderId);
    if (!error) fetchInitialData();
  };

  const handleUploadEvidence = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOrderId(orderId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('evidences').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('evidences').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('work_order_evidences').insert([{ work_order_id: orderId, file_url: publicUrl, type: type }]);
      if (dbError) throw dbError;

      fetchInitialData();
    } catch (error) {
      console.error(error); alert("Hubo un problema al subir la foto.");
    } finally {
      setUploadingOrderId(null);
    }
  };

  const filteredAssets = assets.filter(a => a.customer_id === selectedCustomerId);

  return (
    <div id="dashboard-main">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Centro de Control</h1>
      <p className="text-slate-500 mb-8">Monitoreo de operación en tiempo real.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8">
            <h2 className="text-lg font-bold mb-4">Nueva Orden (OT)</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={selectedCustomerId} onChange={(e) => { setSelectedCustomerId(e.target.value); setSelectedAssetId(""); }} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Selecciona un cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo a Reparar</label>
                <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} disabled={!selectedCustomerId || filteredAssets.length === 0} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400">
                  <option value="">{!selectedCustomerId ? "Primero selecciona cliente" : filteredAssets.length === 0 ? "Sin equipos" : "Selecciona equipo..."}</option>
                  {filteredAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                <select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Sin asignar</option>
                  {teamMembers.map(member => <option key={member.user_id} value={member.user_id}>{member.user_id === currentUserId ? "🙋‍♂️ Yo (Coordinador)" : `👷‍♂️ Técnico (${member.user_id.split('-')[0]})`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" required />
              </div>
              <button type="submit" disabled={loading || !tenantId} className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50">
                {loading ? "Procesando..." : "Asignar Trabajo"}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold">Registro Operativo</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {workOrders.map((order) => (
                <div key={order.id} className="px-6 py-6 hover:bg-slate-50 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {order.status === 'pending' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">Pendiente</span>}
                        {order.status === 'in_progress' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">En Progreso</span>}
                        {order.status === 'completed' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">Completado</span>}
                        <span className="text-xs text-slate-400 font-mono">#{order.id.split('-')[0]}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{order.customer?.name}</h3>
                      {order.asset && <p className="text-sm font-medium text-blue-600 flex items-center gap-1 mb-1">⚙️ {order.asset.name}</p>}
                      <p className="text-sm text-slate-600 mb-2">{order.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order.id, 'in_progress')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg">Iniciar Trabajo</button>}
                      {order.status === 'in_progress' && <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg">Marcar Listo</button>}
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm font-bold text-slate-700 mb-3">📸 Registro Fotográfico</p>
                    
                    {order.evidences && order.evidences.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {order.evidences.map(ev => (
                          // NUEVO: Agregamos onClick y estilos de hover a la miniatura
                          <div 
                            key={ev.id} 
                            onClick={() => setPreviewImage(ev.file_url)}
                            className="relative group rounded-md overflow-hidden border border-slate-300 w-20 h-20 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          >
                            <img src={ev.file_url} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-medium uppercase">
                              {ev.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.status !== 'completed' && (
                      <div className="flex gap-3">
                        <label className={`cursor-pointer text-xs font-bold py-1.5 px-3 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors ${uploadingOrderId === order.id ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingOrderId === order.id ? 'Subiendo...' : '📷 Foto Antes'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadEvidence(order.id, e, 'antes')} />
                        </label>
                        <label className={`cursor-pointer text-xs font-bold py-1.5 px-3 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors ${uploadingOrderId === order.id ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingOrderId === order.id ? 'Subiendo...' : '📷 Foto Después'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadEvidence(order.id, e, 'despues')} />
                        </label>
                      </div>
                    )}
                  </div>

                </div>
              ))}
              {workOrders.length === 0 && !loading && <div className="px-6 py-12 text-center text-slate-500">No hay órdenes de trabajo registradas.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* NUEVO: Modal de Pantalla Completa para la Imagen */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full flex justify-center animate-fade-in">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-sm bg-slate-800 px-3 py-1 rounded-md"
              onClick={() => setPreviewImage(null)}
            >
              ✕ Cerrar
            </button>
            <img 
              src={previewImage} 
              alt="Evidencia ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}