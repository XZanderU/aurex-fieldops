import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      
      {/* Navegación Pública */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-black tracking-tighter text-slate-900">
          Aurex<span className="text-blue-600">FieldOps</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/registro" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm">
            Prueba Gratuita
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          Sistema de Mantenimiento B2B
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          El fin del caos en tus <br className="hidden lg:block"/> órdenes de mantenimiento.
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Reemplaza el papel y los mensajes de WhatsApp por una plataforma que conecta a tus coordinadores con los técnicos en terreno en tiempo real. 
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/registro" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/20">
            Comenzar Piloto Gratis
          </Link>
          <a href="#features" className="bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* Features - Lo que ya construiste */}
      <section id="features" className="bg-white py-24 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas para operar</h2>
            <p className="text-slate-500">Diseñado específicamente para empresas de servicios técnicos.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="space-y-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                📱
              </div>
              <h3 className="text-xl font-bold">Acceso sin contraseñas</h3>
              <p className="text-slate-600 leading-relaxed">
                Tus técnicos acceden escaneando un Código QR o mediante un Magic Link. Cero fricción en terreno, 100% de seguridad.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">
                📸
              </div>
              <h3 className="text-xl font-bold">Evidencias Fotográficas</h3>
              <p className="text-slate-600 leading-relaxed">
                Captura el estado del equipo antes y después del trabajo. Almacenamiento seguro en la nube para auditar y justificar cobros.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl">
                🏢
              </div>
              <h3 className="text-xl font-bold">Aislamiento de Clientes</h3>
              <p className="text-slate-600 leading-relaxed">
                Gestiona múltiples clientes y equipos desde un solo lugar. La arquitectura Multi-Tenant asegura que los datos nunca se mezclen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-slate-900 py-20 text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-white mb-6">¿Listo para modernizar tu operación?</h2>
          <p className="text-slate-400 mb-10">Únete a las empresas que ya están digitalizando su servicio técnico con Aurex FieldOps.</p>
          <Link href="/registro" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all">
            Crear cuenta de empresa
          </Link>
        </div>
      </section>
      
    </div>
  );
}