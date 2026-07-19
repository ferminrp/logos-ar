import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        Página no encontrada
      </h1>
      <p className="mt-3 text-muted-foreground">
        No encontramos la página que buscás. Probá el directorio o las
        categorías de logos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/" className="text-primary hover:underline">
          Ir al inicio
        </Link>
        <Link href="/categorias" className="text-primary hover:underline">
          Ver categorías
        </Link>
        <Link href="/docs" className="text-primary hover:underline">
          Documentación API
        </Link>
      </div>
    </main>
  )
}
