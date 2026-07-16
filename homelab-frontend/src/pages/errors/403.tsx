export default function Error403Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-6">
      <div className="text-center max-w-md w-full">
        <div className="bg-base-300 border border-base-content/10 rounded-3xl p-10 shadow-xl">
          <h1 className="text-7xl font-black text-error drop-shadow-sm">
            403
          </h1>

          <h2 className="text-2xl font-bold mt-4 text-base-content">
            Access denied
          </h2>

          <p className="text-base-content/60 mt-2 text-sm leading-relaxed">
            You do not have permission to access this resource.
            <br />
            Contact an administrator if needed.
          </p>

          <div className="divider my-6 opacity-30" />
          <a
            href="/"
            className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/20"
          >
            Back to home
          </a>
        </div>

        <p className="text-xs text-base-content/40 mt-6">
          Homelab Core • Security Layer
        </p>
      </div>
    </div>
  );
}