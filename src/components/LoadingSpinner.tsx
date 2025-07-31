import Image from "next/image";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Simple spinning circle */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto"></div>

        {/* Loading text */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-500">
            Please wait while we prepare your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
