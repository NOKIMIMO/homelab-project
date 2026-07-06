export default function Error404Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-6">
      <div className="text-center max-w-md w-full">
        <div className="bg-base-300 border border-base-content/10 rounded-3xl p-10 shadow-xl">
          <h1 className="text-7xl font-black text-error drop-shadow-sm">
            404
          </h1>

          <h2 className="text-2xl font-bold mt-4 text-base-content">
            Page non trouvée
          </h2>

          <p className="text-base-content/60 mt-2 text-sm leading-relaxed">
            La page que vous recherchez n'existe pas.
            <br />
          </p>

          <div className="divider my-6 opacity-30" />
          <a
            href="/"
            className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/20"
          >
            Retour à l'accueil
          </a>
        </div>

        <p className="text-xs text-base-content/40 mt-6">
          Homelab Core • Security Layer
        </p>
      </div>
    </div>
  );
}