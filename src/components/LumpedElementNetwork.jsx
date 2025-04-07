"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const LumpedElementNetwork = ({
  loadImpedance,
  frequency,
  updateResults,
  updateGraphData,
}) => {
  const [sourceImpedance, setSourceImpedance] = useState(50);
  const [configuration, setConfiguration] = useState("shunt-first");
  const [results, setResults] = useState(null);

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

  // ### Calculate Standing Wave Ratio (SWR)
  const calculateSWR = (real, imag, Z0) => {
    const Z = Math.sqrt(real * real + imag * imag);
    const gamma = Math.abs((Z - Z0) / (Z + Z0));
    return (1 + gamma) / (1 - gamma);
  };

  // ### Format Component Values
  const formatComponentValue = (value, unit) => {
    let formattedValue = value;
    let formattedUnit = unit;

    if (unit === "F") {
      if (value < 1e-12) {
        formattedValue = value * 1e15;
        formattedUnit = "fF";
      } else if (value < 1e-9) {
        formattedValue = value * 1e12;
        formattedUnit = "pF";
      } else if (value < 1e-6) {
        formattedValue = value * 1e9;
        formattedUnit = "nF";
      } else if (value < 1e-3) {
        formattedValue = value * 1e6;
        formattedUnit = "µF";
      } else {
        formattedValue = value * 1e3;
        formattedUnit = "mF";
      }
    } else if (unit === "H") {
      if (value < 1e-9) {
        formattedValue = value * 1e12;
        formattedUnit = "pH";
      } else if (value < 1e-6) {
        formattedValue = value * 1e9;
        formattedUnit = "nH";
      } else if (value < 1e-3) {
        formattedValue = value * 1e6;
        formattedUnit = "µH";
      } else if (value < 1) {
        formattedValue = value * 1e3;
        formattedUnit = "mH";
      }
    }

    return `${formattedValue.toFixed(2)} ${formattedUnit}`;
  };

  // ### Generate Graph Data
  const generateGraphData = (componentValues) => {
    const freqStart = frequency / 2;
    const freqEnd = frequency * 1.5;
    const steps = 100;
    const stepSize = (freqEnd - freqStart) / steps;
    const data = [];

    for (let i = 0; i <= steps; i++) {
      const f = freqStart + i * stepSize;
      const omega = 2 * Math.PI * f * 1e6;

      let inputImpedanceReal, inputImpedanceImag;

      if (configuration === "shunt-first") {
        const shuntComponent = componentValues.shunt;
        const seriesComponent = componentValues.series;

        let shuntSusceptance;
        if (shuntComponent.type === "capacitor") {
          shuntSusceptance = omega * shuntComponent.value;
        } else {
          shuntSusceptance = -1 / (omega * shuntComponent.value);
        }

        let seriesReactance;
        if (seriesComponent.type === "inductor") {
          seriesReactance = omega * seriesComponent.value;
        } else {
          seriesReactance = -1 / (omega * seriesComponent.value);
        }

        // Calculate intermediate admittance after shunt element
        const YLoad = invertComplex(
          Complex(loadImpedance.real, loadImpedance.imag)
        );
        const YShunt = Complex(0, shuntSusceptance);
        const YTotal = YLoad.add(YShunt);
        const ZIntermediate = invertComplex(YTotal);

        // Add series element
        const ZFinal = ZIntermediate.add(Complex(0, seriesReactance));

        inputImpedanceReal = ZFinal.real;
        inputImpedanceImag = ZFinal.imag;
      } else {
        const seriesComponent = componentValues.series;
        const shuntComponent = componentValues.shunt;

        let seriesReactance;
        if (seriesComponent.type === "inductor") {
          seriesReactance = omega * seriesComponent.value;
        } else {
          seriesReactance = -1 / (omega * seriesComponent.value);
        }

        let shuntSusceptance;
        if (shuntComponent.type === "capacitor") {
          shuntSusceptance = omega * shuntComponent.value;
        } else {
          shuntSusceptance = -1 / (omega * shuntComponent.value);
        }

        // Calculate intermediate impedance after series element
        const ZLoad = Complex(loadImpedance.real, loadImpedance.imag);
        const ZSeries = Complex(0, seriesReactance);
        const ZIntermediate = ZLoad.add(ZSeries);

        // Add shunt element
        const YShunt = Complex(0, shuntSusceptance);
        const YTotal = invertComplex(ZIntermediate).add(YShunt);
        const ZFinal = invertComplex(YTotal);

        inputImpedanceReal = ZFinal.real;
        inputImpedanceImag = ZFinal.imag;
      }

      data.push({
        frequency: f,
        real: inputImpedanceReal,
        imag: inputImpedanceImag,
        swr: calculateSWR(
          inputImpedanceReal,
          inputImpedanceImag,
          sourceImpedance
        ),
      });
    }

    updateGraphData(data);
  };

  // ### Main Calculation Function
  const calculate = () => {
    const RL = loadImpedance.real;
    const XL = loadImpedance.imag;
    const Z0 = sourceImpedance;
    const omega = 2 * Math.PI * frequency * 1e6;

    if (RL <= 0 || Z0 <= 0) {
      alert("Impedance values must be positive.");
      return;
    }

    let componentValues = {};

    if (configuration === "shunt-first") {
      // Shunt element followed by series element (better for RL > Z0)
      if (RL <= Z0) {
        alert(
          "For this load, the series-first configuration may work better. Try switching configurations."
        );
      }

      // Calculate shunt susceptance (B)
      const discriminant = (RL / Z0) * (RL * RL + XL * XL - Z0 * RL);
      if (discriminant < 0) {
        alert("No real solution for shunt-first configuration with this load.");
        return;
      }
      const sqrtDiscriminant = Math.sqrt(discriminant);
      const B1 = (XL + sqrtDiscriminant) / (RL * RL + XL * XL);
      const B2 = (XL - sqrtDiscriminant) / (RL * RL + XL * XL);
      const B_final = Math.abs(B1) < Math.abs(B2) ? B1 : B2;

      // Calculate series reactance (X)
      const X = 1 / B_final + (XL * Z0) / RL - Z0 / (B_final * RL);

      // Determine component types and values
      let shuntComponent, seriesComponent;

      if (B_final > 0) {
        shuntComponent = {
          type: "capacitor",
          value: B_final / omega,
          unit: "F",
        };
      } else {
        shuntComponent = {
          type: "inductor",
          value: -1 / (B_final * omega),
          unit: "H",
        };
      }

      if (X > 0) {
        seriesComponent = {
          type: "inductor",
          value: X / omega,
          unit: "H",
        };
      } else {
        seriesComponent = {
          type: "capacitor",
          value: -1 / (X * omega),
          unit: "F",
        };
      }

      componentValues = { shunt: shuntComponent, series: seriesComponent };
    } else {
      // Series element followed by shunt element (better for RL < Z0)
      if (RL >= Z0) {
        alert(
          "For this load, the shunt-first configuration may work better. Try switching configurations."
        );
      }

      // Calculate series reactance (X)
      const discriminant = RL * (Z0 - RL);
      if (discriminant < 0) {
        alert(
          "No real solution for series-first configuration with this load."
        );
        return;
      }
      const sqrtDiscriminant = Math.sqrt(discriminant);
      const X1 = sqrtDiscriminant - XL;
      const X2 = -sqrtDiscriminant - XL;
      const X_final = Math.abs(X1) < Math.abs(X2) ? X1 : X2;

      // Calculate shunt susceptance (B)
      const B1 = sqrtDiscriminant / (RL * Z0);
      const B2 = -sqrtDiscriminant / (RL * Z0);
      const B_final = Math.abs(B1) < Math.abs(B2) ? B1 : B2;

      // Determine component types and values
      let seriesComponent, shuntComponent;

      if (X_final > 0) {
        seriesComponent = {
          type: "inductor",
          value: X_final / omega,
          unit: "H",
        };
      } else {
        seriesComponent = {
          type: "capacitor",
          value: -1 / (X_final * omega),
          unit: "F",
        };
      }

      if (B_final > 0) {
        shuntComponent = {
          type: "capacitor",
          value: B_final / omega,
          unit: "F",
        };
      } else {
        shuntComponent = {
          type: "inductor",
          value: -1 / (B_final * omega),
          unit: "H",
        };
      }

      componentValues = { series: seriesComponent, shunt: shuntComponent };
    }

    setResults(componentValues);
    updateResults({ configuration, components: componentValues });
    generateGraphData(componentValues);
  };

  // ### JSX Rendering
  return (
    <Card className="bg-gray-800 border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-gray-100">
          Lumped Element Matching Network
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
              Configuration
            </label>
            <select
              value={configuration}
              onChange={(e) => setConfiguration(e.target.value)}
              className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
            >
              <option value="shunt-first">Shunt First</option>
              <option value="series-first">Series First</option>
            </select>
          </div>
        </div>

        <Button
          onClick={calculate}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="lumped-element-calculate"
        >
          Calculate
        </Button>

        {results && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-700 rounded-md border border-gray-600">
              <h3 className="font-semibold text-gray-200">
                Results (
                {configuration === "shunt-first"
                  ? "Shunt-First"
                  : "Series-First"}
                ):
              </h3>
              {configuration === "shunt-first" ? (
                <>
                  <p className="text-gray-300">
                    Shunt Component ({results.shunt.type}):{" "}
                    {formatComponentValue(
                      results.shunt.value,
                      results.shunt.unit
                    )}
                  </p>
                  <p className="text-gray-300">
                    Series Component ({results.series.type}):{" "}
                    {formatComponentValue(
                      results.series.value,
                      results.series.unit
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-300">
                    Series Component ({results.series.type}):{" "}
                    {formatComponentValue(
                      results.series.value,
                      results.series.unit
                    )}
                  </p>
                  <p className="text-gray-300">
                    Shunt Component ({results.shunt.type}):{" "}
                    {formatComponentValue(
                      results.shunt.value,
                      results.shunt.unit
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LumpedElementNetwork;
