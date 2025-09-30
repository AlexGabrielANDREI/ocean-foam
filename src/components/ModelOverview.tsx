"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Database,
  Target,
  TrendingUp,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  PieChart,
  LineChart,
} from "lucide-react";

interface ModelDescription {
  model_overview: {
    objective: string;
    approach: string;
    selected_model: string;
    explanation_tools: string[];
  };
  data_sources: {
    macroeconomic: string[];
    policy_outcomes: string[];
    communications: string[];
    timeframe: string;
  };
  feature_importance: {
    method: string;
    top_features: Array<{
      feature: string;
      importance: number;
    }>;
    note: string;
  };
  model_training: {
    imbalance_handling: string[];
    validation: string;
    hyperparameter_tuning: string;
  };
  interpretability: {
    drivers: string;
    visualizations: string[];
  };
  output_explanation: {
    format: string;
    supporting_information: string[];
    confidence: string;
  };
  limitations: {
    challenges: string[];
    note: string;
  };
}

export default function ModelOverview() {
  const [modelData, setModelData] = useState<ModelDescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        const response = await fetch("/modelDescription.json");
        const data = await response.json();
        setModelData(data);
      } catch (error) {
        console.error("Failed to fetch model description:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (!modelData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load model information</p>
      </div>
    );
  }

  const { feature_importance } = modelData;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Model Overview</h1>
        </div>
        <p className="text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Understanding how our AI model predicts Federal Reserve interest rate
          decisions using advanced machine learning and comprehensive economic
          data analysis.
        </p>
      </div>

      {/* Model Objective & Approach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Objective</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {modelData.model_overview.objective}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Approach</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {modelData.model_overview.approach}
          </p>
        </div>
      </div>

      {/* Model Performance & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Selected Model</h2>
          </div>
          <div className="space-y-3">
            <p className="text-slate-300">
              {modelData.model_overview.selected_model}
            </p>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">
                High accuracy achieved
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">
              Explanation Tools
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {modelData.model_overview.explanation_tools.map((tool, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">
            Feature Importance
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm">{feature_importance.method}</p>

          {/* Feature Importance Bars */}
          <div className="space-y-3">
            {feature_importance.top_features.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm font-medium">
                    {item.feature}
                  </span>
                  <span className="text-blue-400 text-sm font-semibold">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${item.importance * 100}%`,
                      animationDelay: `${index * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-slate-400 text-xs mt-4">
            {feature_importance.note}
          </p>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Data Sources</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Macroeconomic</h3>
            <ul className="space-y-2">
              {modelData.data_sources.macroeconomic.map((source, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ArrowRight className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{source}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Policy Outcomes</h3>
            <ul className="space-y-2">
              {modelData.data_sources.policy_outcomes.map((source, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ArrowRight className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{source}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Communications</h3>
            <ul className="space-y-2">
              {modelData.data_sources.communications.map((source, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <ArrowRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{source}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-slate-300 text-sm">
            <strong>Timeframe:</strong> {modelData.data_sources.timeframe}
          </p>
        </div>
      </div>

      {/* Model Training & Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <LineChart className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">
              Training Process
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-white font-medium mb-2">
                Imbalance Handling
              </h4>
              <div className="flex flex-wrap gap-2">
                {modelData.model_training.imbalance_handling.map(
                  (method, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs border border-orange-500/30"
                    >
                      {method}
                    </span>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Validation</h4>
              <p className="text-slate-300 text-sm">
                {modelData.model_training.validation}
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">
                Hyperparameter Tuning
              </h4>
              <p className="text-slate-300 text-sm">
                {modelData.model_training.hyperparameter_tuning}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Output Explanation
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              {modelData.output_explanation.format}
            </p>
            <div>
              <h4 className="text-white font-medium mb-2">
                Supporting Information
              </h4>
              <ul className="space-y-1">
                {modelData.output_explanation.supporting_information.map(
                  (info, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-cyan-400 mt-1 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{info}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <p className="text-slate-400 text-xs">
              {modelData.output_explanation.confidence}
            </p>
          </div>
        </div>
      </div>

      {/* Limitations & Interpretability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Limitations</h2>
          </div>
          <div className="space-y-3">
            <ul className="space-y-2">
              {modelData.limitations.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{challenge}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs mt-4">
              {modelData.limitations.note}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">
              Interpretability
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              {modelData.interpretability.drivers}
            </p>
            <div>
              <h4 className="text-white font-medium mb-2">Visualizations</h4>
              <ul className="space-y-1">
                {modelData.interpretability.visualizations.map((viz, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <BarChart3 className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{viz}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
