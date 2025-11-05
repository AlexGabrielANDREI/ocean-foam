"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Percent,
  Play,
  User,
  Clock,
  Building2,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import PaymentModal from "./PaymentModal";
import EdaPaymentModal from "./EdaPaymentModal";

interface InterestRateData {
  Date: string;
  FedDecisionRate: number;
}

interface ChartData {
  date: string;
  rate: number;
  formattedDate: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  version: number;
  use_manual_features: boolean;
  is_active: boolean;
}

interface InterestRateChartProps {
  paymentRequired?: boolean;
  showPaymentModal?: boolean;
  onShowPaymentModal?: () => void;
  onPaymentSuccess?: (transactionHash: string) => void;
  onRefreshPaymentStatus?: () => void;
  onRefreshEdaPaymentStatus?: () => void;
}

export default function InterestRateChart({
  paymentRequired = false,
  showPaymentModal,
  onShowPaymentModal,
  onPaymentSuccess,
  onRefreshPaymentStatus,
  onRefreshEdaPaymentStatus,
}: InterestRateChartProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [currentTransactionHash, setCurrentTransactionHash] =
    useState<string>("");
  const [paymentExpiryTimer, setPaymentExpiryTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [chartHeight, setChartHeight] = useState(300);

  // EDA Payment states
  const [showEdaPaymentModal, setShowEdaPaymentModal] = useState(false);
  const [edaPaymentComplete, setEdaPaymentComplete] = useState(false);
  const [currentEdaTransactionHash, setCurrentEdaTransactionHash] =
    useState<string>("");
  const [edaPaymentRequired, setEdaPaymentRequired] = useState(true);

  useEffect(() => {
    loadInterestRateData();
    loadActiveModel();
    loadLatestPrediction();
    checkEdaPaymentStatus();

    // Set initial chart height based on window size
    const updateChartHeight = () => {
      setChartHeight(window.innerWidth < 640 ? 250 : 300);
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);

    return () => window.removeEventListener("resize", updateChartHeight);
  }, [user]); // Re-run when user changes (login/logout)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (paymentExpiryTimer) {
        clearTimeout(paymentExpiryTimer);
      }
    };
  }, [paymentExpiryTimer]);

  // Monitor transaction hash changes and run prediction when set
  useEffect(() => {
    if (
      currentTransactionHash &&
      currentTransactionHash.trim() !== "" &&
      paymentComplete
    ) {
      console.log(
        "[DEBUG] Transaction hash changed, running prediction:",
        currentTransactionHash
      );
      handleRunPrediction();
    }
  }, [currentTransactionHash, paymentComplete]);

  // REMOVED: Auto-download on transaction hash change
  // EDA downloads should only happen when user clicks "EXPLORE EDA" button
  // This prevents automatic downloads on page load

  const loadInterestRateData = async () => {
    try {
      // Fetch the JSON data from the public directory
      const response = await fetch("/fed_decision_rate_fomc_ym.json");
      const data: InterestRateData[] = await response.json();

      // Transform data for chart
      const transformedData: ChartData[] = data.map((item) => ({
        date: item.Date,
        rate: item.FedDecisionRate,
        formattedDate: formatDate(item.Date),
      }));

      setChartData(transformedData);
    } catch (error) {
      console.error("Failed to load interest rate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveModel = async () => {
    try {
      const response = await fetch("/api/models", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const active = data.models.find((model: Model) => model.is_active);
        setActiveModel(active || null);
      }
    } catch (error) {
      console.error("Failed to load model:", error);
      toast.error("Failed to load model");
    }
  };

  const loadLatestPrediction = async () => {
    try {
      const response = await fetch("/api/predictions/latest", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.hasValidPrediction) {
          console.log("[DEBUG] Loading existing prediction:", data);
          setPredictionResult(data.prediction);

          // Set timer based on actual expiry time from database
          const timeRemaining = data.timeRemaining;
          if (timeRemaining > 0) {
            if (paymentExpiryTimer) {
              clearTimeout(paymentExpiryTimer);
            }

            const timer = setTimeout(() => {
              console.log("[DEBUG] Prediction expired, clearing result");
              setPredictionResult(null);
              setPaymentComplete(false);
              setCurrentTransactionHash("");
              toast(
                "Prediction expired. Please make a new payment to run predictions.",
                { icon: "ℹ️" }
              );
            }, timeRemaining);

            setPaymentExpiryTimer(timer);
            console.log("[DEBUG] Set timer for", timeRemaining, "ms");
          }
        } else {
          console.log("[DEBUG] No valid prediction found:", data.reason);
        }
      }
    } catch (error) {
      console.error("Failed to load latest prediction:", error);
    }
  };

  const handleRunPrediction = async () => {
    setPredictionLoading(true);
    setPredictionResult(null);
    try {
      console.log("[DEBUG] Running prediction with:", {
        walletAddress: user!.wallet_address,
        transactionHash: currentTransactionHash,
        hasTransactionHash: !!currentTransactionHash,
        currentTransactionHashLength: currentTransactionHash?.length || 0,
        paymentComplete,
        paymentRequired,
      });

      // Only include transaction hash header if it's not empty
      const headers: Record<string, string> = {
        "x-wallet-address": user!.wallet_address,
      };

      if (currentTransactionHash && currentTransactionHash.trim() !== "") {
        headers["x-transaction-hash"] = currentTransactionHash;
        console.log(
          "[DEBUG] Adding transaction hash to headers:",
          currentTransactionHash
        );
      } else {
        console.log("[DEBUG] No transaction hash to add to headers");
      }

      console.log("[DEBUG] Final headers:", headers);

      const response = await fetch("/api/prediction", {
        method: "POST",
        headers,
      });

      console.log("[DEBUG] API Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log("[DEBUG] API Error response:", error);

        // If payment required (402), show payment modal instead of error
        if (response.status === 402) {
          console.log("[DEBUG] Payment required, showing payment modal");
          // Refresh payment status first to ensure paymentRequired is updated
          onRefreshPaymentStatus && onRefreshPaymentStatus();
          // Show payment modal
          onShowPaymentModal && onShowPaymentModal();
          toast.error(error.error || "Payment required to run predictions");
          return;
        }

        throw new Error(error.error || "Prediction failed");
      }
      const result = await response.json();
      console.log("[DEBUG] API Success response:", result);

      // Add 5 second delay before showing results
      await new Promise((resolve) => setTimeout(resolve, 5000));

      setPredictionResult(result.prediction);
      toast.success("Prediction completed successfully!");

      // Set timer to clear prediction result after payment expires
      // Use timeRemaining from API response if available, otherwise default to 60 seconds
      if (paymentExpiryTimer) {
        clearTimeout(paymentExpiryTimer);
      }

      const expiryTime = result.timeRemaining || 60000; // Use API response or fallback to 60s
      console.log("[DEBUG] Setting payment expiry timer for", expiryTime, "ms");

      const timer = setTimeout(() => {
        console.log("[DEBUG] Payment expired, clearing prediction result");
        setPredictionResult(null);
        setPaymentComplete(false);
        setCurrentTransactionHash("");

        // Refresh payment status to update paymentRequired prop
        onRefreshPaymentStatus && onRefreshPaymentStatus();

        toast(
          "Payment expired. Please make a new payment to run predictions.",
          { icon: "ℹ️" }
        );
      }, expiryTime);

      setPaymentExpiryTimer(timer);

      // Refresh payment status after successful prediction
      onRefreshPaymentStatus && onRefreshPaymentStatus();
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(error instanceof Error ? error.message : "Prediction failed");
    } finally {
      setPredictionLoading(false);
    }
  };

  const handlePredictClick = () => {
    if (paymentRequired && !paymentComplete) {
      onShowPaymentModal && onShowPaymentModal();
    } else {
      handleRunPrediction();
    }
  };

  const handlePaymentSuccessInternal = (transactionHash: string) => {
    console.log(
      "[DEBUG] handlePaymentSuccessInternal called with:",
      transactionHash
    );
    console.log("[DEBUG] Transaction hash details:", {
      hash: transactionHash,
      length: transactionHash?.length || 0,
      isString: typeof transactionHash === "string",
      isEmpty: !transactionHash || transactionHash.trim() === "",
    });

    // Clear any existing timer
    if (paymentExpiryTimer) {
      clearTimeout(paymentExpiryTimer);
      setPaymentExpiryTimer(null);
    }

    setPaymentComplete(true);
    setCurrentTransactionHash(transactionHash);
    console.log("[DEBUG] currentTransactionHash set to:", transactionHash);
    onPaymentSuccess && onPaymentSuccess(transactionHash);

    // The useEffect will handle running the prediction when currentTransactionHash is set
    console.log(
      "[DEBUG] Payment success completed, prediction will run via useEffect"
    );
  };

  const checkEdaPaymentStatus = async () => {
    try {
      const response = await fetch("/api/eda-payment/status", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const hasValidEdaPayment = data.edaPaymentStatus.hasValidPayment;
        setEdaPaymentRequired(!hasValidEdaPayment);

        // Store transaction hash for future downloads, but DON'T auto-download
        // Downloads should only happen when user clicks "EXPLORE EDA" button
        if (hasValidEdaPayment && data.edaPaymentStatus.transactionHash) {
          setCurrentEdaTransactionHash(data.edaPaymentStatus.transactionHash);
          setEdaPaymentComplete(true);
        } else {
          // Clear state if no valid payment
          setCurrentEdaTransactionHash("");
          setEdaPaymentComplete(false);
        }

        console.log("[DEBUG] EDA Payment status check:", {
          hasValidEdaPayment,
          edaPaymentRequired: !hasValidEdaPayment,
          transactionHash: data.edaPaymentStatus.transactionHash,
        });
      } else {
        console.error("Failed to check EDA payment status");
        setEdaPaymentRequired(true); // Default to requiring payment if check fails
        setCurrentEdaTransactionHash("");
        setEdaPaymentComplete(false);
      }
    } catch (error) {
      console.error("EDA Payment status check error:", error);
      setEdaPaymentRequired(true); // Default to requiring payment if check fails
      setCurrentEdaTransactionHash("");
      setEdaPaymentComplete(false);
    }
  };

  const handleEdaDownload = async () => {
    if (!activeModel) {
      toast("No active model available", { icon: "⚠️" });
      return;
    }

    // Check payment status before attempting download
    // If payment is required but not complete, show payment modal instead
    if (edaPaymentRequired && !edaPaymentComplete) {
      console.log(
        "[DEBUG] EDA Download - Payment required, showing payment modal"
      );
      setShowEdaPaymentModal(true);
      return;
    }

    try {
      console.log("[DEBUG] EDA Download - Starting download process");

      // Fetch the active model details to get the EDA path
      const response = await fetch("/api/models", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });

      console.log(
        "[DEBUG] EDA Download - Models API response:",
        response.status
      );

      if (!response.ok) {
        throw new Error("Failed to fetch model details");
      }

      const data = await response.json();
      const model = data.models.find((m: any) => m.is_active);

      console.log("[DEBUG] EDA Download - Active model:", {
        modelName: model?.name,
        hasEdaPath: !!model?.eda_path,
        edaPath: model?.eda_path,
      });

      if (!model || !model.eda_path) {
        toast("No EDA report available for this model", { icon: "ℹ️" });
        return;
      }

      // Prepare headers for EDA download
      const headers: Record<string, string> = {
        "x-wallet-address": user!.wallet_address,
      };

      // Only include transaction hash header if it's not empty
      if (
        currentEdaTransactionHash &&
        currentEdaTransactionHash.trim() !== ""
      ) {
        headers["x-transaction-hash"] = currentEdaTransactionHash;
        console.log(
          "[DEBUG] EDA Download - Adding transaction hash to headers:",
          currentEdaTransactionHash
        );
      } else {
        console.log(
          "[DEBUG] EDA Download - No transaction hash to add to headers"
        );
      }

      console.log("[DEBUG] EDA Download - Final headers:", headers);

      // Download the EDA file
      console.log("[DEBUG] EDA Download - Requesting file download:", {
        url: `/api/models/download-eda?path=${encodeURIComponent(
          model.eda_path
        )}`,
        edaPath: model.eda_path,
      });

      const downloadResponse = await fetch(
        `/api/models/download-eda?path=${encodeURIComponent(model.eda_path)}`,
        {
          headers,
        }
      );

      console.log("[DEBUG] EDA Download - Download response:", {
        status: downloadResponse.status,
        statusText: downloadResponse.statusText,
        ok: downloadResponse.ok,
      });

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error("[DEBUG] EDA Download - Error response:", errorText);
        throw new Error(
          `Failed to download EDA file: ${downloadResponse.status} ${downloadResponse.statusText}`
        );
      }

      // Get the file blob
      console.log("[DEBUG] EDA Download - Converting response to blob");
      const blob = await downloadResponse.blob();
      console.log("[DEBUG] EDA Download - Blob created:", {
        size: blob.size,
        type: blob.type,
      });

      // Create download link
      console.log("[DEBUG] EDA Download - Creating download link");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EDA_${model.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("[DEBUG] EDA Download - Download completed successfully");
      toast("EDA report downloaded successfully!", { icon: "✅" });

      // Refresh EDA payment status to ensure UI reflects current state
      await checkEdaPaymentStatus();

      // Also refresh the EDA payment status in the top navigation
      onRefreshEdaPaymentStatus?.();
    } catch (error) {
      console.error("[DEBUG] EDA Download - Error:", error);
      toast(
        `Failed to download EDA report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { icon: "❌" }
      );
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-4 rounded-xl border border-border shadow-lg">
          <p className="text-sm text-secondary-400 mb-1">{formatDate(label)}</p>
          <p className="text-lg font-semibold text-foreground">
            {payload[0].value}%
          </p>
          <p className="text-xs text-secondary-500">Federal Funds Rate</p>
        </div>
      );
    }
    return null;
  };

  const CustomYAxisTick = ({ x, y, payload }: any) => (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#64748b" fontSize={12}>
      {payload.value}%
    </text>
  );

  const CustomXAxisTick = ({ x, y, payload }: any) => (
    <text x={x} y={y} dy={16} textAnchor="middle" fill="#64748b" fontSize={11}>
      {formatDate(payload.value)}
    </text>
  );

  if (loading) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading interest rate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jerome Powell FOMC Meeting Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Jerome Powell Photo */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src="/jerome-powell.jpeg"
                alt="Jerome Powell"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white hidden" />
            </div>
          </div>

          {/* Meeting Information */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Jerome Powell
              </h3>
              <span className="bg-accent-green text-black px-2 sm:px-3 py-1 rounded-full text-xs font-semibold w-fit">
                Fed Chair
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 text-secondary-500">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Federal Reserve</span>
                </div>
                <div className="flex items-center space-x-2 text-secondary-500">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Next FOMC Meeting</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3 sm:p-4 rounded-xl border border-blue-500/20">
                <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                  December 09-10, 2025
                </h4>
                <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed">
                  The Federal Open Market Committee will convene to assess
                  economic conditions and determine the target range for the
                  federal funds rate. This meeting will be crucial for
                  understanding the Fed's monetary policy direction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart with Integrated Prediction */}
      <div className="card overflow-hidden">
        <div className="card-header mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  US Federal Funds Rate
                </h3>
                <p className="text-xs sm:text-sm text-secondary-600">
                  Historical trends & AI-powered predictions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-secondary-500">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>1998 - 2024</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={<CustomXAxisTick />}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={<CustomYAxisTick />}
                axisLine={false}
                tickLine={false}
                domain={[0, "dataMax + 1"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#rateGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#3b82f6",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Current Rate Indicator */}
          {chartData.length > 0 && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 glass px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-border">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-accent-green flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs text-secondary-500">
                    Current Rate
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">
                    {chartData[chartData.length - 1].rate}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Button Overlay */}
          {activeModel && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto px-4 sm:px-0">
              <button
                onClick={handlePredictClick}
                className="btn-primary flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                disabled={
                  predictionLoading ||
                  (paymentRequired && paymentComplete) ||
                  (showPaymentModal && paymentRequired)
                }
              >
                {predictionLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Predicting...</span>
                  </>
                ) : paymentRequired && paymentComplete ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Payment Complete</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Predict Next Rate</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (edaPaymentRequired && !edaPaymentComplete) {
                    setShowEdaPaymentModal(true);
                  } else {
                    handleEdaDownload();
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Explore EDA</span>
              </button>
            </div>
          )}
        </div>

        {/* Payment Modal - Outside of button container to ensure proper overlay */}
        {paymentRequired && (
          <PaymentModal
            open={!!showPaymentModal}
            onClose={() => onShowPaymentModal && onShowPaymentModal()}
            onPaid={handlePaymentSuccessInternal}
          />
        )}

        {/* EDA Payment Modal */}
        {showEdaPaymentModal && (
          <EdaPaymentModal
            open={showEdaPaymentModal}
            onClose={() => setShowEdaPaymentModal(false)}
            onPaid={async (transactionHash: string) => {
              console.log(
                "[DEBUG] EDA Payment success, setting transaction hash:",
                transactionHash
              );
              setEdaPaymentComplete(true);
              setCurrentEdaTransactionHash(transactionHash);
              setShowEdaPaymentModal(false);
              setEdaPaymentRequired(false);

              // Record the EDA access transaction immediately after payment
              try {
                const response = await fetch("/api/eda-payment/record", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-wallet-address": user!.wallet_address,
                  },
                  body: JSON.stringify({
                    transactionHash: transactionHash,
                  }),
                });

                if (response.ok) {
                  console.log(
                    "[DEBUG] EDA access transaction recorded successfully"
                  );
                } else {
                  console.error(
                    "[DEBUG] Failed to record EDA access transaction"
                  );
                }
              } catch (error) {
                console.error(
                  "[DEBUG] Error recording EDA access transaction:",
                  error
                );
              }

              toast.success(
                "EDA payment successful! You can now download the EDA report."
              );
            }}
          />
        )}

        {/* Prediction Result */}
        {predictionResult && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center space-x-2 text-sm sm:text-base">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>AI Prediction Result</span>
            </h4>

            {/* Main Prediction Display */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl font-bold text-teal-400 mb-2">
                {typeof predictionResult.prediction === "number"
                  ? `${
                      predictionResult.prediction > 0 ? "+" : ""
                    }${predictionResult.prediction.toFixed(2)}%`
                  : predictionResult.prediction}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mb-1">
                Predicted Rate Change
              </div>
              <div className="text-xs text-slate-400">
                Confidence:{" "}
                {predictionResult.confidence
                  ? `${(predictionResult.confidence * 100).toFixed(1)}%`
                  : "N/A"}
              </div>
            </div>

            {/* Top 3 Scenarios */}
            {predictionResult.probabilities && (
              <div className="space-y-2 sm:space-y-3">
                <h5 className="text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                  Top 3 Scenarios
                </h5>
                {Object.entries(predictionResult.probabilities)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([scenario, probability], index) => {
                    const colors = [
                      "text-teal-400",
                      "text-blue-400",
                      "text-purple-400",
                    ];
                    const bgColors = [
                      "bg-teal-500",
                      "bg-blue-500",
                      "bg-purple-500",
                    ];
                    const color = colors[index] || "text-gray-400";
                    const bgColor = bgColors[index] || "bg-gray-500";

                    return (
                      <div
                        key={scenario}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-800/50"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div
                            className={`w-2 h-2 ${bgColor} rounded-full flex-shrink-0`}
                          ></div>
                          <span className="text-xs sm:text-sm text-slate-300">
                            {index + 1}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-medium ${color}`}
                          >
                            {scenario}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-200">
                          {((probability as number) * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-secondary-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
            <span>Federal Funds Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
