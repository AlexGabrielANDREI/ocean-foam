import { useEffect, useState } from "react";
import { getPaymentPrice, makePayment } from "@/lib/contract";
import { ethers } from "ethers";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}

export default function PaymentModal({
  open,
  onClose,
  onPaid,
}: PaymentModalProps) {
  const [price, setPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  useEffect(() => {
    if (open) {
      setError("");
      setTxHash("");
      setLoading(true);
      getPaymentPrice()
        .then(setPrice)
        .catch(() => setError("Failed to fetch price from contract."))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await makePayment(signer, price);
      setTxHash(tx.hash);
      await tx.wait();
      onPaid();
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="card max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-secondary-500 hover:text-red-500 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2 text-foreground">
          Model Payment Required
        </h2>
        <p className="mb-4 text-secondary-600">
          To run a prediction, you must pay the model fee using your MetaMask
          wallet.
        </p>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 mb-2">{error}</div>
        ) : (
          <>
            <div className="mb-4">
              <span className="font-semibold text-lg">Amount:</span>
              <span className="ml-2 text-primary-500 font-mono">
                {price} ETH
              </span>
            </div>
            {txHash && (
              <div className="mb-2 text-green-500 text-sm">
                Payment sent! Tx:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {txHash.slice(0, 10)}...
                </a>
              </div>
            )}
            <button
              className="btn-primary w-full mt-2"
              onClick={handlePay}
              disabled={loading || !!txHash}
            >
              {txHash ? "Paid" : "Pay with MetaMask"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
