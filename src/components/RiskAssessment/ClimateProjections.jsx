import React, { useState, useEffect, useMemo, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Info, AlertTriangle, GitBranch } from "lucide-react";
import { getHazardColor } from "../../constants/hazardColors";
import {
  getIndexDescription,
  getIndexHazardType,
  getIndexUnit,
  getIndexTrend,
} from "../../constants/climateIndices";
import { fetchCityClimateData } from "../../api/climateDataApi";
import ClimateDetailModal from "./ClimateDetailModal";
import {
  generateTimeseriesChartData,
  calculateTimeseriesDomain,
  calculateTrendLineData,
} from "../../utils/climateUtils";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation(["sections", "climate_indices", "common"]);

  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => {
        // Extract data from the payload entry
        const dataKey = entry.dataKey;
        const name = entry.name || '';
        const isTrend = dataKey.includes('trend') || name.includes('trend');

        // Default scenario to empty to ensure we'll always have something
        let scenario = '';

        if (name === "optimistic_trend" || name === "optimistic") {
          scenario = "optimistic";
        } else if (name === "pessimistic_trend" || name === "pessimistic") {
          scenario = "pessimistic";
        } else if (dataKey.includes("rcp45")) {
          scenario = "optimistic";
        } else if (dataKey.includes("rcp85")) {
          scenario = "pessimistic";
        } else if (dataKey.includes("historical")) {
          scenario = "historical";
        }

        // Get the indexCode from the payload
        const indexCode = payload[0]?.payload?.indexCode;

        // Get the unit for this index
        const unit = getIndexUnit(indexCode);

        // Get the translated scenario name
        const displayScenario = t(`common:scenarios.${scenario}`, { defaultValue: scenario });

        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">
              {`${displayScenario}${isTrend ? " " + t("sections:projections.trend_line") : ""}`}:
            </span>
            <span className="font-medium" style={{ color: entry.color }}>
              {typeof entry.value === "number"
                ? entry.value.toFixed(2)
                : entry.value}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const getClimateIndicesExplanation = (t) => (
  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
    <h3 className="font-medium text-blue-800 mb-2">
      {t("sections:projections.explanations_title")}
    </h3>
    <p className="text-sm text-blue-700">
      {t("sections:projections.explanations")}
    </p>
  </div>
);

const ClimateProjections = forwardRef(({ cityname }, ref) => {
  const { t, i18n } = useTranslation([
    "sections",
    "common",
    "climate_indices",
  ]);

  const [cityData, setCityData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedScenarios, setSelectedScenarios] = useState({
    rcp45: true,
    rcp85: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeseriesRange, setTimeseriesRange] = useState({
    start: 2006,
    end: 2050,
  });
  const [showTrendLines, setShowTrendLines] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!cityname) return;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCityClimateData(cityname);
        setCityData(data);

        const availableIndices = Object.keys(data.indices);
        if (availableIndices.length > 0) {
          setSelectedIndex(availableIndices[0]);
        }
      } catch (err) {
        console.error("Error fetching climate data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cityname]);

  const timeseriesChartData = useMemo(() => {
    const data = generateTimeseriesChartData(
      cityData,
      selectedIndex,
      selectedScenarios,
      timeseriesRange
    );

    // Ensure each data point has the indexCode property
    return data.map(point => ({
      ...point,
      indexCode: selectedIndex
    }));
  }, [cityData, selectedIndex, selectedScenarios, timeseriesRange]);

  const trendLineData = useMemo(() => {
    if (!showTrendLines) return { rcp45: [], rcp85: [] };

    // Calculate trend lines data and ensure indexCode is present
    const calculateTrendWithIndex = (data, scenario) => {
      const trendData = calculateTrendLineData(data, scenario);
      return trendData.map(point => ({
        ...point,
        indexCode: selectedIndex
      }));
    };

    return {
      rcp45: selectedScenarios.rcp45
        ? calculateTrendWithIndex(timeseriesChartData, "rcp45")
        : [],
      rcp85: selectedScenarios.rcp85
        ? calculateTrendWithIndex(timeseriesChartData, "rcp85")
        : [],
    };
  }, [timeseriesChartData, selectedScenarios, showTrendLines, selectedIndex]);

  // Debug the trend lines data
  useEffect(() => {
    console.log('Trend line data:', trendLineData);
  }, [trendLineData]);

  const timeseriesDomain = useMemo(() => {
    const allTrendData = [
      ...(trendLineData.rcp45 || []),
      ...(trendLineData.rcp85 || []),
    ];
    return calculateTimeseriesDomain(timeseriesChartData, allTrendData);
  }, [timeseriesChartData, trendLineData]);

  const toggleScenario = (scenario) => {
    setSelectedScenarios((prev) => ({
      ...prev,
      [scenario]: !prev[scenario],
    }));
  };

  const handleTimeRangeChange = (e) => {
    const { name, value } = e.target;
    setTimeseriesRange((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const trendInfo = useMemo(() => {
    if (!selectedIndex) return null;
    return getIndexTrend(selectedIndex, i18n.language);
  }, [selectedIndex, i18n.language]);

  const anomalyInfo = useMemo(() => {
    if (!cityData || !selectedIndex) return null;

    const indexData = cityData.indices[selectedIndex];
    if (!indexData?.projections?.rcp85?.periods?.mid) return null;

    const anomaly = indexData.projections.rcp85.periods.mid.anomaly;
    const trend = getIndexTrend(selectedIndex);

    const baselineValue = indexData.historical?.baseline?.value || 0;
    const percentChange =
      baselineValue !== 0 ? (anomaly / baselineValue) * 100 : 0;
    const isSignificant = Math.abs(percentChange) >= 10;

    const isConcerning =
      isSignificant &&
      ((anomaly > 0 && trend.negative) || (anomaly < 0 && !trend.negative));

    return {
      value: anomaly,
      percentChange,
      isPositive: anomaly > 0,
      isSignificant,
      isConcerning,
    };
  }, [cityData, selectedIndex]);

  const availableIndices = cityData
    ? Object.keys(cityData.indices).filter((index) => {
        const idx = cityData.indices[index];
        return (
          idx.historical?.baseline?.value !== undefined ||
          idx.projections?.rcp45?.periods?.near?.value !== undefined ||
          idx.projections?.rcp85?.periods?.near?.value !== undefined
        );
      })
    : [];

  const timeseriesYearRange = useMemo(() => {
    if (!selectedIndex || !cityData?.indices?.[selectedIndex])
      return { start: 2006, end: 2099 };

    const indexData = cityData.indices[selectedIndex];
    let startYear = 2006;
    let endYear = 2099;

    if (indexData.projections?.rcp45?.timeseriesStart) {
      startYear = Math.min(startYear, indexData.projections.rcp45.timeseriesStart);
    }
    if (indexData.projections?.rcp85?.timeseriesStart) {
      startYear = Math.min(startYear, indexData.projections.rcp85.timeseriesStart);
    }
    if (indexData.projections?.rcp45?.timeseriesEnd) {
      endYear = Math.max(endYear, indexData.projections.rcp45.timeseriesEnd);
    }
    if (indexData.projections?.rcp85?.timeseriesEnd) {
      endYear = Math.max(endYear, indexData.projections.rcp85.timeseriesEnd);
    }

    return { start: startYear, end: endYear };
  }, [cityData, selectedIndex]);

  if (loading) {
    return <div className="text-center py-10">{t("common:loading")}</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!cityData || availableIndices.length === 0) {
    return (
      <div className="text-center py-10">
        {t("sections:projections.no_data")}
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      {/* Explanation */}
      {getClimateIndicesExplanation(t)}

      {/* Climate index selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-500">
          {t("common:labels.climate_indices")}:
        </label>
        <div className="flex flex-wrap gap-3">
          {availableIndices.map((index) => {
            const hazardType = getIndexHazardType(index);
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  index === selectedIndex
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor:
                    index === selectedIndex
                      ? getHazardColor(hazardType)
                      : undefined,
                }}
              >
                {t(`climate_indices:${index}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario toggles */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-500">
          {t("common:labels.scenarios")}:
        </label>
      <div className="flex gap-3 flex-wrap">

        <button
          onClick={() => toggleScenario("rcp45")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            selectedScenarios.rcp45
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          {t("common:scenarios.optimistic")}
        </button>
        <button
          onClick={() => toggleScenario("rcp85")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            selectedScenarios.rcp85
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          {t("common:scenarios.pessimistic")}
        </button>
        <button
          onClick={() => setShowTrendLines(!showTrendLines)}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
            showTrendLines
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          <GitBranch size={16} />
          {t("sections:projections.trend_lines")}
        </button>
      </div>
      </div>

      {/* Time range selector */}
      <div className="flex gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-500">
          {t("common:labels.year")} {t("sections:projections.range")}:
        </label>
        <input
          type="number"
          name="start"
          min={timeseriesYearRange.start}
          max={timeseriesRange.end}
          value={timeseriesRange.start}
          onChange={handleTimeRangeChange}
          className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
        />
        <input
          type="number"
          name="end"
          min={timeseriesRange.start}
          max={timeseriesYearRange.end}
          value={timeseriesRange.end}
          onChange={handleTimeRangeChange}
          className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
        />
      </div>

      {/* Index description & anomaly alert */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex gap-3">
          <Info size={20} className="text-blue-600" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t(`climate_indices:${selectedIndex}`)}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {getIndexDescription(selectedIndex, i18n.language)}
            </p>

            {trendInfo && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">
                  {t("sections:projections.trend")}:
                </span>{" "}
                {trendInfo.description}
              </p>
            )}

            {anomalyInfo?.isConcerning && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <p className="text-sm text-amber-800">
                  {t("sections:projections.significant_change", {
                    direction: anomalyInfo.isPositive
                      ? t("sections:projections.increase")
                      : t("sections:projections.decrease"),
                    percent: Math.abs(Math.round(anomalyInfo.percentChange)),
                    by2050: "2050",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart header with "See Details" button */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-900">
          {t("sections:projections.time_series_title")}
        </h4>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300"
        >
          {t("common:actions.view_details")}
        </button>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeseriesChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis
              dataKey="year"
              tick={{ fill: "#6b7280" }}
              domain={[timeseriesRange.start, timeseriesRange.end]}
              type="number"
              allowDecimals={false}
            />
            <YAxis
              domain={timeseriesDomain}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
              label={{
                value: getIndexUnit(selectedIndex),
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => t(`common:scenarios.${value}`, { defaultValue: value })} />

            {/* Reference lines */}
            {[2030, 2050].map((year) =>
              timeseriesRange.start <= year &&
              timeseriesRange.end >= year ? (
                <ReferenceLine
                  key={year}
                  x={year}
                  stroke="#888"
                  strokeDasharray="3 3"
                  label={{
                    value: year,
                    position: "top",
                    fill: "#888",
                    fontSize: 12,
                  }}
                />
              ) : null
            )}

            {selectedScenarios.rcp45 && (
              <Line
                type="monotone"
                dataKey="rcp45_value"
                name="optimistic"
                stroke={getHazardColor(getIndexHazardType(selectedIndex), "optimistic")}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
              />
            )}

            {selectedScenarios.rcp85 && (
              <Line
                type="monotone"
                dataKey="rcp85_value"
                name="pessimistic"
                stroke={getHazardColor(getIndexHazardType(selectedIndex), "pessimistic")}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
              />
            )}

            {/* Trend lines */}
            {showTrendLines && selectedScenarios.rcp45 && trendLineData.rcp45.length > 0 && (
              <Line
                type="linear"
                dataKey="rcp45_trend"
                name="optimistic_trend"
                data={trendLineData.rcp45}
                stroke={getHazardColor(getIndexHazardType(selectedIndex), "optimistic")}
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.7}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}

            {showTrendLines && selectedScenarios.rcp85 && trendLineData.rcp85.length > 0 && (
              <Line
                type="linear"
                dataKey="rcp85_trend"
                name="pessimistic_trend"
                data={trendLineData.rcp85}
                stroke={getHazardColor(getIndexHazardType(selectedIndex), "pessimistic")}
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.7}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail modal */}
      {selectedIndex && (
        <ClimateDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cityName={cityname}
          indexCode={selectedIndex}
          indexData={cityData.indices[selectedIndex]}
        />
      )}
    </div>
  );
});

ClimateProjections.displayName = "ClimateProjections";
export default ClimateProjections;