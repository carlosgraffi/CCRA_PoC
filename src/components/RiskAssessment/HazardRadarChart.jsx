import React, { useRef, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import { getHazardColor, HAZARD_COLORS } from "../../constants/hazardColors";
import { Info, HelpCircle } from "lucide-react";

// Get a distinct color for a hazard
const getDistinctColor = (hazard, index) => {
  const colorFamilies = [
    HAZARD_COLORS.floods.base,
    HAZARD_COLORS.droughts.base,
    HAZARD_COLORS.heatwaves.base,
    HAZARD_COLORS.diseases.base,
    HAZARD_COLORS.landslides.base,
    HAZARD_COLORS.wildfires.base, 
    HAZARD_COLORS["sea-level-rise"].base,
    HAZARD_COLORS["flash floods"].base,
    HAZARD_COLORS.inundations.base
  ];

  // Try to use the hazard's color first
  const hazardColor = getHazardColor(hazard);

  // If it's the default, use the indexed color family
  if (hazardColor === HAZARD_COLORS.default.base) {
    return colorFamilies[index % colorFamilies.length];
  }

  return hazardColor;
};

// Check if two labels would overlap
const wouldLabelsOverlap = (label1, label2, threshold = 30) => {
  const dx = label1.x - label2.x;
  const dy = label1.y - label2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < threshold;
};

// Find a non-overlapping position for a label
const findNonOverlappingPosition = (point, existingLabels, radius, angle, centerX, centerY) => {
  // Try different distances from the point
  const distances = [15, 20, 25, 30, 35];
  const angles = [
    angle - Math.PI/6, angle, angle + Math.PI/6,  // Near the original angle
    angle - Math.PI/3, angle + Math.PI/3,         // Bit farther
    angle - Math.PI/2, angle + Math.PI/2          // Perpendicular
  ];

  // Start with the default position
  let bestPosition = {
    x: point.x + 15 * Math.sin(angle),
    y: point.y - 15 * Math.cos(angle),
    overlaps: 0
  };

  // Try all combinations of distances and angles
  for (const distance of distances) {
    for (const testAngle of angles) {
      const testPosition = {
        x: point.x + distance * Math.sin(testAngle),
        y: point.y - distance * Math.cos(testAngle),
        overlaps: 0
      };

      // Count how many existing labels this would overlap with
      for (const existingLabel of existingLabels) {
        if (wouldLabelsOverlap(testPosition, existingLabel)) {
          testPosition.overlaps++;
        }
      }

      // If this position has fewer overlaps, use it
      if (testPosition.overlaps < bestPosition.overlaps) {
        bestPosition = testPosition;
      }

      // If we found a position with no overlaps, use it immediately
      if (bestPosition.overlaps === 0) {
        return bestPosition;
      }
    }
  }

  // Return the best position we found
  return bestPosition;
};

const HazardRadarChart = ({ riskAssessment, selectedHazards, setSelectedHazards }) => {
  const { t } = useTranslation(["sections", "common"]);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const [showComparisonTable, setShowComparisonTable] = useState(true);

  // Get top 3 hazards from risk assessment
  const topHazards = useMemo(() => {
    if (!riskAssessment || !riskAssessment.length) return [];

    // Filter out entries with missing data
    const validData = riskAssessment.filter(
      item => 
        item.hazard_score !== undefined && 
        item.exposure_score !== undefined && 
        item.vulnerability_score !== undefined
    );

    // Get top 3 hazards by risk score
    return [...validData]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 3) // Limited to top 3 hazards
      .map((risk, idx) => ({
        id: `${risk.hazard}-${risk.keyimpact}`,
        hazard: risk.hazard,
        keyimpact: risk.keyimpact,
        hazard_score: risk.hazard_score,
        exposure_score: risk.exposure_score,
        vulnerability_score: risk.vulnerability_score,
        risk_score: risk.risk_score,
        color: getDistinctColor(risk.hazard, idx)
      }));
  }, [riskAssessment]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width,
          height: Math.max(width * 0.8, 450)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize selected hazards if needed
  useEffect(() => {
    if (!selectedHazards && setSelectedHazards && topHazards.length > 0) {
      setSelectedHazards(topHazards.map(h => h.id));
    }
  }, [topHazards, selectedHazards, setSelectedHazards]);

  // D3 chart rendering
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !topHazards.length || !selectedHazards) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Filter selected hazards
    const displayedHazards = topHazards.filter(h => selectedHazards.includes(h.id));

    if (displayedHazards.length === 0) return;

    // Chart dimensions
    const margin = { top: 70, right: 140, bottom: 70, left: 120 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create a background circle with gridlines
    const backgroundG = svg.append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    // Add the background circle
    backgroundG.append("circle")
      .attr("r", radius)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    // Add radial grid lines
    [0.2, 0.4, 0.6, 0.8, 1].forEach(value => {
      backgroundG.append("circle")
        .attr("r", radius * value)
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");

      // Add value labels
      backgroundG.append("text")
        .attr("x", 0)
        .attr("y", -radius * value - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#6b7280")
        .text(value.toFixed(1));
    });

    // Define the axes (3 dimensions)
    const angles = [
      { name: t("common:metrics.climate_threat"), angle: 0, labelOffset: 15 },
      { name: t("common:metrics.vulnerability"), angle: (2 * Math.PI) / 3, labelOffset: 15 },
      { name: t("common:metrics.exposure"), angle: (4 * Math.PI) / 3, labelOffset: 15 }
    ];

    // Add axes lines
    angles.forEach(({ angle, name, labelOffset }) => {
      // Calculate end points
      const x2 = centerX + radius * Math.sin(angle);
      const y2 = centerY - radius * Math.cos(angle);

      // Draw line
      svg.append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1.5);

      // Position the label
      const labelX = centerX + (radius + labelOffset) * Math.sin(angle);
      const labelY = centerY - (radius + labelOffset) * Math.cos(angle);

      // Add label
      svg.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("fill", "#334155")
        .text(name);
    });

    // Add title
    svg.append("text")
      .attr("x", centerX)
      .attr("y", -36)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .attr("opacity", "0.7")
      .text(t("sections:hazard_radar.chart_title"));

    // Function to calculate point coordinates
    const getCoordinates = (hazard) => {
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      const values = [
        hazard.hazard_score,
        hazard.vulnerability_score, 
        hazard.exposure_score
      ];

      return values.map((value, i) => {
        return {
          x: centerX + value * radius * Math.sin(angles[i]),
          y: centerY - value * radius * Math.cos(angles[i]),
          value: value,
          angle: angles[i]
        };
      });
    };

    // To track label positions and avoid overlaps
    const labelPositions = [];

    // Draw hazard triangles
    displayedHazards.forEach((hazard) => {
      const points = getCoordinates(hazard);

      // Create triangle path
      const pathData = points.map((p, i) => 
        (i === 0 ? "M" : "L") + p.x + "," + p.y
      ).join(" ") + "Z";

      // Draw triangle with reduced opacity (0.25 instead of 0.4)
      svg.append("path")
        .attr("d", pathData)
        .attr("fill", hazard.color)
        .attr("fill-opacity", 0.25) // Reduced opacity for better visibility
        .attr("stroke", hazard.color)
        .attr("stroke-width", 2.5);

      // Add points at vertices
      points.forEach((point, i) => {
        svg.append("circle")
          .attr("cx", point.x)
          .attr("cy", point.y)
          .attr("r", 5)
          .attr("fill", hazard.color)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5);

        // Intelligently position value labels to avoid overlap
        const labelPos = findNonOverlappingPosition(
          point, 
          labelPositions, 
          radius, 
          point.angle,
          centerX,
          centerY
        );

        // Add to tracking array
        labelPositions.push(labelPos);

        // Create background for better readability
        svg.append("rect")
          .attr("x", labelPos.x - 18)
          .attr("y", labelPos.y - 10)
          .attr("width", 36)
          .attr("height", 20)
          .attr("rx", 4)
          .attr("fill", "white")
          .attr("opacity", 0.9)
          .attr("stroke", hazard.color)
          .attr("stroke-width", 1);

        // Add value label
        svg.append("text")
          .attr("x", labelPos.x)
          .attr("y", labelPos.y + 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#000")
          .text(point.value.toFixed(2));
      });
    });

    // Add legend
    const legendGroup = svg.append("g")
      .attr("transform", `translate(${width + 20}, 5)`);

    // Add legend title
    legendGroup.append("text")
      .attr("y", 0)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(t("common:legends.hazards", "Hazards"));

    // Add legend items
    displayedHazards.forEach((hazard, i) => {
      const g = legendGroup.append("g")
        .attr("transform", `translate(0, ${25 + i * 50})`);

      // Color box
      g.append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("rx", 2)
        .attr("fill", hazard.color);

      // Hazard name
      const hazardText = t(`common:hazards.${hazard.hazard.toLowerCase()}`, { defaultValue: hazard.hazard });
      g.append("text")
        .attr("x", 24)
        .attr("y", 12)
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .text(hazardText);

      // Sector name
      const sectorText = t(`common:sectors.${hazard.keyimpact.toLowerCase()}`, { defaultValue: hazard.keyimpact });
      g.append("text")
        .attr("x", 24)
        .attr("y", 30)
        .attr("font-size", "12px")
        .attr("fill", "#6b7280")
        .text(sectorText);
    });

  }, [riskAssessment, dimensions, selectedHazards, topHazards, t]);

  // Create comparison table data
  const comparisonData = useMemo(() => {
    if (!topHazards || !selectedHazards) return [];
    return topHazards
      .filter(h => selectedHazards.includes(h.id))
      .map(hazard => {
        const hazardText = t(`common:hazards.${hazard.hazard.toLowerCase()}`, { defaultValue: hazard.hazard });
        const sectorText = t(`common:sectors.${hazard.keyimpact.toLowerCase()}`, { defaultValue: hazard.keyimpact });
        return {
          ...hazard,
          hazardName: hazardText,
          sectorName: sectorText
        };
      });
  }, [topHazards, selectedHazards, t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
        <Info className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          {t("sections:hazard_radar.chart_explanation")}
        </p>
      </div>

      <div ref={containerRef} className="w-full min-h-[450px] capitalize flex flex-col">
        <div className="flex-grow flex justify-center items-center">
          <svg ref={svgRef} className="max-w-full overflow-visible" />
        </div>
      </div>

      {/* Comparison table toggle */}
      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-blue-500 w-4 h-4" />
          <h3 className="text-base font-medium">
            {t("sections:hazard_radar.detailed_comparison", "Detailed Comparison")}
          </h3>
        </div>
        <button
          onClick={() => setShowComparisonTable(!showComparisonTable)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showComparisonTable 
            ? t("common:actions.hide", "Hide") 
            : t("common:actions.show", "Show")}
        </button>
      </div>

      {/* Comparison table */}
      {showComparisonTable && comparisonData.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:hazard", "Hazard")}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:sector", "Sector")}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:metrics.climate_threat", "Hazard Score")}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:metrics.vulnerability", "Vulnerability")}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:metrics.exposure", "Exposure")}
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common:risk_score", "Risk Score")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonData.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <div className="ml-2 text-sm font-medium text-gray-900">{item.hazardName}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap capitalize text-sm text-gray-500">
                    {item.sectorName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.hazard_score.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.vulnerability_score.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.exposure_score.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.risk_score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HazardRadarChart;