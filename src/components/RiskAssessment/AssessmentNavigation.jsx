// src/components/RiskAssessment/AssessmentNavigation.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

const AssessmentNavigation = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', label: t('risk-assessment:sections.intro') },
    { id: 'executive-summary', label: t('risk-assessment:sections.executive_summary') },
    { id: 'top-risks', label: t('risk-assessment:sections.toprisks') },
    { id: 'projections', label: t('risk-assessment:sections.projections_') },
    { id: 'comparison', label: t('risk-assessment:sections.comparison') },
    { id: 'table', label: t('risk-assessment:sections.table') },
    { id: 'qualitative', label: t('risk-assessment:sections.qualitative') },
    { id: 'export', label: t('risk-assessment:sections.export') }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => 
        document.getElementById(section.id)
      );

      const currentSection = sectionElements.find(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="hidden lg:block sticky top-1/3 mt-36 ml-8 transform -translate-y-1/4 h-fit w-28">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 w-48">
        <div className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200 flex items-center gap-2
                ${activeSection === section.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`}
              />
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default AssessmentNavigation;