import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as d3 from 'd3';
import { DownloadButton } from "../../utils/chartExportUtils";
import HazardRadarChart from "./HazardRadarChart";
import { formatKeyImpact } from "../../utils/textUtils";
import { getHazardColor, HAZARD_COLORS } from "../../constants/hazardColors";

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

const HazardRadarComparison = ({ riskAssessment }) => {
  const { t } = useTranslation(["sections", "common"]);

  // Get top 3 hazards for selector
  const topHazards = useMemo(() => {
    if (!riskAssessment || !riskAssessment.length) return [];

    // Filter out entries with missing data
    const validData = riskAssessment.filter(
      item => 
        item.hazard_score !== undefined && 
        item.exposure_score !== undefined && 
        item.vulnerability_score !== undefined
    );

    // Get top 3 hazards by risk score (changed from 5 to 3)
    return [...validData]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 3) // Limited to top 3 hazards
      .map((risk, index) => ({
        id: `${risk.hazard}-${risk.keyimpact}`,
        fullName: `${t(`common:hazards.${risk.hazard.toLowerCase()}`, { defaultValue: risk.hazard })} (${formatKeyImpact(risk.keyimpact, t)})`,
        hazard: risk.hazard,
        keyimpact: risk.keyimpact,
        risk_score: risk.risk_score,
        color: getDistinctColor(risk.hazard, index)
      }));
  }, [riskAssessment, t]);

  // State for selected hazards
  const [selectedHazards, setSelectedHazards] = useState(
    topHazards.map(hazard => hazard.id)
  );

  // Toggle hazard selection
  const toggleHazard = (hazardId) => {
    setSelectedHazards(prev =>
      prev.includes(hazardId)
        ? prev.filter(h => h !== hazardId)
        : [...prev, hazardId]
    );
  };

  const handleDownload = () => {
    const element = document.getElementById('hazard-radar-chart');
    if (element) {
      import("../../utils/chartExportUtils").then(module => {
        module.downloadAsPNG(element, 'hazard-radar-chart');
      });
    }
  };

  if (!topHazards.length) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
        {t('sections:hazard_radar.no_data')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Hazard selector */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-sm font-medium text-gray-700">
          {t('common:labels.hazards', 'Riscos:')}
        </label>
        <div className="flex flex-wrap gap-3">
          {topHazards.map((hazard) => (
            <button
              key={hazard.id}
              onClick={() => toggleHazard(hazard.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                hover:bg-opacity-90 active:scale-95 max-w-[250px] border
                ${selectedHazards.includes(hazard.id)
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
              style={{
                backgroundColor: selectedHazards.includes(hazard.id) ? hazard.color : 'white',
                borderColor: hazard.color,
                color: selectedHazards.includes(hazard.id) ? 
                  (d3.hsl(hazard.color).l > 0.6 ? '#000' : '#fff') : 
                  'inherit'
              }}
              title={hazard.fullName}
            >
              <span className="block truncate">
                {hazard.fullName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      <div id="hazard-radar-chart" className="flex-grow">
        <HazardRadarChart 
          riskAssessment={riskAssessment} 
          selectedHazards={selectedHazards}
          setSelectedHazards={setSelectedHazards}
        />
      </div>
    </div>
  );
};

export default HazardRadarComparison;