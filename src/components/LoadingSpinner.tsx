export default function LoadingSpinner() {
  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-secondary-600 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
          <div
            className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-accent-green rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Loading</h2>
          <p className="text-secondary-400">
            Preparing your AI prediction dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
