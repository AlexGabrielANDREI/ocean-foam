import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  open: boolean;
  title: string;
  message: string;
  showSpinner?: boolean;
}

export default function LoadingModal({
  open,
  title,
  message,
  showSpinner = true,
}: LoadingModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay flex items-center justify-center">
      <div className="glass rounded-2xl shadow-xl max-w-sm w-full mx-4 relative border border-white/10 modal-content">
        <div className="p-8">
          <div className="text-center py-8">
            {showSpinner && (
              <div className="animate-spin w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full mx-auto mb-4"></div>
            )}
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-300">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
