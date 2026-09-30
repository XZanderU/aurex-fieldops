"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

type TeamMember = {
  user_id: string;
  role: string;
  email?: string;
};

export default function EquipoPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para la nueva invitación
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const { data: tenantData } = await supabase.from("tenants").select("id").single();
    
    if (tenantData) {
      setTenantId(tenantData.id);
      
      // En una app real de producción con Supabase, los correos no se exponen 
      // fácilmente entre usuarios por seguridad, así que por ahora solo mostraremos el ID y el Rol.
      const { data: teamData } = await supabase
        .from("tenant_users")
        .select("user_id, role")
        .eq("tenant_id", tenantData.id);
        
      if (teamData) setTeam(teamData);
    }
    setLoading(false);
  };

  const handleInviteTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setLoading(true);
    
    // 1. Usar Supabase Auth para enviar un "Magic Link" de invitación.
    // Esto crea al usuario si no existe y le envía un correo para iniciar sesión.
    const { data, error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        // Redirigir de vuelta al dashboard una vez el técnico haga clic
        emailRedirectTo: `${window.location.origin}/dashboard`, 
      }
    });

    if (error) {
      console.error("Error al enviar invitación:", error);
      alert("Hubo un error al generar la invitación.");
    } else {
      // 2. Generar un "enlace falso" demostrativo para el QR.
      // En producción, aquí capturarías el token de invitación o la URL exacta.
      // Por ahora, para el MVP, simularemos la URL de acceso de ese correo:
      const generatedLink = `${window.location.origin}/login?email=${encodeURIComponent(inviteEmail)}`;
      setInviteLink(generatedLink);
      setInviteEmail("");
      
      // Nota: El usuario no aparecerá en la tabla "tenant_users" hasta que 
      // él mismo inicie sesión por primera vez e insertemos su registro.
      alert("¡Invitación enviada! Pídele al técnico que revise su correo, o que escanee el QR.");
    }
    
    setLoading(false);
  };

  return (
    <div id="equipo-module">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Equipo</h1>
      <p className="text-slate-500 mb-8">Administra a tus técnicos y accesos de operación.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Invitar Nuevo Técnico */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" id="invite-card">
            <h2 className="text-lg font-bold mb-4">Invitar Técnico</h2>
            <p className="text-sm text-slate-600 mb-4">
              Ingresa el correo del técnico. Le enviaremos un Magic Link para acceder sin contraseña.
            </p>
            
            <form onSubmit={handleInviteTechnician} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="tecnico@empresa.com"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !tenantId}
                className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generando..." : "Generar Acceso"}
              </button>
            </form>

            {/* Mostrar QR si se generó un enlace */}
            {inviteLink && (
              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col items-center animate-fade-in" id="qr-container">
                <p className="text-sm font-bold text-slate-800 mb-3">Acceso Rápido (QR)</p>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-3">
                  <QRCodeSVG value={inviteLink} size={150} />
                </div>
                <p className="text-xs text-slate-500 text-center">
                  El técnico puede escanear este código con su celular para iniciar sesión inmediatamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Lista de Miembros */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left" id="team-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-600">ID de Usuario</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-600">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member.user_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      {member.user_id.split('-')[0]}...
                    </td>
                    <td className="px-6 py-4">
                      {member.role === 'coordinator' ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
                          👑 Coordinador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                          👷‍♂️️ Técnico
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}