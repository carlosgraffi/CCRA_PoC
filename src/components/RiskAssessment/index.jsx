import { useState, useEffect, useMemo, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin } from "lucide-react";
import CityMap from "../CityMap";
import RiskTable from "./RiskTable";
import TopRisks from "./TopRisks";
import RiskDistributionChart from "./RiskDistributionChart";
import RadialComparison from "./RadialComparison";
import QualitativeAssessment from "../QualitativeAssessment";
import SectionHeader from "../SectionHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../../data/DataContext";
import LearnMore from "../LearnMore";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import RiskAssessmentIntro from "../RiskAssessmentIntro";
import MultilingualExportButtons from '../MultilingualExportButtons';
import { DownloadButton, downloadAsPNG } from "../../utils/chartExportUtils.jsx";
import ClimateProjections from './ClimateProjections';
import ExecutiveSummaryDashboard from '../ExecutiveSummaryDashboard';

const RiskAssessment = forwardRef(({ cityname, region, actor_id, osm_id, onBack }, ref) => {
  const { t } = useTranslation();
  const {
    riskAssessment,
    projectionData,
    loading,
    error,
    updateResilienceScore,
    currentResilienceScore,
  } = useData();

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showQuestionnaireResults, setShowQuestionnaireResults] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  useEffect(() => {
    if (cityname && actor_id) {
      // Only reset when changing cities
      updateResilienceScore(null);
      setShowQuestionnaire(false);
      setShowQuestionnaireResults(false);
    }
  }, [cityname, actor_id]);

  const processedRiskData = useMemo(() => {
    if (!riskAssessment?.length) return [];
    return riskAssessment.sort((a, b) => b.risk_score - a.risk_score);
  }, [riskAssessment]);

  const handleResilienceScoreUpdate = (score) => {
    // If score is not null, it means we're finishing the questionnaire
    if (score !== null) {
      updateResilienceScore(score);
      setShowQuestionnaireResults(true);
    } else {
      // Only reset if we're explicitly resetting (like clicking "retake")
      if (showQuestionnaireResults) {
        updateResilienceScore(null);
        setShowQuestionnaireResults(false);
      }
    }
  };

  const handleTopRisksDownload = () => {
    const element = document.querySelector('#top-risks');
    if (element) downloadAsPNG(element, 'top-risks');
  };

  const handleDistributionDownload = () => {
    const element = document.querySelector('#comparison');
    if (element) downloadAsPNG(element, 'risk-distribution');
  };

  const handleProjectionsDownload = () => {
    const element = document.querySelector('#projections');
    if (element) downloadAsPNG(element, 'hazard-projections');
  };

  const handleTableDownload = () => {
    const element = document.querySelector('#table');
    if (element) downloadAsPNG(element, 'risk-assessment-table');
  };

  const handleExportData = async (language) => {
    if (!processedRiskData.length) return;
    setIsExporting(true);
    try {
      await exportToCSV(processedRiskData, cityname, language);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async (language) => {
    if (!processedRiskData.length) return;
    setIsPdfExporting(true);
    try {
      await exportToPDF(
        processedRiskData, 
        cityname, 
        region, 
        {
          score: currentResilienceScore,
          responses: [],
        },
        language
      );
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsPdfExporting(false);
    }
  };

  if (loading) {
    return (
      <div ref={ref} className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg text-gray-600">{t("loading", { cityname })}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={ref} className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg text-red-500">{t("error", { error })}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 sm:p-6 md:p-8 lg:p-16 space-y-6 md:space-y-9">
      {/* Header Section */}
      <div id="intro" className="scroll-mt-24 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#7A7B9A] hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 sm:w-6 h-4 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium tracking-wider">
              {t("sections:navigation.back_to_search")}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-6 md:space-y-9">
        {/* City Info and Map Section */}
        <div ref={ref} className="grid grid-cols-1 md:flex flex-col w-full lg:grid-cols-3 gap-4">
          <div className="flex justify-center items-center w-full h-full min-h-[120px] bg-blue-600 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <MapPin className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              <div>
                <h2 className="text-xl sm:text-2xl md:text-[32px] text-white font-semibold font-poppins">
                  {cityname}
                </h2>
                <p className="text-xs sm:text-sm text-gray-100">
                  {t("common:region")}: {region}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:col-span-2 h-[300px] sm:h-[400px] w-full bg-white rounded-lg shadow-md">
            <CityMap cityname={cityname} region={region} osm_id={osm_id} />
          </div>
        </div>

        {/* Executive Summary Dashboard */}
        <div id="executive-summary" className="scroll-mt-24">
          <ExecutiveSummaryDashboard 
            riskAssessment={processedRiskData}
            cityname={cityname}
            region={region}
          />
        </div>

        <RiskAssessmentIntro />

        {/* Top Risks Section */}
        <div id="top-risks" className="scroll-mt-24 bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <SectionHeader
            title={t("sections:top_risks.title")}
            description={t("sections:top_risks.description")}
            insights={t("sections:top_risks.insights")}
          />
          <TopRisks
            riskAssessment={processedRiskData}
            resilienceScore={currentResilienceScore}
          />
        </div>

        {/* Climate Projections Section */}
        <div id="projections" className="scroll-mt-24 bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <SectionHeader
            title={t("sections:projections.title")}
            description={t("sections:projections.description")}
            insights={t("sections:projections.insights")}
          />

          {/* Only show ClimateProjections component */}
          <ClimateProjections cityname={cityname} />
        </div>

        {/* Risk Comparisons Section */}
        <div id="comparison" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col">
            <SectionHeader
              title={t("sections:hazard_comparison.title")}
              description={t("sections:hazard_comparison.description")}
              insights={t("sections:hazard_comparison.insights")}
            />
            <RadialComparison riskAssessment={processedRiskData} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <SectionHeader
              title={t("sections:sector_distribution.title")}
              description={t("sections:sector_distribution.description")}
              insights={t("sections:sector_distribution.insights")}
            />
            <RiskDistributionChart riskAssessment={processedRiskData} />
          </div>
        </div>

        {/* CCRA Table Section */}
        <div id="table" className="scroll-mt-24 bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-6 md:space-y-9 my-8 sm:my-16 w-full">
          <SectionHeader
            title={t("sections:ccra_table.title")}
            description={
              currentResilienceScore !== null
                ? t("sections:ccra_table.description_with_assessment")
                : t("sections:ccra_table.description")
            }
            insights={t("sections:ccra_table.insights")}
          />
          <RiskTable
            riskAssessment={processedRiskData}
            actor_id={actor_id}
            resilienceScore={currentResilienceScore}
          />
        </div>

        <div id="qualitative" className="scroll-mt-24">
          {!showQuestionnaire ? (
            <motion.div
              key="banner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#2351DC] rounded-lg shadow-md p-6 sm:p-12 flex flex-col sm:flex-row justify-between items-center gap-6"
            >
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-xl sm:text-2xl md:text-[32px] leading-tight font-normal font-poppins text-white">
                  <b>{t("sections:qualitative_assessment.title")}</b>
                  <br />
                  {t("sections:qualitative_assessment.subtitle")}
                </h3>
                <p className="text-sm sm:text-base font-normal font-opensans text-white">
                  {t("sections:qualitative_assessment.description")}
                </p>
              </div>
              <button
                onClick={() => setShowQuestionnaire(true)}
                className="flex justify-center hover:bg-gray-100 w-full sm:w-64 px-4 py-4 sm:py-6 bg-white text-[#2351DC] rounded-lg font-semibold uppercase tracking-wider text-sm sm:text-base"
              >
                {t("sections:qualitative_assessment.start_button")}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-md"
            >
              <QualitativeAssessment
                key={`qualitative-assessment-${showQuestionnaire}-${showQuestionnaireResults}`}
                showQuestionnaire={showQuestionnaire}
                setShowQuestionnaire={setShowQuestionnaire}
                showResults={showQuestionnaireResults}
                setShowResults={setShowQuestionnaireResults}
                onScoreUpdate={handleResilienceScoreUpdate}
                currentScore={currentResilienceScore}
              />
            </motion.div>
          )}
        </div>

        {/* Export Section */}
        <div id="export" className="scroll-mt-24 flex p-4 sm:p-6 min-h-[280px] sm:min-h-[360px] border-y-[2px] border-blue-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-28">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl md:text-[32px] font-regular font-poppins text-blue-700">
                {t("sections:export.title")}
              </h3>
              <p className="text-sm sm:text-base font-normal font-opensans text-gray-600">
                {t("sections:export.description")}
              </p>
            </div>
            <div className="flex w-full lg:w-[640px] justify-center items-center">
              <MultilingualExportButtons 
                onExportCSV={handleExportData}
                onExportPDF={handlePdfExport}
                isExporting={isExporting}
                isPdfExporting={isPdfExporting}
                hasData={processedRiskData.length > 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <LearnMore />
    </div>
  );
});

RiskAssessment.displayName = 'RiskAssessment';

export default RiskAssessment;