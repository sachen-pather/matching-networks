// src/components/CircuitDiagram.jsx
import React from "react";

const CircuitDiagram = ({ networkType, results }) => {
  // SVG drawing functions
  const drawQuarterWave = (Z0) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
        {/* Source */}
        <circle
          cx="20"
          cy="80"
          r="10"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line x1="20" y1="60" x2="20" y2="100" stroke="black" strokeWidth="2" />
        <line x1="30" y1="80" x2="80" y2="80" stroke="black" strokeWidth="2" />

        {/* Source Impedance */}
        <text x="20" y="50" textAnchor="middle" fontSize="12">
          Source
        </text>
        <rect
          x="80"
          y="60"
          width="60"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="110" y="84" textAnchor="middle" fontSize="12">
          Z₀
        </text>

        {/* Quarter Wave Section */}
        <line
          x1="140"
          y1="80"
          x2="260"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />
        <path
          d="M 140,60 Q 200,100 260,60"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
        <text x="200" y="50" textAnchor="middle" fontSize="12">
          λ/4 Transformer
        </text>
        <text
          x="200"
          y="110"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
        >
          {Z0} Ω
        </text>

        {/* Load */}
        <rect
          x="260"
          y="60"
          width="60"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="290" y="84" textAnchor="middle" fontSize="12">
          ZL
        </text>
        <line
          x1="320"
          y1="80"
          x2="380"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />
        <rect
          x="330"
          y="80"
          width="50"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="355" y="104" textAnchor="middle" fontSize="12">
          Load
        </text>
      </svg>
    );
  };

  const drawLumpedElementShuntFirst = (components) => {
    const shuntType = components.shunt.type;
    const seriesType = components.series.type;

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
        {/* Source */}
        <circle
          cx="20"
          cy="80"
          r="10"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line x1="20" y1="60" x2="20" y2="100" stroke="black" strokeWidth="2" />
        <line x1="30" y1="80" x2="80" y2="80" stroke="black" strokeWidth="2" />

        {/* Source Impedance */}
        <text x="20" y="50" textAnchor="middle" fontSize="12">
          Source
        </text>
        <rect
          x="80"
          y="60"
          width="60"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="110" y="84" textAnchor="middle" fontSize="12">
          Z₀
        </text>

        {/* Series Element */}
        <line
          x1="140"
          y1="80"
          x2="180"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {seriesType === "inductor" ? (
          // Inductor
          <>
            <path
              d="M 180,80 C 185,70 195,90 200,80 C 205,70 215,90 220,80 C 225,70 235,90 240,80"
              fill="none"
              stroke="black"
              strokeWidth="2"
            />
            <text x="210" y="60" textAnchor="middle" fontSize="12">
              L
            </text>
          </>
        ) : (
          // Capacitor
          <>
            <line
              x1="200"
              y1="65"
              x2="200"
              y2="95"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="220"
              y1="65"
              x2="220"
              y2="95"
              stroke="black"
              strokeWidth="2"
            />
            <text x="210" y="60" textAnchor="middle" fontSize="12">
              C
            </text>
          </>
        )}

        <line
          x1="240"
          y1="80"
          x2="280"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {/* Shunt Element */}
        <line
          x1="280"
          y1="80"
          x2="280"
          y2="120"
          stroke="black"
          strokeWidth="2"
        />

        {shuntType === "inductor" ? (
          // Inductor
          <>
            <path
              d="M 280,120 C 270,125 290,135 280,140 C 270,145 290,155 280,160"
              fill="none"
              stroke="black"
              strokeWidth="2"
            />
            <text x="300" y="140" textAnchor="middle" fontSize="12">
              L
            </text>
          </>
        ) : (
          // Capacitor
          <>
            <line
              x1="265"
              y1="130"
              x2="295"
              y2="130"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="265"
              y1="150"
              x2="295"
              y2="150"
              stroke="black"
              strokeWidth="2"
            />
            <text x="300" y="140" textAnchor="middle" fontSize="12">
              C
            </text>
          </>
        )}

        <line
          x1="280"
          y1="80"
          x2="330"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {/* Load */}
        <rect
          x="330"
          y="60"
          width="50"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="355" y="84" textAnchor="middle" fontSize="12">
          Load
        </text>
      </svg>
    );
  };

  const drawLumpedElementSeriesFirst = (components) => {
    const seriesType = components.series.type;
    const shuntType = components.shunt.type;

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
        {/* Source */}
        <circle
          cx="20"
          cy="80"
          r="10"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line x1="20" y1="60" x2="20" y2="100" stroke="black" strokeWidth="2" />
        <line x1="30" y1="80" x2="80" y2="80" stroke="black" strokeWidth="2" />

        {/* Source Impedance */}
        <text x="20" y="50" textAnchor="middle" fontSize="12">
          Source
        </text>
        <rect
          x="80"
          y="60"
          width="60"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="110" y="84" textAnchor="middle" fontSize="12">
          Z₀
        </text>

        {/* Shunt Element */}
        <line
          x1="140"
          y1="80"
          x2="200"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1="200"
          y1="80"
          x2="200"
          y2="120"
          stroke="black"
          strokeWidth="2"
        />

        {shuntType === "inductor" ? (
          // Inductor
          <>
            <path
              d="M 200,120 C 190,125 210,135 200,140 C 190,145 210,155 200,160"
              fill="none"
              stroke="black"
              strokeWidth="2"
            />
            <text x="220" y="140" textAnchor="middle" fontSize="12">
              L
            </text>
          </>
        ) : (
          // Capacitor
          <>
            <line
              x1="185"
              y1="130"
              x2="215"
              y2="130"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="185"
              y1="150"
              x2="215"
              y2="150"
              stroke="black"
              strokeWidth="2"
            />
            <text x="220" y="140" textAnchor="middle" fontSize="12">
              C
            </text>
          </>
        )}

        {/* Series Element */}
        <line
          x1="200"
          y1="80"
          x2="240"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {seriesType === "inductor" ? (
          // Inductor
          <>
            <path
              d="M 240,80 C 245,70 255,90 260,80 C 265,70 275,90 280,80 C 285,70 295,90 300,80"
              fill="none"
              stroke="black"
              strokeWidth="2"
            />
            <text x="270" y="60" textAnchor="middle" fontSize="12">
              L
            </text>
          </>
        ) : (
          // Capacitor
          <>
            <line
              x1="260"
              y1="65"
              x2="260"
              y2="95"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="280"
              y1="65"
              x2="280"
              y2="95"
              stroke="black"
              strokeWidth="2"
            />
            <text x="270" y="60" textAnchor="middle" fontSize="12">
              C
            </text>
          </>
        )}

        <line
          x1="300"
          y1="80"
          x2="330"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {/* Load */}
        <rect
          x="330"
          y="60"
          width="50"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="355" y="84" textAnchor="middle" fontSize="12">
          Load
        </text>
      </svg>
    );
  };

  const drawSingleStub = (solution, configuration, stubType) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180">
        {/* Source */}
        <circle
          cx="20"
          cy="80"
          r="10"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line x1="20" y1="60" x2="20" y2="100" stroke="black" strokeWidth="2" />
        <line x1="30" y1="80" x2="80" y2="80" stroke="black" strokeWidth="2" />

        {/* Source Impedance */}
        <text x="20" y="50" textAnchor="middle" fontSize="12">
          Source
        </text>
        <rect
          x="80"
          y="60"
          width="40"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="100" y="84" textAnchor="middle" fontSize="12">
          Z₀
        </text>

        {/* Transmission Line */}
        <line
          x1="120"
          y1="80"
          x2="200"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />
        <text x="160" y="70" textAnchor="middle" fontSize="12">
          {solution
            ? (solution.distanceWavelength * 360).toFixed(1) + "°"
            : "d"}
        </text>

        {/* Stub Point */}
        <circle cx="200" cy="80" r="4" fill="black" />

        {configuration === "shunt" ? (
          // Shunt Stub
          <>
            <line
              x1="200"
              y1="80"
              x2="200"
              y2="150"
              stroke="black"
              strokeWidth="2"
            />
            <text x="215" y="115" textAnchor="middle" fontSize="12">
              {solution
                ? (solution.stubLengthWavelength * 360).toFixed(1) + "°"
                : "l"}
            </text>
            {stubType === "short" ? (
              // Short circuit
              <line
                x1="180"
                y1="150"
                x2="220"
                y2="150"
                stroke="black"
                strokeWidth="2"
              />
            ) : (
              // Open circuit
              <>
                <line
                  x1="190"
                  y1="145"
                  x2="210"
                  y2="145"
                  stroke="black"
                  strokeWidth="1"
                />
                <line
                  x1="185"
                  y1="150"
                  x2="215"
                  y2="150"
                  stroke="black"
                  strokeWidth="1"
                />
                <line
                  x1="180"
                  y1="155"
                  x2="220"
                  y2="155"
                  stroke="black"
                  strokeWidth="1"
                />
              </>
            )}
          </>
        ) : (
          // Series Stub
          <>
            <line
              x1="200"
              y1="80"
              x2="250"
              y2="80"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="200"
              y1="80"
              x2="225"
              y2="50"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="250"
              y1="80"
              x2="225"
              y2="50"
              stroke="black"
              strokeWidth="2"
            />
            <text x="225" y="40" textAnchor="middle" fontSize="12">
              {solution
                ? (solution.stubLengthWavelength * 360).toFixed(1) + "°"
                : "l"}
            </text>
            {stubType === "short" ? (
              // Short circuit
              <circle cx="225" cy="50" r="3" fill="black" />
            ) : (
              // Open circuit
              <>
                <line
                  x1="220"
                  y1="40"
                  x2="230"
                  y2="40"
                  stroke="black"
                  strokeWidth="1"
                />
                <line
                  x1="218"
                  y1="42"
                  x2="232"
                  y2="42"
                  stroke="black"
                  strokeWidth="1"
                />
                <line
                  x1="216"
                  y1="44"
                  x2="234"
                  y2="44"
                  stroke="black"
                  strokeWidth="1"
                />
              </>
            )}
          </>
        )}

        <line
          x1="200"
          y1="80"
          x2="300"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />

        {/* Load */}
        <rect
          x="300"
          y="60"
          width="50"
          height="40"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text x="325" y="84" textAnchor="middle" fontSize="12">
          ZL
        </text>
        <line
          x1="350"
          y1="80"
          x2="380"
          y2="80"
          stroke="black"
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Render the appropriate circuit diagram based on networkType
  if (!results) {
    return (
      <div className="text-center text-gray-500">
        Calculate to see the circuit diagram
      </div>
    );
  }

  switch (networkType) {
    case "quarter-wave":
      return drawQuarterWave(results.Z0);
    case "lumped-element":
      if (results.configuration === "shunt-first") {
        return drawLumpedElementShuntFirst(results.components);
      } else {
        return drawLumpedElementSeriesFirst(results.components);
      }
    case "single-stub":
      return drawSingleStub(
        results.solution1,
        results.stubConfiguration,
        results.stubType
      );
    default:
      return (
        <div className="text-center text-gray-500">
          Select a matching network type
        </div>
      );
  }
};

export default CircuitDiagram;
