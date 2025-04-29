import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Info, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import ResilienceDisclaimer from "./ResilienceDisclaimer";
import RiskDetailModal from "./RiskDetailModal";
import FilterDropdown from "../FilterDropdown";
import {
  getRiskLevel,
  getRiskChangeDescription,
  formatScore,
} from "../../constants/riskLevels";

const RiskTable = ({ riskAssessment, actor_id, resilienceScore }) => {
  const { t } = useTranslation(["common", "sections"]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "risk_score",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    key_impact: [],
    hazard: [],
    risk_level: [],
  });
  const [tooltipRow, setTooltipRow] = useState(null);

  // Get unique values for filters
  const filterOptions = useMemo(
    () => ({
      key_impact: [
        ...new Set(riskAssessment?.map((item) => item.keyimpact) || []),
      ],
      hazard: [...new Set(riskAssessment?.map((item) => item.hazard) || [])],
      risk_level: [
        ...new Set(
          riskAssessment?.map((item) => getRiskLevel(item.risk_score).label) ||
            [],
        ),
      ],
    }),
    [riskAssessment],
  );

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle filtering
  const handleFilter = (type, values) => {
    setFilters((prev) => ({
      ...prev,
      [type]: values,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      key_impact: [],
      hazard: [],
      risk_level: [],
    });
  };

  // Get sort value based on column type
  const getSortValue = (item, key) => {
    switch (key) {
      case "latest_year":
        return parseInt(item[key]);
      case "risk_score":
        return parseFloat(item[key]);
      case "keyimpact":
        return item[key].toLowerCase();
      case "hazard":
        return item[key].toLowerCase();
      case "risk_level":
        return getRiskLevel(item.risk_score).value;
      default:
        return item[key];
    }
  };

  // Apply sorting and filtering
  const sortedAndFilteredData = useMemo(() => {
    if (!riskAssessment) return [];

    let filteredData = riskAssessment.filter((item) => {
      const matchesKeyImpact =
        filters.key_impact.length === 0 ||
        filters.key_impact.includes(item.keyimpact);
      const matchesHazard =
        filters.hazard.length === 0 || filters.hazard.includes(item.hazard);
      const matchesRiskLevel =
        filters.risk_level.length === 0 ||
        filters.risk_level.includes(getRiskLevel(item.risk_score).label);

      return matchesKeyImpact && matchesHazard && matchesRiskLevel;
    });

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }, [riskAssessment, sortConfig, filters]);

  const handleShowDetails = (row) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const handleRowClick = (row) => {
    handleShowDetails(row);
  };

  const showTooltip = (e, row) => {
    e.stopPropagation();
    setTooltipRow(row);
  };

  const hideTooltip = () => {
    setTooltipRow(null);
  };

  if (!riskAssessment || riskAssessment.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("sections:ccra_table.no_data")}
      </div>
    );
  }

  const columns = [
    { key: "hazard", label: "hazard", sortable: true },
    { key: "keyimpact", label: "key_impact", sortable: true },
    { key: "risk_level", label: "risk_score", sortable: true },
    { key: "latest_year", label: "year", sortable: true },
  ];

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 inline-block ml-1 text-gray-300" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline-block ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      <ResilienceDisclaimer resilienceScore={resilienceScore} />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {t("sections:ccra_table.title")}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({sortedAndFilteredData.length} {t("common:items")})
          </span>
        </h3>
        <FilterDropdown
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilter}
          onClearFilters={handleClearFilters}
          riskAssessment={riskAssessment}
          t={t}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(({ key, label, sortable }) => (
                <th
                  key={key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <button
                    className={`flex items-center ${sortable ? "cursor-pointer hover:text-gray-700" : "cursor-default"}`}
                    onClick={() => sortable && handleSort(key)}
                    disabled={!sortable}
                  >
                    {t(`sections:ccra_table.columns.${label}`)}
                    {sortable && <SortIndicator columnKey={key} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredData.map((row, index) => {
              const riskLevel = getRiskLevel(row.risk_score);
              const changeDescription =
                resilienceScore !== null
                  ? getRiskChangeDescription(
                      row.original_risk_score,
                      row.risk_score,
                    )
                  : null;

              return (
                <tr
                  key={`${row.keyimpact}-${row.hazard}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {t(`common:hazards.${row.hazard.toLowerCase()}`, {
                      defaultValue: row.hazard,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {t(
                      `common:sectors.${row.keyimpact.toLowerCase().replace(/ /g, "_")}`,
                      { defaultValue: row.keyimpact },
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <div
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: riskLevel.backgroundColor,
                          color: riskLevel.textColor,
                        }}
                        onMouseEnter={(e) => showTooltip(e, row)}
                        onMouseLeave={hideTooltip}
                      >
                        {t(
                          `common:risk_levels.${riskLevel.label.toLowerCase().replace(/ /g, "_")}`,
                        )}
                        {row.indicator_count > 0 && (
                          <Info className="w-4 h-4 ml-1 opacity-75" />
                        )}
                      </div>

                      {tooltipRow === row && (
                        <div className={`absolute z-10 w-80 bg-white rounded-md shadow-lg border border-gray-200 p-4 left-0 -ml-20 ${
                          index >= sortedAndFilteredData.length - 3 ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}>
                          <div className="space-y-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {t("sections:ccra_table.component_scores")}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-gray-600">
                                {t("common:metrics.climate_threat")}:
                              </div>
                              <div className="text-right font-medium">
                                {formatScore(row.hazard_score)}
                              </div>

                              <div className="text-gray-600">
                                {t("common:metrics.exposure")}:
                              </div>
                              <div className="text-right font-medium">
                                {formatScore(row.exposure_score)}
                              </div>

                              <div className="text-gray-600">
                                {t("common:metrics.vulnerability")}:
                              </div>
                              <div className="text-right font-medium">
                                {resilienceScore !== null && (
                                  <span className="text-gray-500 text-xs mr-1">
                                    {formatScore(
                                      row.original_vulnerability_score,
                                    )}{" "}
                                    →{" "}
                                  </span>
                                )}
                                <span
                                  className={
                                    resilienceScore !== null
                                      ? "text-blue-600"
                                      : ""
                                  }
                                >
                                  {formatScore(row.vulnerability_score)}
                                </span>
                                {row.indicator_count > 0 && (
                                  <span className="text-gray-500 text-xs ml-1">
                                    ({row.indicator_count})
                                  </span>
                                )}
                              </div>

                              <div className="text-gray-600 font-medium col-span-2 border-t pt-1 mt-1">
                                {t("common:labels.risk_score")}:
                              </div>
                              <div className="col-span-2 text-right">
                                {resilienceScore !== null && (
                                  <span className="text-gray-500 text-xs mr-1">
                                    {formatScore(row.original_risk_score)} →{" "}
                                  </span>
                                )}
                                <span
                                  className="font-bold text-base"
                                  style={{ color: riskLevel.indicatorColor }}
                                >
                                  {formatScore(row.risk_score)}
                                </span>
                                {changeDescription && (
                                  <span
                                    className="text-xs ml-1"
                                    style={{ color: changeDescription.color }}
                                  >
                                    ({changeDescription.text})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 italic mt-2">
                              {t("sections:ccra_table.click_for_details")}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.latest_year}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center">
          <AlertTriangle className="text-yellow-500 w-5 h-5 mr-2" />
          <span className="text-yellow-700">
            {t("sections:ccra_table.no_matching_results")}
          </span>
        </div>
      )}

      <RiskDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rowData={selectedRow}
        actor_id={actor_id}
      />
    </div>
  );
};

export default RiskTable;
