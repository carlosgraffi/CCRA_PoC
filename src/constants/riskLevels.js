const riskLevels = {
  VERY_LOW: {
    label: 'Very_Low',
    color: '#02C650',
    backgroundColor: '#DCFCE7',
    textColor: '#166534'
  },
  LOW: {
    label: 'Low',
    color: '#A9DE00',
    backgroundColor: '#ECFCCB',
    textColor: '#3F6212'
  },
  MEDIUM: {
    label: 'Medium',
    color: '#FFCD00',
    backgroundColor: '#FEF9C3',
    textColor: '#854D0E'
  },
  HIGH: {
    label: 'High',
    color: '#FF8300',
    backgroundColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  VERY_HIGH: {
    label: 'Very_High',
    color: '#F40000',
    backgroundColor: '#FFE4E6',
    textColor: '#9F1239'
  },
  NA: {
    label: 'N/A',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    textColor: '#374151'
  }
};

export const formatScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return Number(score).toFixed(3);
};

export const getRiskLevel = (score) => {
  if (score === null || score === undefined) return riskLevels.NA;

  const numScore = Number(score);

  if (numScore < 0.19) return riskLevels.VERY_LOW;
  if (numScore < 0.39) return riskLevels.LOW;
  if (numScore < 0.59) return riskLevels.MEDIUM;
  if (numScore < 0.79) return riskLevels.HIGH;
  return riskLevels.VERY_HIGH;
};

export const getRiskChangeDescription = (originalScore, updatedResilienceScore) => {
  if (!originalScore || !updatedResilienceScore) return null;

  const percentChange = ((updatedResilienceScore - originalScore) / originalScore) * 100;

  if (Math.abs(percentChange) < 1) return null;

  return {
    text: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
    color: percentChange > 0 ? '#EF4444' : '#10B981'
  };
};

export { riskLevels };