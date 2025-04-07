// src/components/MatchingWizard.jsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const MatchingWizard = ({
  loadImpedance,
  frequency,
  sourceImpedance,
  updateSelectedNetwork,
}) => {
  const [recommendation, setRecommendation] = useState(null);

  const recommendNetwork = () => {
    const RL = loadImpedance.real;
    const XL = loadImpedance.imag;
    const Z0 = sourceImpedance || 50;

    // Calculate reflection coefficient
    const gamma = Math.abs(
      (Math.sqrt(RL * RL + XL * XL) - Z0) / (Math.sqrt(RL * RL + XL * XL) + Z0)
    );
    const SWR = (1 + gamma) / (1 - gamma);

    let recommendedNetwork = {
      type: null,
      reason: "",
      configuration: null,
    };

    // For purely resistive loads
    if (Math.abs(XL) < 0.01) {
      if (Math.abs(RL - Z0) < 0.01) {
        recommendedNetwork = {
          type: "none",
          reason: "The load is already matched to the source impedance.",
        };
      } else {
        // For purely resistive loads, quarter-wave transformer is often the simplest
        recommendedNetwork = {
          type: "quarter-wave",
          reason:
            "The load is purely resistive, and a quarter-wave transformer is a simple solution.",
          Z0: Math.sqrt(Z0 * RL),
        };
      }
    }
    // For loads with high SWR
    else if (SWR > 10) {
      recommendedNetwork = {
        type: "single-stub",
        reason:
          "The load has a high SWR, and a single-stub matching network provides good flexibility.",
        configuration: "shunt",
        stubType: "short",
      };
    }
    // For loads with RL > Z0
    else if (RL > Z0) {
      recommendedNetwork = {
        type: "lumped-element",
        reason:
          "The load resistance is higher than the source impedance, a shunt-first lumped element network is optimal.",
        configuration: "shunt-first",
      };
    }
    // For loads with RL < Z0
    else {
      recommendedNetwork = {
        type: "lumped-element",
        reason:
          "The load resistance is lower than the source impedance, a series-first lumped element network is optimal.",
        configuration: "series-first",
      };
    }

    setRecommendation(recommendedNetwork);
  };

  const selectRecommendedNetwork = () => {
    if (recommendation) {
      updateSelectedNetwork(recommendation.type, recommendation.configuration);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">Matching Network Wizard</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Button
          onClick={recommendNetwork}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Recommend Network
        </Button>

        {recommendation && (
          <div className="space-y-3">
            <div className="p-4 bg-gray-700 rounded-md border border-gray-600">
              <h3 className="font-semibold text-gray-200 mb-2">
                Recommendation:
              </h3>
              {recommendation.type === "none" ? (
                <p className="text-gray-300">{recommendation.reason}</p>
              ) : (
                <>
                  <p className="mb-2 text-gray-300">
                    <span className="font-medium text-gray-200">
                      Network Type:
                    </span>{" "}
                    <span className="text-blue-400">
                      {recommendation.type === "quarter-wave"
                        ? "Quarter Wave Transformer"
                        : recommendation.type === "lumped-element"
                        ? "Lumped Element Network"
                        : "Single Stub Network"}
                    </span>
                  </p>

                  {recommendation.configuration && (
                    <p className="mb-2 text-gray-300">
                      <span className="font-medium text-gray-200">
                        Configuration:
                      </span>{" "}
                      <span className="text-blue-400">
                        {recommendation.configuration}
                      </span>
                    </p>
                  )}

                  {recommendation.stubType && (
                    <p className="mb-2 text-gray-300">
                      <span className="font-medium text-gray-200">
                        Stub Type:
                      </span>{" "}
                      <span className="text-blue-400">
                        {recommendation.stubType}
                      </span>
                    </p>
                  )}

                  {recommendation.Z0 && (
                    <p className="mb-2 text-gray-300">
                      <span className="font-medium text-gray-200">
                        Characteristic Impedance:
                      </span>{" "}
                      <span className="text-blue-400">
                        {recommendation.Z0.toFixed(2)} Ω
                      </span>
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-400">
                    {recommendation.reason}
                  </p>

                  <Button
                    onClick={selectRecommendedNetwork}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Use This Network
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchingWizard;
