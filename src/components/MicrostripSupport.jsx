"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const MicrostripSupport = ({ networkType, results, frequency }) => {
  const [substrateHeight, setSubstrateHeight] = useState(1.6); // mm
  const [substratePermittivity, setSubstratePermittivity] = useState(4.4); // FR4
  const [microstripResults, setMicrostripResults] = useState(null);

  // Constants
  const c = 299792458; // Speed of light in m/s

  // Helper Function: Calculate Microstrip Width
  const calculateWidth = (Z0, h, er) => {
    const A =
      (Z0 / 60) * Math.sqrt((er + 1) / 2) +
      ((er - 1) / (er + 1)) * (0.23 + 0.11 / er);
    const B = (377 * Math.PI) / (2 * Z0 * Math.sqrt(er));
    const width =
      h *
      (B - 1 - Math.log(2 * B - 1) + ((er - 1) / (2 * er)) * Math.log(B - 1));
    return width;
  };

  // Helper Function: Calculate Effective Permittivity
  const calculateEffectivePermittivity = (w, h, er) => {
    const w_h_ratio = w / h;
    const e_eff =
      (er + 1) / 2 + ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 / w_h_ratio));
    return e_eff;
  };

  // Main Calculation Function
  const calculateMicrostrip = () => {
    const freq = frequency * 1e6; // Convert MHz to Hz
    const h = substrateHeight / 1000; // Convert mm to m
    const er = substratePermittivity;

    // Input validation
    if (h <= 0 || er < 1) {
      alert(
        "Substrate height must be positive, and permittivity must be >= 1."
      );
      return;
    }

    let Z0, length, width, e_eff;

    switch (networkType) {
      case "quarter-wave":
        if (!results || !results.Z0) {
          alert("Please calculate quarter-wave transformer parameters first.");
          return;
        }

        Z0 = results.Z0;
        width = calculateWidth(Z0, h, er);
        e_eff = calculateEffectivePermittivity(width, h, er);
        const lambda = c / (freq * Math.sqrt(e_eff));
        length = lambda / 4;

        setMicrostripResults({
          width: width * 1000, // Convert to mm
          length: length * 1000, // Convert to mm
          Z0,
          effectivePermittivity: e_eff,
        });
        break;

      case "single-stub":
        if (!results || !results.solution1) {
          alert("Please calculate single-stub parameters first.");
          return;
        }

        Z0 = 50; // Typically 50 ohms for single-stub networks
        width = calculateWidth(Z0, h, er);
        e_eff = calculateEffectivePermittivity(width, h, er);
        const lambda_eff = c / (freq * Math.sqrt(e_eff));

        const solution = results.solution1;
        const distance_electrical = solution.distanceWavelength;
        const stub_electrical = solution.stubLengthWavelength;

        const distance_physical = distance_electrical * lambda_eff;
        const stub_physical = stub_electrical * lambda_eff;

        setMicrostripResults({
          mainLineWidth: width * 1000, // Convert to mm
          stubWidth: width * 1000, // Same width for stub (assuming same Z0)
          distance: distance_physical * 1000, // Convert to mm
          stubLength: stub_physical * 1000, // Convert to mm
          effectivePermittivity: e_eff,
        });
        break;

      default:
        alert(
          "Microstrip calculations are only available for Quarter-Wave Transformer and Single-Stub networks."
        );
    }
  };

  // JSX Rendering
  return (
    <Card className="shadow-lg bg-gray-800 border border-gray-700">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">
          Microstrip Implementation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Substrate Height (mm)
            </label>
            <input
              type="number"
              value={substrateHeight}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value > 0) setSubstrateHeight(value);
                else alert("Substrate height must be positive.");
              }}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Substrate Relative Permittivity (εr)
            </label>
            <input
              type="number"
              value={substratePermittivity}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value >= 1) setSubstratePermittivity(value);
                else alert("Relative permittivity must be at least 1.");
              }}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            />
          </div>
        </div>

        <Button
          onClick={calculateMicrostrip}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Calculate Microstrip Dimensions
        </Button>

        {microstripResults && (
          <div className="p-4 bg-gray-700 rounded-md border border-gray-600">
            <h3 className="font-semibold mb-2 text-gray-200">
              Microstrip Dimensions:
            </h3>

            {networkType === "quarter-wave" ? (
              <>
                <p className="text-gray-300">
                  Microstrip Width: {microstripResults.width.toFixed(2)} mm
                </p>
                <p className="text-gray-300">
                  Microstrip Length: {microstripResults.length.toFixed(2)} mm
                </p>
                <p className="text-gray-300">
                  Characteristic Impedance: {microstripResults.Z0.toFixed(2)} Ω
                </p>
                <p className="text-gray-300">
                  Effective Permittivity:{" "}
                  {microstripResults.effectivePermittivity.toFixed(3)}
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300">
                  Main Line Width: {microstripResults.mainLineWidth.toFixed(2)}{" "}
                  mm
                </p>
                <p className="text-gray-300">
                  Distance to Stub: {microstripResults.distance.toFixed(2)} mm
                </p>
                <p className="text-gray-300">
                  Stub Width: {microstripResults.stubWidth.toFixed(2)} mm
                </p>
                <p className="text-gray-300">
                  Stub Length: {microstripResults.stubLength.toFixed(2)} mm
                </p>
                <p className="text-gray-300">
                  Effective Permittivity:{" "}
                  {microstripResults.effectivePermittivity.toFixed(3)}
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicrostripSupport;
