"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Definimos los tipos de TypeScript
type Customer = { id: string; name: string };
type WorkOrder = { id: string; description: string; status: string; customer: { name: string } };

export default function DashboardHome() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  
  // Estados para el formulario
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    // 1. Obtener Tenant ID
    const { data: tenantData } = await supabase.from("tenants").select("id").single();
    
    if (tenantData) {
      setTenantId(tenantData.id);
      
      // 2. Obtener Clientes para el menú desplegable
      const { data: customersData } = await supabase.from("customers").select("id, name");
      if (customersData) setCustomers(customersData);

      // 3. Obtener Órdenes de Trabajo activas (uniendo con el nombre del cliente)
      const { data: ordersData } = await supabase
        .from("work_orders")
        .select(`
          id, 
          description, 
          status,
          customer:customers(name)
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
          description: description,
          status: "pending"
        }
      ]);

    if (!error) {
      setDescription("");
      setSelectedCustomerId("");
      fetchInitialData(); // Recargar la lista
    } else {
      console.error("Error creando orden:", error);
      alert("Error al crear la orden de trabajo.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Centro de Control</h1>
      <p className="text-slate-500 mb-8">Monitoreo de operación en tiempo real.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario de Creación */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">Nueva Orden (OT)</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select 
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  placeholder="Ej: Mantenimiento preventivo aire central piso 4..."
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !tenantId}
                className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Asignar Trabajo"}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Lista de Órdenes */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold">Órdenes Pendientes</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {workOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                      Pendiente
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{order.id.split('-')[0]}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{order.customer?.name}</h3>
                  <p className="text-sm text-slate-600">{order.description}</p>
                </div>
              ))}
              
              {workOrders.length === 0 && !loading && (
                <div className="px-6 py-12 text-center text-slate-500">
                  No hay órdenes de trabajo activas. ¡Todo al día!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}