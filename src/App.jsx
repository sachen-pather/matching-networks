"use client";

import { useState } from "react";
import { TabsList, TabsTrigger } from "./components/ui/tabs";
import QuarterWaveTransformer from "./components/QuarterWaveTransformer";
import LumpedElementNetwork from "./components/LumpedElementNetwork";
import SingleStubNetwork from "./components/SingleStubNetwork";
import CircuitDiagram from "./components/CircuitDiagram";
import { ImpedanceGraph } from "./components/ImpedanceGraph";
import MatchingWizard from "./components/MatchingWizard";
import MicrostripSupport from "./components/MicrostripSupport";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import "./styles/dark-theme.css";
// CSS to remove spinner arrows from number inputs
const styles = `
  /* Remove spinner arrows from number inputs for Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Remove spinner arrows for Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

function App() {
  // State management with initial values
  const [selectedNetwork, setSelectedNetwork] = useState("quarter-wave");
  const [loadImpedance, setLoadImpedance] = useState({ real: 100, imag: 0 });
  const [frequency, setFrequency] = useState(1000); // MHz
  const [sourceImpedance, setSourceImpedance] = useState(50); // ohms
  const [results, setResults] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  // Update functions for child components
  const updateResults = (newResults) => {
    setResults(newResults);
  };

  const updateGraphData = (newData) => {
    setGraphData(newData);
  };

  const updateSelectedNetwork = (networkType) => {
    setSelectedNetwork(networkType);
  };

  // Handle network type change
  const handleNetworkChange = (value) => {
    console.log("Changing network to:", value);
    setSelectedNetwork(value);
    // Reset results and graph data when switching networks
    setResults(null);
    setGraphData(null);
  };

  // JSX Rendering
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Apply styles to remove spinner arrows */}
      <style>{styles}</style>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
            <h1 className="text-3xl font-bold text-center text-gray-100">
              RF Matching Networks Designer
            </h1>
            <p className="text-center text-gray-400 mt-2">
              Design narrow-band matching networks for RF applications
            </p>
          </div>
        </header>

        {/* Load Settings Card */}
        <Card className="mb-6 shadow-lg bg-gray-800 border border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-gray-100">Load Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Real Part (Ω)
                </label>
                <input
                  type="number"
                  value={loadImpedance.real}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value);
                    if (value > 0)
                      setLoadImpedance({ ...loadImpedance, real: value });
                    else alert("Load real part must be positive.");
                  }}
                  className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Imaginary Part (Ω)
                </label>
                <input
                  type="number"
                  value={loadImpedance.imag}
                  onChange={(e) =>
                    setLoadImpedance({
                      ...loadImpedance,
                      imag: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Frequency (MHz)
                </label>
                <input
                  type="number"
                  value={frequency}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value);
                    if (value > 0) setFrequency(value);
                    else alert("Frequency must be positive.");
                  }}
                  className="block w-full rounded-md bg-gray-700 border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-100"
                />
              </div>
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
            </div>

            <div className="flex justify-end mt-4">
              <label className="inline-flex items-center bg-gray-700 px-4 py-2 rounded-md shadow-sm">
                <input
                  type="checkbox"
                  className="rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500"
                  checked={showAdvancedFeatures}
                  onChange={(e) => setShowAdvancedFeatures(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-300">
                  Show Advanced Features
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Matching Wizard (Advanced Feature) */}
        {showAdvancedFeatures && (
          <div className="mb-6">
            <MatchingWizard
              loadImpedance={loadImpedance}
              frequency={frequency}
              sourceImpedance={sourceImpedance}
              updateSelectedNetwork={updateSelectedNetwork}
            />
          </div>
        )}

        {/* Network Type Tabs */}
        <div className="space-y-6">
          <TabsList className="grid grid-cols-3 mb-6 bg-gray-800 shadow-lg rounded-lg p-1 border border-gray-700">
            <TabsTrigger
              value="quarter-wave"
              className={
                selectedNetwork === "quarter-wave"
                  ? "bg-blue-900 text-blue-100"
                  : ""
              }
              onClick={() => handleNetworkChange("quarter-wave")}
            >
              Quarter Wave Transformer
            </TabsTrigger>
            <TabsTrigger
              value="lumped-element"
              className={
                selectedNetwork === "lumped-element"
                  ? "bg-blue-900 text-blue-100"
                  : ""
              }
              onClick={() => handleNetworkChange("lumped-element")}
            >
              Lumped Element
            </TabsTrigger>
            <TabsTrigger
              value="single-stub"
              className={
                selectedNetwork === "single-stub"
                  ? "bg-blue-900 text-blue-100"
                  : ""
              }
              onClick={() => handleNetworkChange("single-stub")}
            >
              Single Stub
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Network Configuration */}
            <div className="space-y-6">
              {selectedNetwork === "quarter-wave" && (
                <QuarterWaveTransformer
                  loadImpedance={loadImpedance}
                  frequency={frequency}
                  sourceImpedance={sourceImpedance} // Pass from main settings
                  updateResults={updateResults}
                  updateGraphData={updateGraphData}
                />
              )}
              {selectedNetwork === "lumped-element" && (
                <LumpedElementNetwork
                  loadImpedance={loadImpedance}
                  frequency={frequency}
                  sourceImpedance={sourceImpedance} // Pass from main settings
                  updateResults={updateResults}
                  updateGraphData={updateGraphData}
                />
              )}
              {selectedNetwork === "single-stub" && (
                <SingleStubNetwork
                  loadImpedance={loadImpedance}
                  frequency={frequency}
                  sourceImpedance={sourceImpedance} // Pass from main settings
                  updateResults={updateResults}
                  updateGraphData={updateGraphData}
                />
              )}

              {/* Circuit Diagram */}
              <Card className="shadow-lg bg-gray-800 border border-gray-700">
                <CardHeader className="border-b border-gray-700">
                  <CardTitle className="text-gray-100">
                    Circuit Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 min-h-[200px] flex items-center justify-center">
                    {results ? (
                      <CircuitDiagram
                        networkType={selectedNetwork}
                        results={results}
                      />
                    ) : (
                      <div className="text-gray-400">
                        Calculate parameters to view circuit diagram
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Results and Visualization */}
            <div className="space-y-6">
              {/* Impedance Graph */}
              <Card className="shadow-lg bg-gray-800 border border-gray-700">
                <CardHeader className="border-b border-gray-700">
                  <CardTitle className="text-gray-100">
                    Input Impedance vs Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64 md:h-80 bg-gray-700 p-4 rounded-lg border border-gray-600 flex items-center justify-center">
                    {graphData ? (
                      <ImpedanceGraph data={graphData} />
                    ) : (
                      <div className="text-gray-400">
                        Calculate parameters to view graph
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Microstrip Support (Advanced Feature) */}
              {showAdvancedFeatures && (
                <MicrostripSupport
                  networkType={selectedNetwork}
                  results={results}
                  frequency={frequency}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">
              EEE3089F Project 2 - Matching Networks Designer
            </p>
            <p className="text-xs text-gray-500">
              Designed for narrow-band impedance matching applications
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
