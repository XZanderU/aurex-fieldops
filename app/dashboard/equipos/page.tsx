"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Tipos
type Customer = { id: string; name: string };
type Site = { id: string; name: string };
type Asset = { 
  id: string; 
  name: string; 
  serial_number: string;
  customer: { name: string };
  site?: { name: string };
};

export default function EquiposPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Estados del formulario
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: tenantData } = await supabase.from("tenants").select("id").single();
    
    if (tenantData) {
      setTenantId(tenantData.id);
      
      // Cargar clientes para el select
      const { data: customersData } = await supabase.from("customers").select("id, name");
      if (customersData) setCustomers(customersData);

      // Cargar equipos con información relacionada
      const { data: assetsData } = await supabase
        .from("assets")
        .select(`
          id, 
          name, 
          serial_number,
          customer:customers(name)
        `)
        .order("created_at", { ascending: false });
        
      if (assetsData) setAssets(assetsData as any);
    }
    setLoading(false);
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !selectedCustomerId || !assetName) return;

    setLoading(true);
    const { error } = await supabase
      .from("assets")
      .insert([
        {
          tenant_id: tenantId,
          customer_id: selectedCustomerId,
          name: assetName,
          serial_number: serialNumber
        }
      ]);

    if (!error) {
      setAssetName("");
      setSerialNumber("");
      setSelectedCustomerId("");
      fetchData(); // Recargar lista
    } else {
      console.error("Error creando equipo:", error);
      alert("Error al registrar el equipo.");
    }
    setLoading(false);
  };

  return (
    <div id="equipos-module">
      <h1 className="text-3xl font-bold text-slate-800 mb-6" id="equipos-title">Inventario de Equipos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario (Podría extraerse a un componente <AssetForm />) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" id="create-asset-card">
            <h2 className="text-lg font-bold mb-4">Registrar Equipo</h2>
            <form onSubmit={handleCreateAsset} className="space-y-4" id="create-asset-form">
              
              <div>
                <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700 mb-1">Cliente Propietario</label>
                <select 
                  id="customer-select"
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
                <label htmlFor="asset-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo</label>
                <input 
                  id="asset-name"
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Ej: Motor Hidráulico TX-200"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="serial-number" className="block text-sm font-medium text-gray-700 mb-1">Número de Serie (Opcional)</label>
                <input 
                  id="serial-number"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ej: SN-987654321"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button 
                id="submit-asset-btn"
                type="submit" 
                disabled={loading || !tenantId}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Registrando..." : "Guardar Equipo"}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Equipos (Podría extraerse a un componente <AssetList />) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="asset-list-container">
            <table className="w-full text-left" id="asset-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-600">Equipo</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-600">Cliente</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-600">N° Serie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50" id={`asset-row-${asset.id}`}>
                    <td className="px-6 py-4 font-bold text-slate-800">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{asset.customer?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {asset.serial_number || <span className="text-slate-300 italic">N/A</span>}
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500" id="empty-state-message">
                      No hay equipos registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}