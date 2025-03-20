import React from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronUp, ChevronDown, AlertTriangle, HelpCircle } from "lucide-react";
import {
  getIndexDescription,
  getIndexUnit,
  getIndexTrend,
  getIndexHazardType,
} from "../../constants/climateIndices";
import { getHazardColor } from "../../constants/hazardColors";

/**
 * Modal that displays detailed information about a climate index
 */
const ClimateDetailModal = ({
  isOpen,
  onClose,
  cityName,
  indexCode,
  indexData,
}) => {
  const { t, i18n } = useTranslation(["sections", "common", "climate_indices"]);

  if (!isOpen || !indexCode || !indexData) return null;

  const calculatePercentageChange = (baseline, projected) => {
    if (!baseline || !projected) return null;
    return ((projected - baseline) / baseline) * 100;
  };

  const unit = getIndexUnit(indexCode);
  const hazardType = getIndexHazardType(indexCode);
  const trend = getIndexTrend(indexCode, i18n.language);

  const baseline = indexData.historical?.baseline?.value;

  const rcp45_2030 = indexData.projections?.rcp45?.periods?.near?.value;
  const rcp45_2050 = indexData.projections?.rcp45?.periods?.mid?.value;
  const rcp85_2030 = indexData.projections?.rcp85?.periods?.near?.value;
  const rcp85_2050 = indexData.projections?.rcp85?.periods?.mid?.value;

  const percentChanges = {
    rcp45_2030: calculatePercentageChange(baseline, rcp45_2030),
    rcp45_2050: calculatePercentageChange(baseline, rcp45_2050),
    rcp85_2030: calculatePercentageChange(baseline, rcp85_2030),
    rcp85_2050: calculatePercentageChange(baseline, rcp85_2050),
  };

  const isConcerning = (value, percentChange) => {
    if (value === null || percentChange === null) return false;
    const isSignificant = Math.abs(percentChange) >= 10;
    return (
      isSignificant &&
      ((value > baseline && trend.negative) ||
        (value < baseline && !trend.negative))
    );
  };

  const renderValueCell = (value, percentChange) => {
    if (value === null)
      return <td className="px-4 py-3 text-sm text-gray-400">—</td>;

    const changeIcon =
      percentChange > 0 ? (
        <ChevronUp className="w-4 h-4 text-red-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-green-500" />
      );

    const concerning = isConcerning(value, percentChange);

    return (
      <td className="px-4 py-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-gray-900 font-medium">
            {value.toFixed(2)} {unit}
          </span>
          {percentChange !== null && (
            <div className="flex items-center gap-1">
              {changeIcon}
              <span
                className={`text-xs ${percentChange > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {Math.abs(percentChange).toFixed(1)}%
              </span>

              {concerning && (
                <AlertTriangle size={12} className="text-amber-500 ml-1" />
              )}
            </div>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t(`climate_indices:${indexCode}`)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{cityName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
          {/* Detailed Index Explanation */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <HelpCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">
                  {t("sections:projections.modal.what_is_index")}
                </h3>
                <p className="text-sm text-blue-700">
                  {t(`climate_indices:descriptions.${indexCode}`)}
                </p>
              </div>
            </div>
          </div>

          {/* Description and trend */}
          <div className="mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 mt-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getHazardColor(hazardType) }}
              />
              <div>
                <p className="text-gray-700">
                  {getIndexDescription(indexCode, i18n.language)}
                </p>

                {trend && (
                  <p className="text-gray-700 mt-2">
                    <span className="font-medium">
                      {t("sections:projections.trend")}:
                    </span>{" "}
                    {trend.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Projected changes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {t("sections:projections.modal.projected_changes")}
            </h3>

            {(rcp45_2030 || rcp45_2050 || rcp85_2030 || rcp85_2050) ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                        {t("sections:projections.modal.time_period")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                        {t("sections:projections.modal.optimistic")} (RCP 4.5)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                        {t("sections:projections.modal.pessimistic")} (RCP 8.5)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        2030 (2020-2040)
                      </td>
                      {renderValueCell(rcp45_2030, percentChanges.rcp45_2030)}
                      {renderValueCell(rcp85_2030, percentChanges.rcp85_2030)}
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        2050 (2040-2060)
                      </td>
                      {renderValueCell(rcp45_2050, percentChanges.rcp45_2050)}
                      {renderValueCell(rcp85_2050, percentChanges.rcp85_2050)}
                    </tr>
                  </tbody>
                </table>

                <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                  <AlertTriangle size={12} className="text-amber-500 mt-0.5" />
                  <p>{t("sections:projections.modal.warning_icon_note")}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t("sections:projections.modal.no_projections")}
              </p>
            )}
          </div>

          {/* Interpretation */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("sections:projections.modal.interpretation")}
            </h3>

            <p className="text-sm text-gray-700">
              {t("sections:projections.modal.data_explanation")}
            </p>

            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>{t("sections:projections.modal.rcp45")}:</strong>{" "}
                  {t("sections:projections.modal.rcp45_explanation")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>{t("sections:projections.modal.rcp85")}:</strong>{" "}
                  {t("sections:projections.modal.rcp85_explanation")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimateDetailModal;