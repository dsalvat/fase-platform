import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If authenticated, redirect to home dashboard
  if (session?.user) {
    redirect("/home");
  }

  // Landing page for unauthenticated users
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <h1 className="text-4xl font-bold">Plataforma FASE</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Metodologia de gestion de objetivos por Agustin Peralt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2 text-blue-600">Focus</h2>
            <p className="text-muted-foreground">
              Objetivos de enfoque y priorizacion
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2 text-green-600">Atencion</h2>
            <p className="text-muted-foreground">
              Objetivos de presencia y conciencia
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2 text-purple-600">Sistemas</h2>
            <p className="text-muted-foreground">
              Objetivos de procesos y estructuras
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2 text-orange-600">Energia</h2>
            <p className="text-muted-foreground">
              Objetivos de vitalidad y bienestar
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/api/auth/signin">
            <Button size="lg" className="text-lg px-8">
              Iniciar sesion con Google
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
