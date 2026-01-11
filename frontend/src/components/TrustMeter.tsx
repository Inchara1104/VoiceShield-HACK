import React from 'react';

interface TrustMeterProps {
  score: number;
  status: string;
}

const TrustMeter: React.FC<TrustMeterProps> = ({ score, status }) => {
  const getColor = (): string => {
    if (status === 'Verified') return '#4CAF50';
    if (status === 'Suspicious') return '#FF9800';
    return '#F44336';
  };

  const getIcon = (status: string): string => {
    if (status === 'Verified') return '✅';
    if (status === 'Suspicious') return '⚠️';
    return '❌';
  };

  return (
    <div 
      className="meter" 
      style={{ 
        background: getColor(),
        color: 'white'
      }}
    >
      <span style={{ fontSize: '40px', marginRight: '15px' }}>
        {getIcon(status)}
      </span>
      <span>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
          {status || 'Pending'}
        </div>
        <div>Score: {score}/100</div>
      </span>
    </div>
  );
};

export default TrustMeter;
