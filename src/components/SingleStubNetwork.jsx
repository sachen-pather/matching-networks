"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const SingleStubNetwork = ({
  loadImpedance,
  frequency,
  sourceImpedance,
  updateResults,
  updateGraphData,
}) => {
  const [stubConfiguration, setStubConfiguration] = useState("shunt");
  const [stubType, setStubType] = useState("short");
  const [relativePermittivity, setRelativePermittivity] = useState(1);
  const [results, setResults] = useState(null);
  const [optimalSolution, setOptimalSolution] = useState(null);
  const [optimizationReason, setOptimizationReason] = useState("");

  // Complex Number Helper
  const Complex = (real, imag) => ({
    real,
    imag,
    add: function (other) {
      return Complex(this.real + other.real, this.imag + other.imag);
    },
    multiply: function (other) {
      return Complex(
        this.real * other.real - this.imag * other.imag,
        this.real * other.imag + this.imag * other.real
      );
    },
    magnitude: function () {
      return Math.sqrt(this.real * this.real + this.imag * this.imag);
    },
  });

  // Invert a Complex Number
  const invertComplex = (z) => {
    const denom = z.real * z.real + z.imag * z.imag;
    if (denom < 1e-10) return Complex(0, 0); // Avoid division by zero
    return Complex(z.real / denom, -z.imag / denom);
  };

  // Transform Impedance Function
  const transformImpedance = (ZL, Z0, electricalLength) => {
    const theta = 2 * Math.PI * electricalLength;
    const tanTheta = Math.tan(theta);
    const ZLComplex = Complex(ZL.real, ZL.imag);
    const jTanTheta = Complex(0, tanTheta);
    const numerator = ZLComplex.add(jTanTheta.multiply(Complex(Z0, 0)));
    const denominator = Complex(Z0, 0).add(jTanTheta.multiply(ZLComplex));
    return Complex(Z0, 0).multiply(
      numerator.multiply(invertComplex(denominator))
    );
  };

  // Calculate Standing Wave Ratio (SWR)
  const calculateSWR = (real, imag, Z0) => {
    const Z = Math.sqrt(real * real + imag * imag);
    const gamma = Math.abs((Z - Z0) / (Z + Z0));
    return (1 + gamma) / (1 - gamma);
  };

  // Generate Graph Data
  const generateGraphData = (solution) => {
    const freqStart = frequency / 2;
    const freqEnd = frequency * 1.5;
    const steps = 100;
    const stepSize = (freqEnd - freqStart) / steps;
    const Z0 = sourceImpedance;
    const RL = loadImpedance.real;
    const XL = loadImpedance.imag;
    const data = [];

    for (let i = 0; i <= steps; i++) {
      const f = freqStart + i * stepSize;
      const wavelength =
        299792458 / Math.sqrt(relativePermittivity) / (f * 1e6);
      const electricalDistance = solution.distanceWavelength * (frequency / f);
      const electricalStubLength =
        solution.stubLengthWavelength * (frequency / f);
      let ZIN;

      if (stubConfiguration === "shunt") {
        const ZL = Complex(RL, XL);
        const ZINStubPoint = transformImpedance(ZL, Z0, electricalDistance);
        const YINStubPoint = invertComplex(ZINStubPoint);
        let ZSTUB;
        if (stubType === "short") {
          ZSTUB = Complex(0, Z0 * Math.tan(2 * Math.PI * electricalStubLength));
        } else {
          ZSTUB = Complex(
            0,
            -Z0 / Math.tan(2 * Math.PI * electricalStubLength)
          );
        }
        const YSTUB = invertComplex(ZSTUB);
        const YTOTAL = YINStubPoint.add(YSTUB);
        ZIN = invertComplex(YTOTAL);
      } else {
        const ZL = Complex(RL, XL);
        const ZINStubPoint = transformImpedance(ZL, Z0, electricalDistance);
        let ZSTUB;
        if (stubType === "short") {
          ZSTUB = Complex(0, Z0 * Math.tan(2 * Math.PI * electricalStubLength));
        } else {
          ZSTUB = Complex(
            0,
            -Z0 / Math.tan(2 * Math.PI * electricalStubLength)
          );
        }
        ZIN = ZINStubPoint.add(ZSTUB);
      }

      data.push({
        frequency: f,
        real: ZIN.real,
        imag: ZIN.imag,
        swr: calculateSWR(ZIN.real, ZIN.imag, Z0),
      });
    }

    updateGraphData(data);
  };

  // Calculate Matching Network Parameters
  const calculate = () => {
    const Z0 = sourceImpedance;
    const Y0 = 1 / Z0;
    const RL = loadImpedance.real;
    const XL = loadImpedance.imag;

    // Input validation
    if (frequency <= 0 || relativePermittivity < 1) {
      alert(
        "Frequency must be positive and relative permittivity must be at least 1."
      );
      return;
    }

    if (stubConfiguration === "shunt") {
      // Shunt Stub Calculation
      let t1, t2;
      if (Math.abs(RL - Z0) < 0.0001) {
        t1 = -XL / (2 * Z0);
        t2 = null;
      } else {
        const discriminant = Math.sqrt((RL / Z0) * ((Z0 - RL) ** 2 + XL ** 2));
        t1 = (XL + discriminant) / (RL - Z0);
        t2 = (XL - discriminant) / (RL - Z0);
      }

      let d1, d2;
      d1 =
        t1 >= 0
          ? Math.atan(t1) / (2 * Math.PI)
          : (Math.PI + Math.atan(t1)) / (2 * Math.PI);
      d2 =
        t2 !== null
          ? t2 >= 0
            ? Math.atan(t2) / (2 * Math.PI)
            : (Math.PI + Math.atan(t2)) / (2 * Math.PI)
          : null;

      const calculateB = (t) => {
        return (
          (RL * RL * t - (Z0 - XL * t) * (XL + Z0 * t)) /
          (Z0 * (RL * RL + (XL + Z0 * t) * (XL + Z0 * t)))
        );
      };

      const B1 = calculateB(t1);
      const B2 = t2 !== null ? calculateB(t2) : null;

      let stubLength1Open = (-1 * Math.atan(B1 / Y0)) / (2 * Math.PI);
      if (stubLength1Open < 0) stubLength1Open += 0.5;
      let stubLength2Open = null;
      if (B2 !== null) {
        stubLength2Open = (-1 * Math.atan(B2 / Y0)) / (2 * Math.PI);
        if (stubLength2Open < 0) stubLength2Open += 0.5;
      }

      let stubLength1Short = Math.atan(Y0 / B1) / (2 * Math.PI);
      if (stubLength1Short < 0) stubLength1Short += 0.5;
      let stubLength2Short = null;
      if (B2 !== null) {
        stubLength2Short = Math.atan(Y0 / B2) / (2 * Math.PI);
        if (stubLength2Short < 0) stubLength2Short += 0.5;
      }

      let stubLength1 =
        stubType === "short" ? stubLength1Short : stubLength1Open;
      let stubLength2 =
        stubType === "short" ? stubLength2Short : stubLength2Open;

      const wavelength =
        299792458 / Math.sqrt(relativePermittivity) / (frequency * 1e6);

      const solution1 = {
        distance: d1 * wavelength,
        stubLength: stubLength1 * wavelength,
        distanceWavelength: d1,
        stubLengthWavelength: stubLength1,
        tValue: t1,
        bValue: B1,
        locLambda: stubLength1Open,
        lscLambda: stubLength1Short,
      };

      const solution2 =
        d2 !== null
          ? {
              distance: d2 * wavelength,
              stubLength: stubLength2 * wavelength,
              distanceWavelength: d2,
              stubLengthWavelength: stubLength2,
              tValue: t2,
              bValue: B2,
              locLambda: stubLength2Open,
              lscLambda: stubLength2Short,
            }
          : null;

      const totalLength1 = solution1.distance + solution1.stubLength;
      const totalLength2 = solution2
        ? solution2.distance + solution2.stubLength
        : Infinity;

      if (totalLength1 <= totalLength2) {
        setOptimalSolution("solution1");
        setOptimizationReason(
          `Solution 1 is recommended as it requires less total track length (${totalLength1.toFixed(
            2
          )} m vs ${totalLength2.toFixed(2)} m).`
        );
        generateGraphData(solution1);
      } else {
        setOptimalSolution("solution2");
        setOptimizationReason(
          `Solution 2 is recommended as it requires less total track length (${totalLength2.toFixed(
            2
          )} m vs ${totalLength1.toFixed(2)} m).`
        );
        generateGraphData(solution2);
      }

      setResults({
        solution1,
        solution2,
        stubType,
        stubConfiguration,
      });

      updateResults({
        solution1,
        solution2,
        stubType,
        stubConfiguration,
        optimalSolution:
          totalLength1 <= totalLength2 ? "solution1" : "solution2",
        optimizationReason:
          totalLength1 <= totalLength2
            ? `Solution 1 requires less total track length (${totalLength1.toFixed(
                2
              )} m vs ${totalLength2.toFixed(2)} m).`
            : `Solution 2 requires less total track length (${totalLength2.toFixed(
                2
              )} m vs ${totalLength1.toFixed(2)} m).`,
      });
    } else {
      // Series Stub Calculation
      const zL = { real: RL / Z0, imag: XL / Z0 };
      const denominator = (zL.real + 1) ** 2 + zL.imag ** 2;
      if (denominator < 1e-10) {
        alert(
          "Invalid load impedance: denominator in reflection coefficient calculation is zero."
        );
        return;
      }
      const GammaLReal =
        ((zL.real - 1) * (zL.real + 1) + zL.imag * zL.imag) / denominator;
      const GammaLImag = (2 * zL.imag) / denominator;
      let GammaLMagnitude = Math.sqrt(GammaLReal ** 2 + GammaLImag ** 2);
      // Clamp GammaLMagnitude to avoid numerical issues with acos
      GammaLMagnitude = Math.min(1, Math.max(0, GammaLMagnitude));
      const phi = Math.atan2(GammaLImag, GammaLReal);
      const alpha = Math.acos(GammaLMagnitude);

      let d1Wavelength = (phi - alpha) / (4 * Math.PI);
      if (d1Wavelength < 0) d1Wavelength += 0.5;
      let d2Wavelength = (phi + alpha) / (4 * Math.PI);
      if (d2Wavelength < 0) d2Wavelength += 0.5;

      const wavelength =
        299792458 / Math.sqrt(relativePermittivity) / (frequency * 1e6);
      const computeZin = (dWavelength) =>
        transformImpedance({ real: RL, imag: XL }, Z0, dWavelength);

      const ZInD1 = computeZin(d1Wavelength);
      const XStub1 = -ZInD1.imag;
      let stubLength1Wavelength, stubLength1Open, stubLength1Short;
      const epsilon = 1e-10; // Small threshold to avoid division by zero
      if (stubType === "short") {
        stubLength1Wavelength =
          Math.abs(XStub1) < epsilon
            ? 0
            : (1 / (2 * Math.PI)) * Math.atan(XStub1 / Z0);
        stubLength1Short = stubLength1Wavelength;
        stubLength1Open =
          Math.abs(XStub1) < epsilon
            ? 0.25 // tan(βℓ) = -Z0/XStub1 → ∞, so βℓ = π/2, ℓ/λ = 1/4
            : (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub1);
        if (stubLength1Wavelength < 0) stubLength1Wavelength += 0.5;
        if (stubLength1Open < 0) stubLength1Open += 0.5;
      } else {
        stubLength1Wavelength =
          Math.abs(XStub1) < epsilon
            ? 0.25
            : (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub1);
        stubLength1Open = stubLength1Wavelength;
        stubLength1Short =
          Math.abs(XStub1) < epsilon
            ? 0
            : (1 / (2 * Math.PI)) * Math.atan(XStub1 / Z0);
        if (stubLength1Wavelength < 0) stubLength1Wavelength += 0.5;
        if (stubLength1Short < 0) stubLength1Short += 0.5;
      }

      const solution1 = {
        distance: d1Wavelength * wavelength,
        stubLength: stubLength1Wavelength * wavelength,
        distanceWavelength: d1Wavelength,
        stubLengthWavelength: stubLength1Wavelength,
        reactance: XStub1,
        locLambda: stubLength1Open,
        lscLambda: stubLength1Short,
      };

      const ZInD2 = computeZin(d2Wavelength);
      const XStub2 = -ZInD2.imag;
      let stubLength2Wavelength, stubLength2Open, stubLength2Short;
      if (stubType === "short") {
        stubLength2Wavelength =
          Math.abs(XStub2) < epsilon
            ? 0
            : (1 / (2 * Math.PI)) * Math.atan(XStub2 / Z0);
        stubLength2Short = stubLength2Wavelength;
        stubLength2Open =
          Math.abs(XStub2) < epsilon
            ? 0.25
            : (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub2);
        if (stubLength2Wavelength < 0) stubLength2Wavelength += 0.5;
        if (stubLength2Open < 0) stubLength2Open += 0.5;
      } else {
        stubLength2Wavelength =
          Math.abs(XStub2) < epsilon
            ? 0.25
            : (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub2);
        stubLength2Open = stubLength2Wavelength;
        stubLength2Short =
          Math.abs(XStub2) < epsilon
            ? 0
            : (1 / (2 * Math.PI)) * Math.atan(XStub2 / Z0);
        if (stubLength2Wavelength < 0) stubLength2Wavelength += 0.5;
        if (stubLength2Short < 0) stubLength2Short += 0.5;
      }

      const solution2 = {
        distance: d2Wavelength * wavelength,
        stubLength: stubLength2Wavelength * wavelength,
        distanceWavelength: d2Wavelength,
        stubLengthWavelength: stubLength2Wavelength,
        reactance: XStub2,
        locLambda: stubLength2Open,
        lscLambda: stubLength2Short,
      };

      const totalLength1 = solution1.distance + solution1.stubLength;
      const totalLength2 = solution2.distance + solution2.stubLength;

      if (totalLength1 <= totalLength2) {
        setOptimalSolution("solution1");
        setOptimizationReason(
          `Solution 1 is recommended as it requires less total track length (${totalLength1.toFixed(
            2
          )} m vs ${totalLength2.toFixed(2)} m).`
        );
        generateGraphData(solution1);
      } else {
        setOptimalSolution("solution2");
        setOptimizationReason(
          `Solution 2 is recommended as it requires less total track length (${totalLength2.toFixed(
            2
          )} m vs ${totalLength1.toFixed(2)} m).`
        );
        generateGraphData(solution2);
      }

      setResults({ solution1, solution2, stubType, stubConfiguration });
      updateResults({
        solution1,
        solution2,
        stubType,
        stubConfiguration,
        optimalSolution:
          totalLength1 <= totalLength2 ? "solution1" : "solution2",
        optimizationReason:
          totalLength1 <= totalLength2
            ? `Solution 1 requires less total track length (${totalLength1.toFixed(
                2
              )} m vs ${totalLength2.toFixed(2)} m).`
            : `Solution 2 requires less total track length (${totalLength2.toFixed(
                2
              )} m vs ${totalLength1.toFixed(2)} m).`,
      });
    }
  };

  // JSX Rendering
  return (
    <Card className="bg-gray-800 border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">
          Single Stub Matching Network
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stub Configuration
            </label>
            <select
              value={stubConfiguration}
              onChange={(e) => setStubConfiguration(e.target.value)}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            >
              <option value="shunt">Shunt Stub</option>
              <option value="series">Series Stub</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stub Type
            </label>
            <select
              value={stubType}
              onChange={(e) => setStubType(e.target.value)}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            >
              <option value="short">Short Circuit</option>
              <option value="open">Open Circuit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Relative Permittivity (εr)
            </label>
            <input
              type="number"
              value={relativePermittivity}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value);
                if (value >= 1) setRelativePermittivity(value);
                else alert("Relative permittivity must be at least 1.");
              }}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            />
          </div>
        </div>

        <Button
          onClick={calculate}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="single-stub-calculate"
        >
          Calculate
        </Button>

        {results && (
          <div className="space-y-4">
            <div
              className={`p-4 bg-gray-700 rounded-md border ${
                optimalSolution === "solution1"
                  ? "border-blue-500"
                  : "border-gray-600"
              }`}
            >
              <h3 className="font-semibold mb-2 text-gray-200">
                Solution 1:{" "}
                {optimalSolution === "solution1" && (
                  <span className="text-blue-400">(Recommended)</span>
                )}
              </h3>
              {stubConfiguration === "shunt" && (
                <p className="text-gray-300">
                  t: {results.solution1.tValue.toFixed(4)}, d/λ:{" "}
                  {results.solution1.distanceWavelength.toFixed(3)}, B:{" "}
                  {results.solution1.bValue.toFixed(4)}
                </p>
              )}
              {stubConfiguration === "series" && (
                <p className="text-gray-300">
                  Reactance (X): {results.solution1.reactance.toFixed(4)}, d/λ:{" "}
                  {results.solution1.distanceWavelength.toFixed(3)}
                </p>
              )}
              <p className="text-gray-300">
                loc/λ: {results.solution1.locLambda.toFixed(3)}, lsc/λ:{" "}
                {results.solution1.lscLambda.toFixed(3)}
              </p>
              <p className="text-gray-300">
                Distance from Load: {results.solution1.distance.toFixed(2)} m (
                {(results.solution1.distanceWavelength * 360).toFixed(1)}°)
              </p>
              <p className="text-gray-300">
                Stub Length: {results.solution1.stubLength.toFixed(2)} m (
                {(results.solution1.stubLengthWavelength * 360).toFixed(1)}°)
              </p>
              <p className="text-gray-300">
                Total Track Length:{" "}
                {(
                  results.solution1.distance + results.solution1.stubLength
                ).toFixed(2)}{" "}
                m
              </p>
              <p className="text-gray-300">
                Stub Type:{" "}
                {results.stubType === "short"
                  ? "Short-Circuited"
                  : "Open-Circuited"}
              </p>
            </div>

            {results.solution2 && (
              <div
                className={`p-4 bg-gray-700 rounded-md border ${
                  optimalSolution === "solution2"
                    ? "border-blue-500"
                    : "border-gray-600"
                }`}
              >
                <h3 className="font-semibold mb-2 text-gray-200">
                  Solution 2:{" "}
                  {optimalSolution === "solution2" && (
                    <span className="text-blue-400">(Recommended)</span>
                  )}
                </h3>
                {stubConfiguration === "shunt" && (
                  <p className="text-gray-300">
                    t: {results.solution2.tValue.toFixed(4)}, d/λ:{" "}
                    {results.solution2.distanceWavelength.toFixed(3)}, B:{" "}
                    {results.solution2.bValue.toFixed(4)}
                  </p>
                )}
                {stubConfiguration === "series" && (
                  <p className="text-gray-300">
                    Reactance (X): {results.solution2.reactance.toFixed(4)},
                    d/λ: {results.solution2.distanceWavelength.toFixed(3)}
                  </p>
                )}
                <p className="text-gray-300">
                  loc/λ: {results.solution2.locLambda.toFixed(3)}, lsc/λ:{" "}
                  {results.solution2.lscLambda.toFixed(3)}
                </p>
                <p className="text-gray-300">
                  Distance from Load: {results.solution2.distance.toFixed(2)} m
                  ({(results.solution2.distanceWavelength * 360).toFixed(1)}°)
                </p>
                <p className="text-gray-300">
                  Stub Length: {results.solution2.stubLength.toFixed(2)} m (
                  {(results.solution2.stubLengthWavelength * 360).toFixed(1)}°)
                </p>
                <p className="text-gray-300">
                  Total Track Length:{" "}
                  {(
                    results.solution2.distance + results.solution2.stubLength
                  ).toFixed(2)}{" "}
                  m
                </p>
                <p className="text-gray-300">
                  Stub Type:{" "}
                  {results.stubType === "short"
                    ? "Short-Circuited"
                    : "Open-Circuited"}
                </p>
              </div>
            )}

            <div className="p-3 bg-gray-600 rounded-md">
              <p className="text-sm text-gray-300">{optimizationReason}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SingleStubNetwork;
