"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetchContextAndCustomers();
  }, []);

  const fetchContextAndCustomers = async () => {
    setLoading(true);
    // 1. Obtener el tenant_id del usuario logueado de forma segura
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .single();

    if (tenantData) {
      setTenantId(tenantData.id);
      // 2. Si tenemos tenant, cargamos sus clientes
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (customersData) setCustomers(customersData);
    }
    setLoading(false);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !newCustomerName.trim()) return;

    setLoading(true);
    // 3. Insertar el cliente asumiendo el tenant_id (RLS validará en BD)
    const { data, error } = await supabase
      .from("customers")
      .insert([
        { 
          tenant_id: tenantId, 
          name: newCustomerName,
          email: "contacto@demo.com", // Dummy data por ahora
          phone: "3000000000"
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setCustomers([data, ...customers]);
      setNewCustomerName("");
    } else {
      console.error("Error al crear cliente:", error);
      alert("Error al crear cliente. Verifica los permisos de tu Tenant.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Directorio de Clientes</h1>
      
      {/* Formulario Rápido */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-md">
        <h2 className="text-lg font-bold mb-4">Agregar Nuevo Cliente</h2>
        <form onSubmit={handleAddCustomer} className="flex gap-2">
          <input
            type="text"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="Ej: Edificio Los Alpes"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <button 
            type="submit" 
            disabled={loading || !tenantId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Nombre del Cliente</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Contacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{c.email} • {c.phone}</td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                  No tienes clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}