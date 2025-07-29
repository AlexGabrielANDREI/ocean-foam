import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getPaymentPrice, makePayment } from "@/lib/contract";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaid: (transactionHash: string) => void;
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
  const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>("");

  // Fetch ETH to USD price
  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      const ethPrice = data.ethereum.usd;
      setEthUsdPrice(ethPrice);

      // Calculate USD amount if we have both ETH price and contract price
      if (price && ethPrice) {
        const ethAmount = parseFloat(price);
        const usdValue = (ethAmount * ethPrice).toFixed(2);
        setUsdAmount(usdValue);
      }
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
    }
  };

  useEffect(() => {
    if (open) {
      setError("");
      setTxHash("");
      setLoading(true);

      // Fetch both contract price and ETH price
      Promise.all([getPaymentPrice().then(setPrice), fetchEthPrice()])
        .catch(() => setError("Failed to fetch price from contract."))
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Update USD amount when price changes
  useEffect(() => {
    if (price && ethUsdPrice) {
      const ethAmount = parseFloat(price);
      const usdValue = (ethAmount * ethUsdPrice).toFixed(2);
      setUsdAmount(usdValue);
    }
  }, [price, ethUsdPrice]);

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await makePayment(signer, price);
      console.log("[DEBUG] Payment transaction created:", tx.hash);
      setTxHash(tx.hash);
      await tx.wait();
      console.log(
        "[DEBUG] Payment transaction confirmed, calling onPaid with:",
        tx.hash
      );
      // Pass transaction hash to parent component
      onPaid(tx.hash);
    } catch (err: any) {
      console.error("[DEBUG] Payment failed:", err);
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
              <div className="mt-1">
                <span className="text-primary-500 font-mono text-lg">
                  {price} ETH
                </span>
                {usdAmount && (
                  <span className="ml-2 text-secondary-600 text-sm">
                    (≈ ${usdAmount} USD)
                  </span>
                )}
              </div>
              {!usdAmount && ethUsdPrice === null && (
                <div className="text-xs text-secondary-500 mt-1">
                  Loading USD conversion...
                </div>
              )}
              {ethUsdPrice && (
                <div className="text-xs text-secondary-500 mt-1">
                  Current ETH price: ${ethUsdPrice.toLocaleString()} USD
                </div>
              )}
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
