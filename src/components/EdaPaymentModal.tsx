import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getPaymentPrice, makePayment } from "@/lib/contract";
import {
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  BarChart3,
  Shield,
} from "lucide-react";

interface EdaPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaid: (transactionHash: string) => void;
}

export default function EdaPaymentModal({
  open,
  onClose,
  onPaid,
}: EdaPaymentModalProps) {
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
      console.log("[DEBUG] EDA Payment transaction created:", tx.hash);
      setTxHash(tx.hash);
      await tx.wait();
      console.log(
        "[DEBUG] EDA Payment transaction confirmed, calling onPaid with:",
        tx.hash
      );
      // Pass transaction hash to parent component
      onPaid(tx.hash);
    } catch (err: any) {
      console.error("[DEBUG] EDA Payment failed:", err);
      setError(err.message || "EDA Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay flex items-center justify-center z-[9999]">
      <div className="glass rounded-2xl shadow-xl max-w-sm w-full mx-4 relative border border-white/10 modal-content z-[10000]">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors z-[10001]"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Loading State */}
          {loading && !price && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-300">Loading payment details...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-medium text-sm">
                    Payment Error
                  </p>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Processing State */}
          {loading && price && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-slate-300">
                Please wait while we confirm your transaction...
              </p>
            </div>
          )}

          {/* Payment Details */}
          {price && !loading && (
            <div className="space-y-6">
              {/* Price Display */}
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-4xl font-bold text-blue-400 mb-1">
                    {price} ETH
                  </div>
                  {usdAmount && (
                    <div className="text-lg text-slate-300">
                      ≈ ${usdAmount} USD
                    </div>
                  )}
                </div>
                {ethUsdPrice && (
                  <div className="text-xs text-slate-400">
                    ETH Price: ${ethUsdPrice.toLocaleString()} USD
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              {txHash && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-green-300 font-medium text-sm">
                        Payment Successful!
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 text-xs hover:underline flex items-center space-x-1"
                      >
                        <span>View Transaction</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-medium text-xs">
                      Secure Payment
                    </p>
                    <p className="text-blue-400 text-xs">
                      Processed securely through MetaMask and recorded on the
                      blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  txHash
                    ? "bg-green-500 cursor-default"
                    : loading
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg glow-primary"
                }`}
                onClick={handlePay}
                disabled={loading || !!txHash}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : txHash ? (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Payment Complete</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Pay with MetaMask</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
