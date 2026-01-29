export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Plataforma FASE</h1>
        <p className="text-xl text-muted-foreground">
          Metodología de gestión de objetivos por Agustín Peralt
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Focus</h2>
            <p className="text-muted-foreground">
              Objetivos de enfoque y priorización
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Atención</h2>
            <p className="text-muted-foreground">
              Objetivos de presencia y conciencia
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Sistemas</h2>
            <p className="text-muted-foreground">
              Objetivos de procesos y estructuras
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Energía</h2>
            <p className="text-muted-foreground">
              Objetivos de vitalidad y bienestar
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
