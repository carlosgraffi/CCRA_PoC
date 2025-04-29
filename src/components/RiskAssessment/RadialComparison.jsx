import React, { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { capitalize } from '../../utils/textUtils';
import { RADIAL_COLORS } from '../../constants/radialColors';
import { formatScore } from '../../constants/riskLevels';

const formatKeyImpact = (keyimpact, t) => {
  const translationKey = `common:sectors.${keyimpact.toLowerCase()}`;
  return t(translationKey, { defaultValue: keyimpact });
};

// Function to truncate text with ellipsis
const truncateText = (text, maxLength = 30) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const CustomTooltip = ({ active, payload }) => {
  const { t } = useTranslation();

  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900 mb-2">
        {payload[0].payload.fullName}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {formatScore(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RadialComparison = forwardRef(({ riskAssessment }, ref) => {
  const { t } = useTranslation();

  const metrics = [
    { key: "hazard_score", label: t('common:metrics.climate_threat'), color: RADIAL_COLORS.first.base },
    { key: "exposure_score", label: t('common:metrics.exposure'), color: RADIAL_COLORS.third.base },
    { key: "vulnerability_score", label: t('common:metrics.vulnerability'), color: RADIAL_COLORS.second.base }
  ];

  const topHazards = [...(riskAssessment || [])]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 3)
    .map(risk => {
      const fullName = `${t(`common:hazards.${risk.hazard.toLowerCase()}`)} (${formatKeyImpact(risk.keyimpact, t)})`;
      return {
        id: `${risk.hazard}-${risk.keyimpact}`,
        fullName,
        name: truncateText(fullName, 25),
        hazard: risk.hazard,
        keyimpact: risk.keyimpact,
        hazard_score: risk.hazard_score,
        exposure_score: risk.exposure_score,
        vulnerability_score: risk.vulnerability_score
      };
    });

  const [selectedHazards, setSelectedHazards] = useState(
    topHazards.map(hazard => hazard.id)
  );

  const toggleHazard = (hazardId) => {
    setSelectedHazards(prev =>
      prev.includes(hazardId)
        ? prev.filter(h => h !== hazardId)
        : [...prev, hazardId]
    );
  };

  if (!topHazards.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {t('sections:hazard_comparison.no_data')}
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-sm font-medium text-gray-700">
          {t('common:labels.hazards')}:
        </label>
        <div className="flex flex-wrap gap-3">
          {topHazards.map((hazard) => (
            <button
              key={hazard.id}
              onClick={() => toggleHazard(hazard.id)}
              className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-all
                hover:scale-105 active:scale-95 max-w-[250px]
                ${selectedHazards.includes(hazard.id)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={hazard.fullName}
            >
              <span className="block truncate">
                {hazard.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topHazards.filter(hazard => selectedHazards.includes(hazard.id))}
            margin={{ top: 20, right: 30, bottom: 70, left: 30 }}
            barGap={10}
            barSize={35}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ 
                fill: '#575757', 
                fontSize: 12, 
                fontFamily: 'Inter',
                width: 150,
              }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={value => formatScore(value)}
              tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#575757' }}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            {metrics.map((metric) => (
              <Bar
                key={metric.key}
                dataKey={metric.key}
                name={capitalize(metric.label)}
                fill={metric.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-center items-center">
        <div className="flex flex-wrap gap-4 justify-center">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
              <span className="text-sm font-medium text-gray-600">
                {capitalize(metric.label)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

RadialComparison.displayName = 'RadialComparison';
export default RadialComparison;