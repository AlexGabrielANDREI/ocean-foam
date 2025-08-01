import Image from "next/image";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen dark-bg flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Simple spinning circle */}
        <div className="w-12 h-12 border-4 border-slate-600 border-t-teal-500 rounded-full animate-spin mx-auto"></div>

        {/* Loading text */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-slate-300">
            Please wait while we prepare your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
