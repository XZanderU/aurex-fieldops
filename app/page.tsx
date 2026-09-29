import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">Aurex FieldOps</h1>
      <p className="text-gray-600 mb-8">Gestión inteligente de órdenes de trabajo en campo.</p>
      <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
        Iniciar Sesión
      </Link>
    </div>
  );
}
