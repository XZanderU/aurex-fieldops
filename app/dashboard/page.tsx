"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Definimos los tipos de TypeScript actualizados
type Customer = { id: string; name: string };
type Asset = { id: string; name: string; customer_id: string };
type WorkOrder = { 
  id: string; 
  description: string; 
  status: string; 
  customer: { name: string };
  asset?: { name: string }; // Agregamos el equipo opcional
};

export default function DashboardHome() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  
  // Estados para el formulario
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: tenantData } = await supabase.from("tenants").select("id").single();
    
    if (tenantData) {
      setTenantId(tenantData.id);
      
      const { data: customersData } = await supabase.from("customers").select("id, name");
      if (customersData) setCustomers(customersData);

      // NUEVO: Cargamos también los equipos
      const { data: assetsData } = await supabase.from("assets").select("id, name, customer_id");
      if (assetsData) setAssets(assetsData);

      // ACTUALIZADO: Traemos el nombre del equipo asignado a la orden
      const { data: ordersData } = await supabase
        .from("work_orders")
        .select(`
          id, 
          description, 
          status,
          customer:customers(name),
          asset:assets(name)
        `)
        .order("created_at", { ascending: false });
        
      if (ordersData) setWorkOrders(ordersData as any);
    }
    setLoading(false);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !selectedCustomerId || !description) return;

    setLoading(true);
    const { error } = await supabase
      .from("work_orders")
      .insert([
        {
          tenant_id: tenantId,
          customer_id: selectedCustomerId,
          asset_id: selectedAssetId || null, // Guardamos el equipo si se seleccionó
          description: description,
          status: "pending"
        }
      ]);

    if (!error) {
      setDescription("");
      setSelectedCustomerId("");
      setSelectedAssetId("");
      fetchInitialData();
    } else {
      console.error("Error creando orden:", error);
      alert("Error al crear la orden de trabajo.");
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("work_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) fetchInitialData();
  };

  // NUEVO: Filtramos los equipos basados en el cliente seleccionado
  const filteredAssets = assets.filter(a => a.customer_id === selectedCustomerId);

  return (
    <div id="dashboard-main">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Centro de Control</h1>
      <p className="text-slate-500 mb-8">Monitoreo de operación en tiempo real.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8" id="create-order-card">
            <h2 className="text-lg font-bold mb-4">Nueva Orden (OT)</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4" id="create-order-form">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select 
                  id="select-customer"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedAssetId(""); // Reseteamos el equipo si cambia el cliente
                  }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* NUEVO CAMPO: Selector de Equipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo a Reparar (Opcional)</label>
                <select 
                  id="select-asset"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  disabled={!selectedCustomerId || filteredAssets.length === 0}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {!selectedCustomerId 
                      ? "Primero selecciona un cliente" 
                      : filteredAssets.length === 0 
                        ? "Este cliente no tiene equipos" 
                        : "Selecciona un equipo..."}
                  </option>
                  {filteredAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo</label>
                <textarea 
                  id="textarea-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  placeholder="Ej: Mantenimiento preventivo..."
                  required
                />
              </div>

              <button 
                id="btn-submit-order"
                type="submit" 
                disabled={loading || !tenantId}
                className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Asignar Trabajo"}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Lista de Órdenes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="orders-list-card">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold">Registro Operativo</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {workOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-start justify-between gap-4" id={`order-item-${order.id}`}>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {order.status === 'pending' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">Pendiente</span>}
                      {order.status === 'in_progress' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">En Progreso</span>}
                      {order.status === 'completed' && <span className="py-1 px-2.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">Completado</span>}
                      <span className="text-xs text-slate-400 font-mono">#{order.id.split('-')[0]}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{order.customer?.name}</h3>
                    
                    {/* NUEVO: Mostrar el equipo si existe */}
                    {order.asset && (
                      <p className="text-sm font-medium text-blue-600 flex items-center gap-1 mb-1">
                        ⚙️ {order.asset.name}
                      </p>
                    )}
                    
                    <p className="text-sm text-slate-600">{order.description}</p>
                  </div>

                  <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                        id={`btn-start-${order.id}`}
                      >
                        Iniciar Trabajo
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                        id={`btn-complete-${order.id}`}
                      >
                        Marcar Listo
                      </button>
                    )}
                  </div>

                </div>
              ))}
              
              {workOrders.length === 0 && !loading && (
                <div className="px-6 py-12 text-center text-slate-500">
                  No hay órdenes de trabajo registradas.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}