import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronUp, AlertTriangle, FileText, BarChart2 } from 'lucide-react';
import ccraApi from '../../api/ccraApi';
import { getRiskLevel, formatScore } from '../../constants/riskLevels';

const RiskDetailModal = ({ isOpen, onClose, rowData, actor_id }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeScenario, setActiveScenario] = useState('current');
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchIndicators = async () => {
      if (!isOpen || !actor_id) return;

      try {
        setLoading(true);
        const data = await ccraApi.getIndicatorDetails(actor_id, activeScenario);

        const relevantIndicators = data.filter(indicator => 
          indicator.hazard?.toLowerCase() === rowData?.hazard?.toLowerCase() &&
          indicator.keyimpact?.toLowerCase() === rowData?.keyimpact?.toLowerCase()
        );

        // Group indicators by category
        const groupedIndicators = relevantIndicators.reduce((acc, indicator) => {
          const category = indicator.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(indicator);
          return acc;
        }, {});

        setIndicators(groupedIndicators);
        setError(null);
      } catch (err) {
        console.error('Error fetching indicators:', err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [isOpen, actor_id, activeScenario, rowData, t]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen || !rowData) return null;

  // Hardcoded translations based on screenshots
  const translations = {
    // Overview tab
    risk_score_breakdown: i18n.language === 'pt' ? 'Detalhamento da Pontuação de Risco' : 'Risk Score Breakdown',
    hazard_explanation: i18n.language === 'pt' ? 'Probabilidade e magnitude da ameaça climática' : 'Likelihood and magnitude of the climate threat',
    exposure_explanation: i18n.language === 'pt' ? 'Pessoas e ativos que podem ser afetados' : 'People and assets that could be affected',
    vulnerability_explanation: i18n.language === 'pt' ? 'Sensibilidade aos danos e capacidade de adaptação' : 'Sensitivity to damage and ability to adapt',
    risk_calculation_formula: i18n.language === 'pt' ? 'Risco = Ameaça × Exposição × Vulnerabilidade' : 'Risk = Hazard × Exposure × Vulnerability',
    recommended_actions: i18n.language === 'pt' ? 'Ações Recomendadas' : 'Recommended Actions',
    recommendations_placeholder: i18n.language === 'pt' ? 'Recomendações para este risco estarão disponíveis em uma atualização futura' : 'Recommendations for this risk will be available in a future update',

    // Indicators tab
    select_scenario: i18n.language === 'pt' ? 'Selecionar Cenário Climático' : 'Select Climate Scenario',

    // Table headers
    indicator: i18n.language === 'pt' ? 'Indicador' : 'Indicator',
    score: i18n.language === 'pt' ? 'Pontuação' : 'Score',
    units: i18n.language === 'pt' ? 'Unidades' : 'Units',
    year: i18n.language === 'pt' ? 'Ano' : 'Year',
    source: i18n.language === 'pt' ? 'Fonte' : 'Source',

    // Scenarios
    current: {
      label: i18n.language === 'pt' ? 'Atual' : 'Current',
      description: i18n.language === 'pt' ? 'Condições climáticas atuais' : 'Current climate conditions'
    },
    optimistic: {
      label: 'RCP 4.5',
      description: i18n.language === 'pt' ? 'Cenário climático otimista' : 'Optimistic climate scenario'
    },
    pessimistic: {
      label: 'RCP 8.5',
      description: i18n.language === 'pt' ? 'Cenário climático pessimista' : 'Pessimistic climate scenario'
    },

    // Tabs
    overview: i18n.language === 'pt' ? 'Visão Geral' : 'Overview',
    indicators: i18n.language === 'pt' ? 'Indicadores' : 'Indicators'
  };

  const SCENARIOS = [
    { 
      id: 'current', 
      label: translations.current.label,
      description: translations.current.description
    },
    { 
      id: 'optimistic', 
      label: translations.optimistic.label,
      description: translations.optimistic.description
    },
    { 
      id: 'pessimistic', 
      label: translations.pessimistic.label,
      description: translations.pessimistic.description
    }
  ];

  const TABS = [
    {
      id: 'overview',
      label: translations.overview,
      icon: <BarChart2 className="w-4 h-4 mr-2" />
    },
    {
      id: 'indicators',
      label: translations.indicators,
      icon: <FileText className="w-4 h-4 mr-2" />
    }
  ];

  const riskLevel = getRiskLevel(rowData.risk_score);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-xl font-semibold capitalize flex items-center">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: riskLevel.indicatorColor }}
                ></span>
                {t(`hazards.${rowData.hazard.toLowerCase()}`, { defaultValue: rowData.hazard })} 
                {' → '} 
                {t(`sectors.${rowData.keyimpact.toLowerCase().replace(/ /g, '_')}`, { defaultValue: rowData.keyimpact })}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {i18n.language === 'pt' ? 'Nível de Risco' : 'Risk Level'}: 
                <span 
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: riskLevel.backgroundColor,
                    color: riskLevel.textColor
                  }}
                >
                  {t(`risk_levels.${riskLevel.label.toLowerCase().replace(/ /g, '_')}`)} 
                  ({formatScore(rowData.risk_score)})
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-2 px-3 text-sm font-medium rounded-md
                    ${activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Risk Score Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-4">{translations.risk_score_breakdown}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">{t('metrics.climate_threat')}</div>
                      <div className="text-2xl font-bold">{formatScore(rowData.hazard_score)}</div>
                      <div className="mt-2 text-xs text-gray-500">{translations.hazard_explanation}</div>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">{t('metrics.exposure')}</div>
                      <div className="text-2xl font-bold">{formatScore(rowData.exposure_score)}</div>
                      <div className="mt-2 text-xs text-gray-500">{translations.exposure_explanation}</div>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">{t('metrics.vulnerability')}</div>
                      <div className="text-2xl font-bold">
                        {formatScore(rowData.vulnerability_score)}
                        {rowData.indicator_count > 0 && (
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({rowData.indicator_count} {t('indicators')})
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">{translations.vulnerability_explanation}</div>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm" style={{ borderLeft: `4px solid ${riskLevel.indicatorColor}` }}>
                      <div className="text-sm text-gray-500 mb-1">{t('metrics.risk')}</div>
                      <div className="text-3xl font-bold" style={{ color: riskLevel.indicatorColor }}>
                        {formatScore(rowData.risk_score)}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">{translations.risk_calculation_formula}</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations - Placeholder for future implementation */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-2">{translations.recommended_actions}</h4>
                  <p className="text-gray-500 text-sm">{translations.recommendations_placeholder}</p>
                </div>
              </div>
            )}

            {activeTab === 'indicators' && (
              <div className="space-y-4">
                {/* Scenario selector */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">{translations.select_scenario}</div>
                  <div className="flex flex-wrap gap-2">
                    {SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => setActiveScenario(scenario.id)}
                        className={`
                          py-1.5 px-3 text-sm rounded-md transition-colors
                          ${activeScenario === scenario.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-white text-gray-600 hover:bg-gray-100'}
                        `}
                      >
                        {scenario.label}
                        <span className="text-xs block text-gray-500">
                          {scenario.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('loading')}</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                    <AlertTriangle className="text-red-500 w-5 h-5 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                ) : !indicators || Object.keys(indicators).length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center">
                    <AlertTriangle className="text-yellow-500 w-5 h-5 mr-2" />
                    <span className="text-yellow-700">{t('no_data')}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(indicators).map(([category, categoryIndicators]) => (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          onClick={() => toggleSection(category)}
                        >
                          <span className="font-medium text-gray-900 capitalize">{category}</span>
                          {expandedSections[category] ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>

                        {expandedSections[category] && (
                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                  <tr>
                                    <th className="px-4 py-2 text-left">{translations.indicator}</th>
                                    <th className="px-4 py-2 text-left">{translations.score}</th>
                                    <th className="px-4 py-2 text-left">{translations.units}</th>
                                    <th className="px-4 py-2 text-left">{translations.year}</th>
                                    <th className="px-4 py-2 text-left">{translations.source}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {categoryIndicators.map((indicator, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 capitalize text-sm text-gray-900">{indicator.indicator_name}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <span 
                                          className="px-2 py-1 rounded text-xs font-medium"
                                          style={{
                                            backgroundColor: indicator.indicator_color ? indicator.indicator_color : riskLevel.backgroundColor,
                                            color: indicator.indicator_color ? '#ffffff' : riskLevel.textColor,
                                            opacity: 0.9
                                          }}
                                        >
                                          {indicator.indicator_normalized_score?.toFixed(2) ?? 'N/A'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{indicator.indicator_units ?? 'N/A'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{indicator.indicator_year}</td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{indicator.datasource}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDetailModal;