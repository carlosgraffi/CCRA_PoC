import React, { useMemo, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { getRiskLevel, formatScore, getRiskChangeDescription } from '../../constants/riskLevels';

const TopRisks = forwardRef(({ riskAssessment, resilienceScore }, ref) => {
  const { t } = useTranslation(['common', 'sections', 'hazards', 'components']);

  const topRisks = useMemo(() => {
    if (!riskAssessment || riskAssessment.length === 0) return [];

    return [...riskAssessment]
      .sort((a, b) => {
        const scoreA = a.risk_score ?? 0;
        const scoreB = b.risk_score ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [riskAssessment]);

  if (topRisks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('sections:top_risks.no_data')}
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col lg:flex-row gap-4">
      {topRisks.map((risk, index) => {
        const riskLevel = getRiskLevel(risk.risk_score);
        const changeDescription = resilienceScore !== null ?
          getRiskChangeDescription(risk.original_risk_score, risk.risk_score) : null;

        // Convert hazard name to a format matching translation keys (lowercase, with underscores)
        const hazardKey = risk.hazard?.toLowerCase().replace(/\s+/g, '_');
        const sectorKey = risk.keyimpact?.toLowerCase().replace(/\s+/g, '_');

        return (
          <div 
            key={`${risk.hazard}-${risk.keyimpact}-${index}`}
            className="flex-1 p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          > 
            {/* Urgency Banner for High and Very High Risks */}
            {(riskLevel.label === 'High' || riskLevel.label === 'Very High') && (
              <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-md text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p>{t('components:topRisks.priority_action_required')}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="uppercase text-gray-600 text-xs font-semibold tracking-wider">
                {t(`common:sectors.${sectorKey}`, 
                  { defaultValue: t(`common:common.sectors.${risk.keyimpact}`, { defaultValue: risk.keyimpact }) })}
              </div>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: riskLevel.backgroundColor,
                  color: riskLevel.textColor
                }}
              >
                {t(`common:risk_levels.${riskLevel.label.toLowerCase()}`)}
              </span>
            </div>

            {/* Hazard Name */}
            <div className="mb-6">
              <h4 className="text-2xl font-semibold capitalize text-gray-900">
                {t(`common:hazards.${hazardKey}`, { defaultValue: risk.hazard })}
              </h4>
              <span className="text-gray-500 text-sm">
                {t('components:topRisks.climate_hazard')}
              </span>
            </div>

            {/* Risk Score */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600 text-sm font-medium">
                  {t('components:topRisks.risk_score')}
                </span>
                <div className="flex items-baseline gap-2">
                  {resilienceScore !== null && (
                    <span className="text-gray-500 text-sm">
                      {formatScore(risk.original_risk_score)}
                    </span>
                  )}
                  <span className="text-3xl font-bold" style={{ color: riskLevel.color }}>
                    {formatScore(risk.risk_score)}
                  </span>
                </div>
              </div>

              {changeDescription && (
                <div className="text-sm text-right" style={{ color: changeDescription.color }}>
                  {changeDescription.text}
                </div>
              )}

              {/* Progress bars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => {
                  const thresholds = [0.01, 0.078, 0.165, 0.289, 0.508];
                  const isActive = risk.risk_score >= thresholds[i];

                  return (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        isActive ? 'bg-current' : 'bg-gray-200'
                      }`}
                      style={{ color: isActive ? riskLevel.color : undefined }}
                    />
                  );
                })}
              </div>

              {/* Component Scores */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('common:labels.hazard_score')}</span>
                  <span className="font-medium text-gray-900">
                    {formatScore(risk.hazard_score)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('common:labels.exposure_score')}</span>
                  <span className="font-medium text-gray-900">
                    {formatScore(risk.exposure_score)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('common:labels.vulnerability_score')}</span>
                  <div className="flex items-baseline gap-2">
                    {resilienceScore !== null && (
                      <span className="text-gray-500 text-xs">
                        {formatScore(risk.original_vulnerability_score)}
                      </span>
                    )}
                    <span className={`font-medium ${
                      resilienceScore !== null ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {formatScore(risk.vulnerability_score)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Human impact explanation */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {t('components:topRisks.potential_impacts')}
              </h5>
              <p className="text-sm text-gray-600">
                {t(`components:impacts.${hazardKey}.${sectorKey}`, {
                  defaultValue: t(`components:impacts.${hazardKey}.general`, {
                    defaultValue: t(`components:impacts.general.${sectorKey}`, {
                      defaultValue: t('components:impacts.general.default')
                    })
                  })
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

TopRisks.displayName = 'TopRisks';
export default TopRisks;