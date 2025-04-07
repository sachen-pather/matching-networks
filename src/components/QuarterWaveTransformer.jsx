"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const QuarterWaveTransformer = ({
  loadImpedance,
  frequency,
  updateResults,
  updateGraphData,
}) => {
  const [sourceImpedance, setSourceImpedance] = useState(50);
  const [characteristicImpedance, setCharacteristicImpedance] = useState(null);
  const [quarterWaveLength, setQuarterWaveLength] = useState(null);
  const [speedOfLight] = useState(299792458); // m/s, constant
  const [relativePermittivity, setRelativePermittivity] = useState(1);

  // ### Complex Number Helper
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

  // ### Invert a Complex Number
  const invertComplex = (z) => {
    const denom = z.real * z.real + z.imag * z.imag;
    return Complex(z.real / denom, -z.imag / denom);
  };

  // ### Calculate Input Impedance
  const calculateInputImpedance = (Z0, ZL, electricalLength) => {
    const theta = electricalLength * Math.PI; // Convert to radians
    const tanTheta = Math.tan(theta);
    const ZLComplex = Complex(ZL.real, ZL.imag);
    const jTanTheta = Complex(0, tanTheta);
    const numerator = ZLComplex.add(jTanTheta.multiply(Complex(Z0, 0)));
    const denominator = Complex(Z0, 0).add(jTanTheta.multiply(ZLComplex));
    return Complex(Z0, 0).multiply(
      numerator.multiply(invertComplex(denominator))
    );
  };

  // ### Calculate Standing Wave Ratio (SWR)
  const calculateSWR = (real, imag, Z0) => {
    const Z = Math.sqrt(real * real + imag * imag);
    const gamma = Math.abs((Z - Z0) / (Z + Z0));
    return (1 + gamma) / (1 - gamma);
  };

  // ### Generate Graph Data
  const generateGraphData = (Z0) => {
    const freqStart = frequency / 2;
    const freqEnd = frequency * 1.5;
    const steps = 100;
    const stepSize = (freqEnd - freqStart) / steps;
    const data = [];

    for (let i = 0; i <= steps; i++) {
      const f = freqStart + i * stepSize;
      const wavelength =
        speedOfLight / Math.sqrt(relativePermittivity) / (f * 1e6);
      const quarterWaveLength = wavelength / 4;
      const electricalLength = quarterWaveLength / wavelength; // 0.25 at center frequency

      const ZL = Complex(loadImpedance.real, loadImpedance.imag);
      const ZIN = calculateInputImpedance(Z0, ZL, electricalLength);

      data.push({
        frequency: f,
        real: ZIN.real,
        imag: ZIN.imag,
        swr: calculateSWR(ZIN.real, ZIN.imag, sourceImpedance),
      });
    }

    updateGraphData(data);
  };

  // ### Main Calculation Function
  const calculate = () => {
    // Validate load impedance (must be purely resistive)
    if (loadImpedance.imag !== 0) {
      alert(
        "Quarter-wave transformer is designed for purely resistive loads. Use Lumped Element or Single Stub for complex loads."
      );
      return;
    }

    // Calculate characteristic impedance (Z0)
    const Z0 = Math.sqrt(sourceImpedance * loadImpedance.real);
    setCharacteristicImpedance(Z0);

    // Calculate quarter-wave length
    const wavelength =
      speedOfLight / Math.sqrt(relativePermittivity) / (frequency * 1e6);
    const quarterWave = wavelength / 4;
    setQuarterWaveLength(quarterWave);

    // Update parent component with results
    const results = {
      Z0,
      quarterWaveLength: quarterWave,
      physicalLength: quarterWave,
    };
    updateResults(results);

    // Generate graph data
    generateGraphData(Z0);
  };

  // ### JSX Rendering
  return (
    <Card className="bg-gray-800 border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">
          Quarter Wave Transformer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Source Impedance (Ω)
            </label>
            <input
              type="number"
              value={sourceImpedance}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value);
                if (value > 0) setSourceImpedance(value);
                else alert("Source impedance must be positive.");
              }}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            />
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
          data-testid="quarter-wave-calculate"
        >
          Calculate
        </Button>

        {characteristicImpedance && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-700 rounded-md border border-gray-600">
              <h3 className="font-semibold text-gray-200">Results:</h3>
              <p className="text-gray-300">
                Characteristic Impedance (Z₀):{" "}
                {characteristicImpedance.toFixed(2)} Ω
              </p>
              <p className="text-gray-300">
                Quarter-Wave Length: {(quarterWaveLength * 1000).toFixed(2)} mm
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuarterWaveTransformer;
