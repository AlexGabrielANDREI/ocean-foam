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

export default function InterestRateChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  useEffect(() => {
    loadInterestRateData();
    loadActiveModel();
  }, []);

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
    setPredictionLoading(true);
    setPredictionResult(null);
    try {
      const response = await fetch("/api/prediction", {
        method: "POST",
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Prediction failed");
      }
      const result = await response.json();
      setPredictionResult(result.prediction);
      toast.success("Prediction completed successfully!");
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(error instanceof Error ? error.message : "Prediction failed");
    } finally {
      setPredictionLoading(false);
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
        <div className="flex items-start space-x-6">
          {/* Jerome Powell Photo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center overflow-hidden">
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
              <h3 className="text-xl font-bold text-foreground">
                Jerome Powell
              </h3>
              <span className="bg-accent-green text-black px-3 py-1 rounded-full text-xs font-semibold">
                Fed Chair
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-secondary-500">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Federal Reserve</span>
                </div>
                <div className="flex items-center space-x-2 text-secondary-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Next FOMC Meeting</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-xl border border-blue-500/20">
                <h4 className="font-semibold text-foreground mb-2">
                  July 29–30, 2025
                </h4>
                <p className="text-sm text-secondary-600 leading-relaxed">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  US Federal Funds Rate
                </h3>
                <p className="text-sm text-secondary-600">
                  Historical trends & AI-powered predictions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-secondary-500">
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
            <div className="absolute top-4 right-4 glass px-4 py-2 rounded-xl border border-border">
              <div className="flex items-center space-x-2">
                <Percent className="w-4 h-4 text-accent-green" />
                <div>
                  <p className="text-xs text-secondary-500">Current Rate</p>
                  <p className="text-lg font-bold text-foreground">
                    {chartData[chartData.length - 1].rate}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Button Overlay */}
          {activeModel && (
            <div className="absolute bottom-4 left-4">
              <button
                onClick={handleRunPrediction}
                className="btn-primary flex items-center space-x-2 shadow-lg"
                disabled={predictionLoading}
              >
                {predictionLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Predicting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Predict Next Rate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Prediction Result */}
        {predictionResult && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>AI Prediction Result</span>
            </h4>
            <div className="bg-card/50 p-3 rounded-lg">
              <pre className="text-sm text-secondary-200 whitespace-pre-wrap">
                {JSON.stringify(predictionResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-secondary-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Federal Funds Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
