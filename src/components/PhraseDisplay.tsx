import React from 'react';

interface PhraseDisplayProps {
  phrase: string;
}

const PhraseDisplay: React.FC<PhraseDisplayProps> = ({ phrase }) => {
  return (
    <div className="phrase">
      {phrase ? `📢 Say aloud: "${phrase}"` : 'Click "New Challenge" to begin...'}
    </div>
  );
};

export default PhraseDisplay;
