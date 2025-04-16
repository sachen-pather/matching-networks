import React from "react";

const CircuitDiagram = ({ networkType, results }) => {
  // Function to determine which image to display based on network type and results
  const getCircuitImagePath = () => {
    if (networkType === "quarter-wave") {
      return "/images/quarter-wave-transformer.png";
    }

    if (networkType === "lumped-element") {
      const isShuntFirst = results?.isShuntFirst || false;
      return isShuntFirst
        ? "/images/lumped-element-shunt-first.png"
        : "/images/lumped-element-series-first.png";
    }

    if (networkType === "single-stub") {
      return "/images/single-stub.png";
    }

    return "/images/default-circuit.png";
  };

  // Get the appropriate image path
  const imagePath = getCircuitImagePath();

  // Overlay component values on the image
  const renderComponentValues = () => {
    if (!results) return null;

    // Position this div absolutely over the image to overlay component values
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {networkType === "quarter-wave" && (
          <div className="text-xs text-white bg-black bg-opacity-50 p-1 rounded">
            Z₀ = {results.Z0?.toFixed(2)} Ω<br />
            Length = {results.length?.toFixed(2)} mm
          </div>
        )}

        {networkType === "lumped-element" && (
          // Position multiple labels for different components
          <>
            {results.components?.map((comp, index) => (
              <div
                key={index}
                className="text-xs text-white bg-black bg-opacity-50 p-1 rounded absolute"
                style={{
                  top: `${20 + index * 30}%`,
                  left: `${20 + index * 30}%`,
                }}
              >
                {comp.type === "L" ? "L = " : "C = "}
                {comp.value.toFixed(2)}
                {comp.type === "L" ? " nH" : " pF"}
              </div>
            ))}
          </>
        )}

        {networkType === "single-stub" && (
          <>
            <div
              className="text-xs text-white bg-black bg-opacity-50 p-1 rounded absolute"
              style={{ top: "20%", left: "20%" }}
            >
              Line = {results.lineLength?.toFixed(2)} mm
            </div>
            <div
              className="text-xs text-white bg-black bg-opacity-50 p-1 rounded absolute"
              style={{ top: "40%", left: "60%" }}
            >
              Stub = {results.stubLength?.toFixed(2)} mm
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
      {results ? (
        <>
          <img
            src={imagePath}
            alt={`${networkType} circuit diagram`}
            className="max-w-full max-h-full object-contain"
          />
          {renderComponentValues()}
        </>
      ) : (
        <div className="text-gray-400">
          Calculate parameters to view circuit diagram
        </div>
      )}
    </div>
  );
};

export default CircuitDiagram;
