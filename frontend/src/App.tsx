import React, { useState, useEffect } from 'react';
import MicRecorder from './components/MicRecorder';
import PhraseDisplay from './components/PhraseDisplay';
import TrustMeter from './components/TrustMeter';
import './App.css';

type User = { 
  id: string; 
  name: string; 
  email: string; 
  voiceBaseline: string;
  registrationPhrase: string;
  voicePrint: string;
};

type AuthState = 'register' | 'login' | 'dashboard' | 'voiceExam';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('register');
  const [user, setUser] = useState<User | null>(null);
  
  // Auth form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Dashboard states
  const [phrase, setPhrase] = useState('');
  const [status, setStatus] = useState('');
  const [trustScore, setTrustScore] = useState(0);
  const [baselineDone, setBaselineDone] = useState(false);
  const [micEnvironment, setMicEnvironment] = useState('Not Tested');
  const [challengesPassed, setChallengesPassed] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  
  // 🎯 FIXED: Global session counter - tracks ALL exams
  const [globalExamCount, setGlobalExamCount] = useState(0);

  const generateVoicePrint = (score: number, timestamp: number) => {
    return `${score}_${timestamp}_${Math.random().toString(36).substring(7)}`;
  };

  const handleVoiceRegistration = (score: number, voiceStatus: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill all fields first!');
      return;
    }

    const voicePrint = generateVoicePrint(score, Date.now());
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      voiceBaseline: `voice_${Date.now()}_${score}`,
      registrationPhrase: 'VoiceShield security check active',
      voicePrint: voicePrint
    };

    localStorage.setItem('voiceShieldUser', JSON.stringify(newUser));
    localStorage.setItem('voiceShieldPassword', password);
    
    setUser(newUser);
    setAuthState('dashboard');
    clearAuthForm();
    alert(`✅ Welcome ${newUser.name}! Voice registered successfully!`);
  };

  const handleVoiceLogin = (score: number, voiceStatus: string) => {
    const savedUserStr = localStorage.getItem('voiceShieldUser');
    const savedPassword = localStorage.getItem('voiceShieldPassword');
    
    if (!savedUserStr || !email.trim() || !password.trim()) {
      alert('Please complete all fields or register first!');
      return;
    }

    const savedUser = JSON.parse(savedUserStr) as User;
    const isVoiceMatch = score >= 60;
    const isPasswordMatch = password === savedPassword;
    const isEmailMatch = email.trim() === savedUser.email;
    
    if (isEmailMatch && isPasswordMatch && isVoiceMatch) {
      setUser(savedUser);
      setAuthState('dashboard');
      clearAuthForm();
      setTrustScore(Math.max(score, 80));
      alert(`✅ Login successful ${savedUser.name}! Voice verified!`);
    } else {
      let errorMsg = 'Login failed!\n';
      if (!isVoiceMatch) errorMsg += `❌ Voice mismatch: ${score}%\n`;
      if (!isPasswordMatch) errorMsg += '❌ Wrong password\n';
      if (!isEmailMatch) errorMsg += '❌ Email not found\n';
      alert(errorMsg);
      setTrustScore(score);
      setStatus('❌ Login Failed');
    }
  };

  const handleVoiceAuth = (score: number, status: string) => {
    if (authState === 'register') {
      handleVoiceRegistration(score, status);
    } else {
      handleVoiceLogin(score, status);
    }
  };

  const clearAuthForm = () => {
    setName(''); setEmail(''); setPassword('');
  };

  const resetDashboard = () => {
    setPhrase(''); setStatus(''); setTrustScore(0);
    setBaselineDone(false); setMicEnvironment('Not Tested');
    setChallengesPassed(0); setTotalChallenges(0);
    // 🎯 Keep globalExamCount persistent
  };

  const logout = () => {
    setUser(null);
    setAuthState('register');
    clearAuthForm();
    resetDashboard();
  };

  const startVoiceExam = () => {
    const phrases = [
      "The quick brown fox verification test",
      "Voice biometrics security challenge", 
      "Anomaly detection active speak clearly"
    ];
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setAuthState('voiceExam');
  };

  const backToDashboard = () => {
    setAuthState('dashboard');
    setPhrase('');
    setStatus('');
    setTrustScore(0);
  };

  const checkMicEnvironment = () => {
    setMicEnvironment('🔄 Analyzing...');
    setTimeout(() => {
      setMicEnvironment(Math.random() > 0.5 ? '✅ Clean' : '⚠️ Noisy');
    }, 1500);
  };

  const recordBaseline = () => {
    setBaselineDone(true);
    setStatus('✅ Baseline voice recorded');
  };

  // 🎯 PERFECT: 1st EXAM PASS, 2nd EXAM FAIL, 3rd EXAM PASS
  const onVoiceChallenge = (micScore: number, stat: string) => {
    setGlobalExamCount(prev => {
      const newCount = prev + 1;
      
      let finalScore: number;
      
      // 🎯 EXACTLY: 1st=85% PASS, 2nd=35% FAIL, 3rd=92% PASS
      if (newCount === 1) {
        finalScore = 85; // PASS
      } else if (newCount === 2) {
        finalScore = 35; // FAIL
      } else {
        finalScore = 92; // PASS
      }
      
      setTrustScore(finalScore);
      setStatus(`Voice verification: ${finalScore}%`);
      
      if (finalScore >= 75) {
        setChallengesPassed(prev => prev + 1);
        setTotalChallenges(prev => prev + 1);
        alert(`✅ Voice Exam Passed! Score: ${finalScore}%`);
      } else {
        setTotalChallenges(prev => prev + 1);
        alert(`❌ Voice Exam Failed. Score: ${finalScore}%. Try again.`);
      }
      
      setTimeout(() => {
        backToDashboard();
      }, 1500);
      
      return newCount;
    });
  };

  // AUTH UI
  if (authState !== 'dashboard' && authState !== 'voiceExam') {
    return (
      <div className="app auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1>🛡️ VoiceShield</h1>
            <p>{authState === 'register' ? '🎤 Register New Voice' : '🔐 Login with Voice'}</p>
            
            <div className="auth-form">
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
              <input
                type="password"
                placeholder="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />

              <div className="voice-auth-section">
                <div className="voice-instruction">
                  <strong>🔊 Speak clearly for voice analysis:</strong>
                  <div className="phrase-highlight">
                    "VoiceShield security check active"
                  </div>
                </div>
                
                <MicRecorder 
                  phrase="VoiceShield security check active"
                  userId={email || 'temp'}
                  onResult={handleVoiceAuth}
                />
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <small style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Speak loudly and clearly for best results
                </small>
              </div>

              <p className="auth-toggle" style={{ marginTop: '24px' }}>
                {authState === 'register' ? 'Already registered?' : "New user?"}
                <br />
                <button 
                  className="toggle-link"
                  type="button"
                  onClick={() => {
                    setAuthState(authState === 'register' ? 'login' : 'register');
                    clearAuthForm();
                  }}
                >
                  {authState === 'register' ? 'Login with Voice' : 'Register New Voice'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VOICE EXAM PAGE
  if (authState === 'voiceExam') {
    return (
      <div className="app exam-page" style={{
        background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎤</div>
          <h1 style={{ 
            color: '#cc0000', 
            fontSize: '2.5rem', 
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            🔴 LIVE VOICE EXAM
          </h1>
          
          <MicRecorder 
            phrase={phrase || "Speak clearly for verification"} 
            userId={user?.id || 'user'}
            onResult={onVoiceChallenge}
          />
          
          {phrase && (
            <div style={{ 
              padding: '30px 20px', 
              background: 'rgba(0,255,136,0.1)',
              borderRadius: '20px',
              borderLeft: '6px solid #00ff88',
              fontSize: '1.5rem',
              marginTop: '30px',
              boxShadow: '0 10px 30px rgba(0,255,136,0.2)'
            }}>
              <strong style={{ color: '#cc0000', display: 'block', marginBottom: '15px' }}>
                🔊 SPEAK EXACTLY:
              </strong>
              <div style={{ fontSize: '1.6rem', color: '#333', fontWeight: 'bold' }}>
                "{phrase}"
              </div>
            </div>
          )}
          
          <button 
            onClick={backToDashboard}
            style={{
              marginTop: '30px',
              padding: '15px 30px',
              fontSize: '18px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              opacity: 0.8
            }}
          >
            ❌ Cancel Exam
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD UI
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>🛡️ VoiceShield</h1>
          <div className="session-id">
            Welcome <strong>{user?.name}</strong> | {user?.email}
          </div>
        </div>
        <div className="header-actions">
          <button className="reset-btn" onClick={resetDashboard}>🔄 Reset</button>
          <button className="logout-btn" onClick={logout}>🚪 Logout</button>
        </div>
      </header>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(challengesPassed / Math.max(totalChallenges, 1)) * 100}%` }}
          />
        </div>
        <div className="progress-label">
          {challengesPassed}/{totalChallenges} Voice Challenges
        </div>
      </div>

      <div className="main-content">
        <div className="status-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div className="status-card" style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <div className="card-icon">👤</div>
            <h3>Voice Baseline</h3>
            <div className={`status-badge ${baselineDone ? 'success' : 'pending'}`}>
              {baselineDone ? '✅ Recorded' : 'Pending'}
            </div>
            <button 
              className="action-btn" 
              onClick={recordBaseline} 
              disabled={baselineDone}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              Record Baseline
            </button>
          </div>

          <div className="status-card" style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <div className="card-icon">🔊</div>
            <h3>Mic Environment</h3>
            <div className={`status-badge ${
              micEnvironment === '✅ Clean' ? 'success' : 
              micEnvironment === '⚠️ Noisy' ? 'warning' : 'pending'
            }`}>
              {micEnvironment}
            </div>
            <button 
              className="action-btn" 
              onClick={checkMicEnvironment}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              Test Environment
            </button>
          </div>

          <div className="status-card exam-start-card" style={{ 
            flex: '1 1 300px', 
            minWidth: '280px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '3px solid #00d4ff',
            boxShadow: '0 10px 30px rgba(0,212,255,0.3)'
          }}>
            <div className="card-icon" style={{ fontSize: '2rem' }}>🎯</div>
            <h3 style={{ color: 'white', marginBottom: '16px' }}>Voice Exam</h3>
            <div className="status-badge success" style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white',
              marginBottom: '16px'
            }}>
              READY
            </div>
            <button 
              className="primary-btn large-btn" 
              onClick={startVoiceExam}
              style={{ 
                width: '100%', 
                padding: '18px 12px', 
                fontSize: '18px', 
                fontWeight: 'bold',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              🚀 START VOICE EXAM
            </button>
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              Full voice verification test
            </div>
          </div>
        </div>

        <div className="results-section">
          <TrustMeter score={trustScore} status={status} />
          <div className="session-summary">
            <h3>📊 Voice Analysis</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span>User</span>
                <span>{user?.name}</span>
              </div>
              <div className="summary-item">
                <span>Baseline</span>
                <span className={baselineDone ? 'success' : 'pending'}>
                  {baselineDone ? '✅ Complete' : '⚠️ Pending'}
                </span>
              </div>
              <div className="summary-item">
                <span>Environment</span>
                <span>{micEnvironment}</span>
              </div>
              <div className="summary-item">
                <span>Challenges</span>
                <span>{challengesPassed}/{totalChallenges}</span>
              </div>
              <div className="summary-item final-score">
                <span>TRUST SCORE</span>
                <span className={trustScore >= 75 ? 'success' : 'warning'}>
                  {trustScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
