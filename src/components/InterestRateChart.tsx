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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import PaymentModal from "./PaymentModal";

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
}

export default function InterestRateChart({
  paymentRequired = false,
  showPaymentModal,
  onShowPaymentModal,
  onPaymentSuccess,
  onRefreshPaymentStatus,
}: InterestRateChartProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [currentTransactionHash, setCurrentTransactionHash] =
    useState<string>("");

  useEffect(() => {
    loadInterestRateData();
    loadActiveModel();
  }, []);

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

  const handleRunPrediction = async () => {
    setPaymentProcessing(false);
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
        throw new Error(error.error || "Prediction failed");
      }
      const result = await response.json();
      console.log("[DEBUG] API Success response:", result);
      setPredictionResult(result.prediction);
      toast.success("Prediction completed successfully!");

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
    console.log(
      "[DEBUG] Predict click - paymentRequired:",
      paymentRequired,
      "paymentComplete:",
      paymentComplete
    );
    if (paymentRequired && !paymentComplete) {
      setPaymentProcessing(true);
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

    setPaymentComplete(true);
    setPaymentProcessing(true);
    setCurrentTransactionHash(transactionHash);
    console.log("[DEBUG] currentTransactionHash set to:", transactionHash);
    onPaymentSuccess && onPaymentSuccess(transactionHash);

    // The useEffect will handle running the prediction when currentTransactionHash is set
    console.log(
      "[DEBUG] Payment success completed, prediction will run via useEffect"
    );
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
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading interest rate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jerome Powell FOMC Meeting Card */}
      <div className="card">
        <div className="flex items-start space-x-6">
          {/* Jerome Powell Photo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden">
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
              <User className="w-10 h-10 text-white hidden" />
            </div>
          </div>

          {/* Meeting Information */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-xl font-bold text-white">Jerome Powell</h3>
              <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Fed Chair
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-teal-300">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Federal Reserve</span>
                </div>
                <div className="flex items-center space-x-2 text-teal-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Next FOMC Meeting</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-500/20">
                <h4 className="font-semibold text-white mb-2">
                  September 16–17, 2025
                </h4>
                <p className="text-sm text-teal-200 leading-relaxed">
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
      <div className="card">
        <div className="card-header mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  US Federal Funds Rate
                </h3>
                <p className="text-sm text-teal-200">
                  Historical trends & AI-powered predictions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-teal-300">
              <Calendar className="w-4 h-4" />
              <span>1998 - 2024</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#024b86" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#024b86" stopOpacity={0.05} />
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
                stroke="#024b86"
                strokeWidth={3}
                fill="url(#rateGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#024b86",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Current Rate Indicator */}
          {chartData.length > 0 && (
            <div className="absolute top-4 right-4 glass px-4 py-2 rounded-xl border border-border">
              <div className="flex items-center space-x-2">
                <Percent className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs text-secondary-500">Current Rate</p>
                  <p className="text-lg font-bold text-foreground">
                    {chartData[chartData.length - 1].rate}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Status Indicator - Only for prediction, not payment */}
        {predictionLoading && !paymentProcessing && (
          <div className="mt-6 mb-4 text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="animate-spin w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full"></div>
              <span className="text-white font-medium">
                Running AI prediction...
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons Below Chart */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          {activeModel && (
            <button
              onClick={handlePredictClick}
              className="btn-primary flex items-center space-x-2 shadow-lg"
              disabled={
                predictionLoading ||
                paymentProcessing ||
                (paymentRequired && paymentComplete) ||
                showPaymentModal
              }
            >
              {paymentProcessing ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Payment in Progress...</span>
                </>
              ) : predictionLoading ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Prediction in Progress...</span>
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
          )}

          <button
            onClick={() => {
              toast("EDA feature coming soon!", {
                icon: "📊",
                duration: 3000,
              });
            }}
            className="btn-secondary flex items-center space-x-2 shadow-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Explore EDA</span>
          </button>
        </div>

        {/* Prediction Result */}
        {predictionResult && (
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-teal-500/10 to-teal-500/10 border border-teal-500/20">
            <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span>AI Prediction Result</span>
            </h4>

            {/* Main Prediction */}
            <div className="mb-6 text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">
                {predictionResult.prediction}
              </div>
              <div className="text-sm text-teal-200">Predicted Rate Change</div>
              <div className="text-xs text-gray-400 mt-1">
                Confidence: {(predictionResult.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Top 3 Probabilities */}
            {predictionResult.probabilities && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-white mb-3">
                  Top 3 Scenarios
                </h5>
                {Object.entries(predictionResult.probabilities)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([change, probability], index) => (
                    <div
                      key={change}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-teal-500 text-white"
                              : index === 1
                              ? "bg-blue-500 text-white"
                              : "bg-purple-500 text-white"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-white font-medium">{change}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(probability as number) * 100}%`,
                              backgroundColor:
                                index === 0
                                  ? "#14b8a6"
                                  : index === 1
                                  ? "#3b82f6"
                                  : "#a855f7",
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-300 min-w-[3rem]">
                          {((probability as number) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-secondary-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Federal Funds Rate</span>
          </div>
        </div>

        {/* Payment Modal */}
        {paymentRequired && (
          <PaymentModal
            open={!!showPaymentModal}
            onClose={() => {
              setPaymentProcessing(false);
              onShowPaymentModal && onShowPaymentModal();
            }}
            onPaid={handlePaymentSuccessInternal}
          />
        )}
      </div>
    </div>
  );
}
