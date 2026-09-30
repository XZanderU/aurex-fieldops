"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantName, setTenantName] = useState<string>("Cargando...");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuthAndTenant = async () => {
      // 1. Validar sesión
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || "");

      // 2. Buscar la empresa (Tenant) del usuario
      // Gracias a RLS, esta consulta SOLO devolverá la empresa a la que pertenece
      const { data: tenantData, error } = await supabase
        .from("tenants")
        .select("name")
        .limit(1)
        .single();

      if (error || !tenantData) {
        console.error("Error cargando tenant o el usuario no tiene empresa", error);
        // Si no tiene empresa asignada, no puede usar FieldOps
        router.push("/login");
        return;
      }

      setTenantName(tenantData.name);
      setIsLoading(false);
    };

    checkAuthAndTenant();
  }, [router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-blue-900 font-bold">Cargando contexto FieldOps...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 mb-2 border-b border-slate-700">
          <h2 className="text-2xl font-bold tracking-tight">FieldOps</h2>
          {/* Aquí mostramos el nombre dinámico de la empresa */}
          <p className="text-blue-400 text-xs font-medium mt-1 truncate" title={tenantName}>
            🏢 {tenantName}
          </p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operación</p>
          <Link href="/dashboard" id="nav-link-work-orders" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium transition-colors">
            📋 Órdenes de Trabajo
          </Link>
          <Link href="/dashboard/equipos" id="nav-link-equipos" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors">
            ⚙️ Equipos / Activos
          </Link>
          <Link href="/dashboard/clientes" id="nav-link-clients" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors">
              👥 Clientes
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <p className="text-sm font-bold truncate">{userEmail}</p>
          <p className="text-xs text-slate-400">Administrador</p>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}