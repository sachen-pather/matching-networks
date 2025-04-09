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

  // **Complex Number Helper**
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

  // **Invert a Complex Number**
  const invertComplex = (z) => {
    const denom = z.real * z.real + z.imag * z.imag;
    return Complex(z.real / denom, -z.imag / denom);
  };

  // **Transform Impedance Function (Corrected)**
  // Uses the standard transmission line formula: Z_in = Z0 * (ZL + j Z0 tan(θ)) / (Z0 + j ZL tan(θ))
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

  // **Calculate Standing Wave Ratio (SWR)**
  const calculateSWR = (real, imag, Z0) => {
    const Z = Math.sqrt(real * real + imag * imag);
    const gamma = Math.abs((Z - Z0) / (Z + Z0));
    return (1 + gamma) / (1 - gamma);
  };

  // **Generate Graph Data**
  // Computes impedance and SWR across a frequency range for plotting
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
        // Shunt stub: Z_total = 1 / (Y_load + Y_stub)
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
        // Series stub: Z_total = Z_load + Z_stub
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

  // **Calculate Matching Network Parameters**
  const calculate = () => {
    const Z0 = sourceImpedance;
    const RL = loadImpedance.real;
    const XL = loadImpedance.imag;

    if (stubConfiguration === "shunt") {
      // **Shunt Stub Calculation**
      const zL = { real: RL / Z0, imag: XL / Z0 };
      const denominator = zL.real * zL.real + zL.imag * zL.imag;
      const yL = { real: zL.real / denominator, imag: -zL.imag / denominator };

      let t1, t2;
      if (RL === Z0) {
        t1 = -XL / (2 * Z0);
        t2 = null;
      } else {
        const discriminant =
          Math.sqrt(RL * ((Z0 - RL) * (Z0 - RL) + XL * XL)) / Z0;
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
        const rT =
          (RL * (1 + t * t)) / (RL * RL + (XL + Z0 * t) * (XL + Z0 * t));
        const xT =
          (RL * RL * t - (Z0 - XL * t) * (XL + Z0 * t)) /
          (Z0 * (RL * RL + (XL + Z0 * t) * (XL + Z0 * t)));
        return -xT;
      };

      const B1 = calculateB(t1);
      const B2 = t2 !== null ? calculateB(t2) : null;

      let stubLength1, stubLength2;
      if (stubType === "short") {
        stubLength1 = Math.atan(1 / (Z0 * B1)) / (2 * Math.PI);
        if (stubLength1 < 0) stubLength1 += 0.5;
        stubLength2 =
          B2 !== null ? Math.atan(1 / (Z0 * B2)) / (2 * Math.PI) : null;
        if (stubLength2 !== null && stubLength2 < 0) stubLength2 += 0.5;
      } else {
        stubLength1 = Math.atan(-Z0 * B1) / (2 * Math.PI);
        if (stubLength1 < 0) stubLength1 += 0.5;
        stubLength2 = B2 !== null ? Math.atan(-Z0 * B2) / (2 * Math.PI) : null;
        if (stubLength2 !== null && stubLength2 < 0) stubLength2 += 0.5;
      }

      const wavelength =
        299792458 / Math.sqrt(relativePermittivity) / (frequency * 1e6);
      const solution1 = {
        distance: d1 * wavelength,
        stubLength: stubLength1 * wavelength,
        distanceWavelength: d1,
        stubLengthWavelength: stubLength1,
      };
      const solution2 =
        d2 !== null
          ? {
              distance: d2 * wavelength,
              stubLength: stubLength2 * wavelength,
              distanceWavelength: d2,
              stubLengthWavelength: stubLength2,
            }
          : null;

      // Track length optimization - find the solution with the shortest total track length
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
    } else {
      // **Series Stub Calculation**
      const zL = { real: RL / Z0, imag: XL / Z0 };
      const denominator = (zL.real + 1) ** 2 + zL.imag ** 2;
      const GammaLReal =
        ((zL.real - 1) * (zL.real + 1) + zL.imag * zL.imag) / denominator;
      const GammaLImag = (2 * zL.imag) / denominator;
      const GammaLMagnitude = Math.sqrt(GammaLReal ** 2 + GammaLImag ** 2);
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

      // Solution 1
      const ZInD1 = computeZin(d1Wavelength);
      const XStub1 = -ZInD1.imag;
      let stubLength1Wavelength;
      if (stubType === "short") {
        stubLength1Wavelength = (1 / (2 * Math.PI)) * Math.atan(XStub1 / Z0);
        if (stubLength1Wavelength < 0) stubLength1Wavelength += 0.5;
      } else {
        stubLength1Wavelength = (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub1);
        if (stubLength1Wavelength < 0) stubLength1Wavelength += 0.5;
      }
      const solution1 = {
        distance: d1Wavelength * wavelength,
        stubLength: stubLength1Wavelength * wavelength,
        distanceWavelength: d1Wavelength,
        stubLengthWavelength: stubLength1Wavelength,
      };

      // Solution 2
      const ZInD2 = computeZin(d2Wavelength);
      const XStub2 = -ZInD2.imag;
      let stubLength2Wavelength;
      if (stubType === "short") {
        stubLength2Wavelength = (1 / (2 * Math.PI)) * Math.atan(XStub2 / Z0);
        if (stubLength2Wavelength < 0) stubLength2Wavelength += 0.5;
      } else {
        stubLength2Wavelength = (1 / (2 * Math.PI)) * Math.atan(-Z0 / XStub2);
        if (stubLength2Wavelength < 0) stubLength2Wavelength += 0.5;
      }
      const solution2 = {
        distance: d2Wavelength * wavelength,
        stubLength: stubLength2Wavelength * wavelength,
        distanceWavelength: d2Wavelength,
        stubLengthWavelength: stubLength2Wavelength,
      };

      // Track length optimization - find the solution with the shortest total track length
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

  // **JSX Rendering**
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

            {/* Optimization reasoning */}
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
