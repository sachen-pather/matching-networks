"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const LumpedElementNetwork = ({
  loadImpedance,
  frequency,
  sourceImpedance,
  updateResults,
  updateGraphData,
}) => {
  const [configuration, setConfiguration] = useState("shunt-first");
  const [results, setResults] = useState(null);
  const [allSolutions, setAllSolutions] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(0);

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

    let solutions = [];

    if (configuration === "shunt-first") {
      // Shunt element followed by series element (better for RL > Z0)
      // Shunt-first configuration - equation 5.3a and 5.3b in the text

      const discriminant = (RL / Z0) * (RL * RL + XL * XL - Z0 * RL);

      if (discriminant < 0) {
        alert("No real solution for shunt-first configuration with this load.");
        return;
      }

      const sqrtDiscriminant = Math.sqrt(discriminant);

      // Calculate both possible solutions
      const B1 = (XL + sqrtDiscriminant) / (RL * RL + XL * XL);
      const B2 = (XL - sqrtDiscriminant) / (RL * RL + XL * XL);

      // Calculate the series reactances for each B
      const X1 = 1 / B1 + (XL * Z0) / RL - Z0 / (B1 * RL);
      const X2 = 1 / B2 + (XL * Z0) / RL - Z0 / (B2 * RL);

      // Solution 1
      let shuntComponent1, seriesComponent1;
      if (B1 > 0) {
        shuntComponent1 = {
          type: "capacitor",
          value: B1 / omega,
          unit: "F",
        };
      } else {
        shuntComponent1 = {
          type: "inductor",
          value: -1 / (B1 * omega),
          unit: "H",
        };
      }

      if (X1 > 0) {
        seriesComponent1 = {
          type: "inductor",
          value: X1 / omega,
          unit: "H",
        };
      } else {
        seriesComponent1 = {
          type: "capacitor",
          value: -1 / (X1 * omega),
          unit: "F",
        };
      }

      // Solution 2
      let shuntComponent2, seriesComponent2;
      if (B2 > 0) {
        shuntComponent2 = {
          type: "capacitor",
          value: B2 / omega,
          unit: "F",
        };
      } else {
        shuntComponent2 = {
          type: "inductor",
          value: -1 / (B2 * omega),
          unit: "H",
        };
      }

      if (X2 > 0) {
        seriesComponent2 = {
          type: "inductor",
          value: X2 / omega,
          unit: "H",
        };
      } else {
        seriesComponent2 = {
          type: "capacitor",
          value: -1 / (X2 * omega),
          unit: "F",
        };
      }

      solutions.push({
        shunt: shuntComponent1,
        series: seriesComponent1,
        B: B1,
        X: X1,
      });

      solutions.push({
        shunt: shuntComponent2,
        series: seriesComponent2,
        B: B2,
        X: X2,
      });
    } else {
      // Series element followed by shunt element (better for RL < Z0)
      // Series-first configuration - equation 5.6a and 5.6b in the text

      const discriminant = RL * (Z0 - RL);

      if (discriminant < 0) {
        alert(
          "No real solution for series-first configuration with this load."
        );
        return;
      }

      const sqrtDiscriminant = Math.sqrt(discriminant);

      // Calculate both solutions for X
      const X1 = sqrtDiscriminant - XL;
      const X2 = -sqrtDiscriminant - XL;

      // Calculate the corresponding B values
      const B1 = sqrtDiscriminant / (Z0 * RL);
      const B2 = -sqrtDiscriminant / (Z0 * RL);

      // Solution 1
      let seriesComponent1, shuntComponent1;
      if (X1 > 0) {
        seriesComponent1 = {
          type: "inductor",
          value: X1 / omega,
          unit: "H",
        };
      } else {
        seriesComponent1 = {
          type: "capacitor",
          value: -1 / (X1 * omega),
          unit: "F",
        };
      }

      if (B1 > 0) {
        shuntComponent1 = {
          type: "capacitor",
          value: B1 / omega,
          unit: "F",
        };
      } else {
        shuntComponent1 = {
          type: "inductor",
          value: -1 / (B1 * omega),
          unit: "H",
        };
      }

      // Solution 2
      let seriesComponent2, shuntComponent2;
      if (X2 > 0) {
        seriesComponent2 = {
          type: "inductor",
          value: X2 / omega,
          unit: "H",
        };
      } else {
        seriesComponent2 = {
          type: "capacitor",
          value: -1 / (X2 * omega),
          unit: "F",
        };
      }

      if (B2 > 0) {
        shuntComponent2 = {
          type: "capacitor",
          value: B2 / omega,
          unit: "F",
        };
      } else {
        shuntComponent2 = {
          type: "inductor",
          value: -1 / (B2 * omega),
          unit: "H",
        };
      }

      solutions.push({
        series: seriesComponent1,
        shunt: shuntComponent1,
        X: X1,
        B: B1,
      });

      solutions.push({
        series: seriesComponent2,
        shunt: shuntComponent2,
        X: X2,
        B: B2,
      });
    }

    setAllSolutions(solutions);
    setSelectedSolution(0);
    setResults(solutions[0]);

    // Format components for CircuitDiagram (convert to array, pre-format values to pF/nH)
    const formattedComponents = [
      {
        type: solutions[0].shunt.type === "capacitor" ? "C" : "L",
        value:
          solutions[0].shunt.unit === "F"
            ? solutions[0].shunt.value * 1e12 // Convert F to pF
            : solutions[0].shunt.value * 1e9, // Convert H to nH
      },
      {
        type: solutions[0].series.type === "capacitor" ? "C" : "L",
        value:
          solutions[0].series.unit === "F"
            ? solutions[0].series.value * 1e12 // Convert F to pF
            : solutions[0].series.value * 1e9, // Convert H to nH
      },
    ];

    updateResults({
      isShuntFirst: configuration === "shunt-first",
      components: formattedComponents,
    });

    generateGraphData(solutions[0]);
  };

  const selectSolution = (index) => {
    if (allSolutions && index >= 0 && index < allSolutions.length) {
      setSelectedSolution(index);
      setResults(allSolutions[index]);

      // Update formatted components for the circuit diagram
      const formattedComponents = [
        {
          type: allSolutions[index].shunt.type === "capacitor" ? "C" : "L",
          value:
            allSolutions[index].shunt.unit === "F"
              ? allSolutions[index].shunt.value * 1e12 // Convert F to pF
              : allSolutions[index].shunt.value * 1e9, // Convert H to nH
        },
        {
          type: allSolutions[index].series.type === "capacitor" ? "C" : "L",
          value:
            allSolutions[index].series.unit === "F"
              ? allSolutions[index].series.value * 1e12 // Convert F to pF
              : allSolutions[index].series.value * 1e9, // Convert H to nH
        },
      ];

      updateResults({
        isShuntFirst: configuration === "shunt-first",
        components: formattedComponents,
      });

      generateGraphData(allSolutions[index]);
    }
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
        <div className="grid grid-cols-1 gap-4 mb-4">
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

        {allSolutions && allSolutions.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              {allSolutions.map((_, index) => (
                <Button
                  key={index}
                  onClick={() => selectSolution(index)}
                  className={`px-4 py-1 ${
                    selectedSolution === index
                      ? "bg-blue-700 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  Solution {index + 1}
                </Button>
              ))}
            </div>

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
                  <p className="text-gray-300 mt-2">
                    <span className="font-medium">Shunt Susceptance (B):</span>{" "}
                    {results.B.toFixed(5)} S
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Series Reactance (X):</span>{" "}
                    {results.X.toFixed(2)} Ω
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-gray-300">
                      <span className="font-medium">
                        Shunt Component ({results.shunt.type}):
                      </span>{" "}
                      {formatComponentValue(
                        results.shunt.value,
                        results.shunt.unit
                      )}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">
                        Series Component ({results.series.type}):
                      </span>{" "}
                      {formatComponentValue(
                        results.series.value,
                        results.series.unit
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-300 mt-2">
                    <span className="font-medium">Series Reactance (X):</span>{" "}
                    {results.X.toFixed(2)} Ω
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Shunt Susceptance (B):</span>{" "}
                    {results.B.toFixed(5)} S
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-gray-300">
                      <span className="font-medium">
                        Series Component ({results.series.type}):
                      </span>{" "}
                      {formatComponentValue(
                        results.series.value,
                        results.series.unit
                      )}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">
                        Shunt Component ({results.shunt.type}):
                      </span>{" "}
                      {formatComponentValue(
                        results.shunt.value,
                        results.shunt.unit
                      )}
                    </p>
                  </div>
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
