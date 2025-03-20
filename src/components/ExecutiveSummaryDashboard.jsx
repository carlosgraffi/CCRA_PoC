import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  ShieldAlert, 
  BarChart3,
  ActivitySquare
} from 'lucide-react';
import { getRiskLevel, formatScore, riskLevels } from '../constants/riskLevels';
import { getHazardColor } from '../constants/hazardColors';

/**
 * ExecutiveSummaryDashboard component provides an overview of key climate risks
 * and metrics for the selected city.
 */
const ExecutiveSummaryDashboard = ({ riskAssessment, cityname, region }) => {
  const { t } = useTranslation(['common', 'sections', 'dashboard']);

  // Calculate summary metrics from risk assessment data
  const summary = useMemo(() => {
    if (!riskAssessment || riskAssessment.length === 0) {
      return {
        highRiskCount: 0,
        veryHighRiskCount: 0,
        averageRiskScore: 0,
        topHazard: null,
        topSector: null
      };
    }

    // Filter risks by level
    const highRisks = riskAssessment.filter(risk => risk.risk_score >= 0.289 && risk.risk_score < 0.508);
    const veryHighRisks = riskAssessment.filter(risk => risk.risk_score >= 0.508);

    // Group by hazard to find most common/severe hazard
    const hazardScores = riskAssessment.reduce((acc, risk) => {
      const hazard = risk.hazard;
      if (!acc[hazard]) {
        acc[hazard] = { count: 0, totalRisk: 0 };
      }
      acc[hazard].count += 1;
      acc[hazard].totalRisk += risk.risk_score;
      return acc;
    }, {});

    const topHazard = Object.entries(hazardScores)
      .sort((a, b) => b[1].totalRisk - a[1].totalRisk)[0]?.[0];

    // Group by sector to find most vulnerable sector
    const sectorScores = riskAssessment.reduce((acc, risk) => {
      const sector = risk.keyimpact;
      if (!acc[sector]) {
        acc[sector] = { count: 0, totalRisk: 0 };
      }
      acc[sector].count += 1;
      acc[sector].totalRisk += risk.risk_score;
      return acc;
    }, {});

    const topSector = Object.entries(sectorScores)
      .sort((a, b) => b[1].totalRisk - a[1].totalRisk)[0]?.[0];

    // Calculate average risk score
    const totalRiskScore = riskAssessment.reduce((sum, risk) => sum + risk.risk_score, 0);
    const averageRiskScore = totalRiskScore / riskAssessment.length;

    return {
      highRiskCount: highRisks.length,
      veryHighRiskCount: veryHighRisks.length,
      averageRiskScore,
      topHazard,
      topSector,
      totalHazards: riskAssessment.length
    };
  }, [riskAssessment]);

  // Get urgency level based on risk counts
  const getUrgencyLevel = () => {
    if (summary.veryHighRiskCount > 0) return 'high';
    if (summary.highRiskCount > 0) return 'medium';
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel();

  // Get color classes based on urgency level, using the existing risk level colors
  const getUrgencyColor = (level) => {
    switch (level) {
      case 'high': return {
        bg: riskLevels.VERY_HIGH.backgroundColor,
        border: 'border-red-200', 
        textColor: riskLevels.VERY_HIGH.textColor,
        borderColor: riskLevels.VERY_HIGH.color,
        icon: <AlertTriangle className="h-5 w-5" style={{ color: riskLevels.VERY_HIGH.color }} />
      };
      case 'medium': return {
        bg: riskLevels.VERY_HIGH.backgroundColor, // Use red for medium urgency too
        border: 'border-red-200',
        textColor: riskLevels.VERY_HIGH.textColor,
        borderColor: riskLevels.VERY_HIGH.color,
        icon: <ShieldAlert className="h-5 w-5" style={{ color: riskLevels.VERY_HIGH.color }} />
      };
      case 'low': return {
        bg: riskLevels.MEDIUM.backgroundColor,
        border: 'border-yellow-200',
        textColor: riskLevels.MEDIUM.textColor,
        borderColor: riskLevels.MEDIUM.color,
        icon: <ActivitySquare className="h-5 w-5" style={{ color: riskLevels.MEDIUM.color }} />
      };
      default: return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        textColor: '#374151',
        borderColor: '#6B7280',
        icon: <ActivitySquare className="h-5 w-5 text-gray-600" />
      };
    }
  };

  const urgencyStyle = getUrgencyColor(urgencyLevel);

  // Generate summary text based on risk levels
  const getSummaryText = () => {
    if (summary.veryHighRiskCount > 0) {
      return t('dashboard:summary.high_urgency', { 
        cityname, 
        count: summary.veryHighRiskCount,
        topHazard: t(`common:hazards.${summary.topHazard?.toLowerCase()}`, { 
          defaultValue: summary.topHazard 
        }),
        topSector: t(`common:sectors.${summary.topSector?.toLowerCase().replace(/\s+/g, '_')}`, { 
          defaultValue: summary.topSector 
        })
      });
    }

    if (summary.highRiskCount > 0) {
      return t('dashboard:summary.medium_urgency', { 
        cityname, 
        count: summary.highRiskCount,
        topHazard: t(`common:hazards.${summary.topHazard?.toLowerCase()}`, { 
          defaultValue: summary.topHazard 
        })
      });
    }

    return t('dashboard:summary.low_urgency', { cityname });
  };

  if (!riskAssessment || riskAssessment.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('dashboard:no_data')}
      </div>
    );
  }

  // Get a color for the average risk score and directly use riskLevels
  const averageRiskLevel = getRiskLevel(summary.averageRiskScore);

  // Using direct color assignment based on getRiskLevel's return value for consistency with RiskTable
  let averageRiskColor;
  if (averageRiskLevel.label === 'High' || averageRiskLevel.label === 'Very_High') {
    averageRiskColor = '#F40000'; // Use red for High and Very High
  } else {
    averageRiskColor = averageRiskLevel.color; // Use the color from the risk level
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      {/* Header */}
      <div className="px-6 py-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">
          {t('dashboard:title')}
        </h2>
        <p className="text-sm opacity-80">{t('dashboard:subtitle')}</p>
      </div>

      {/* Summary Box */}
      <div className={`p-4 border-l-4 mx-4 my-4 rounded ${urgencyStyle.bg}`} 
           style={{ borderLeftColor: urgencyStyle.borderColor }}>
        <div className="flex gap-3">
          <div className="mt-1 flex-shrink-0">
            {urgencyStyle.icon}
          </div>
          <div>
            <h3 className="font-medium" style={{ color: urgencyStyle.textColor }}>
              {t(`dashboard:urgency.${urgencyLevel}`)}
            </h3>
            <p className="text-sm mt-1" style={{ color: urgencyStyle.textColor }}>
              {getSummaryText()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {/* Average Risk Score */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
              {t('dashboard:metrics.average_risk')}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold" style={{ color: averageRiskColor }}>
              {formatScore(summary.averageRiskScore)}
            </p>
            <p className="text-sm mb-1" style={{ color: averageRiskColor }}>
              {t(`common:risk_levels.${averageRiskLevel.label.toLowerCase()}`)}
            </p>
          </div>
        </div>

        {/* High Risk Count */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <ShieldAlert className="h-5 w-5" style={{ color: '#F40000' }} />
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
              {t('dashboard:metrics.high_risk_hazards')}
            </p>
          </div>
          <div className="flex items-end gap-1">
            <p className="text-2xl font-bold" style={{ color: '#F40000' }}>
              {summary.highRiskCount + summary.veryHighRiskCount}
            </p>
            <p className="text-sm text-gray-500 mb-1">/ {summary.totalHazards}</p>
          </div>
        </div>

        {/* Most Affected Sector */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <ActivitySquare className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
              {t('dashboard:metrics.top_sector')}
            </p>
          </div>
          <p className="text-xl font-bold text-gray-800 capitalize">
            {t(`common:sectors.${summary.topSector?.toLowerCase().replace(/\s+/g, '_')}`, { 
              defaultValue: summary.topSector 
            })}
          </p>
        </div>

        {/* Primary Hazard - use the hazard's color from hazardColors.js */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" style={{ color: getHazardColor(summary.topHazard) }} />
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
              {t('dashboard:metrics.top_hazard')}
            </p>
          </div>
          <p className="text-xl font-bold capitalize" style={{ color: getHazardColor(summary.topHazard) }}>
            {t(`common:hazards.${summary.topHazard?.toLowerCase()}`, { 
              defaultValue: summary.topHazard 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryDashboard;