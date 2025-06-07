import React, { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize stagewise toolbar in development mode
    if (process.env.NODE_ENV === 'development') {
      import('@stagewise/toolbar').then((stagewise) => {
        stagewise.init();
      }).catch(console.error);
    }
  }, []);

  return (
    <div className="app-container">
      <div className="app-card">
        <h1 className="app-title">
          Flight Inventory Management
        </h1>
        <p className="app-description">
          Your flight inventory management application is ready!
        </p>
        <p className="app-subtitle">
          The application is served from the public/index.html file and should load automatically.
        </p>
        <div className="stagewise-notice">
          <p>
            ✨ Stagewise toolbar enabled for visual coding with AI agents
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card feature-mobile">
            <div className="feature-title">📱 Mobile Responsive</div>
            <div className="feature-desc">Optimized for all screen sizes</div>
          </div>
          
          <div className="feature-card feature-ai">
            <div className="feature-title">🤖 AI Integration</div>
            <div className="feature-desc">Stagewise visual coding ready</div>
          </div>
          
          <div className="feature-card feature-flight">
            <div className="feature-title">✈️ Flight Management</div>
            <div className="feature-desc">Complete inventory system for airline operations</div>
          </div>
        </div>
        
        <div className="app-footer">
          <p className="footer-text">Ready to start building?</p>
          <div className="tech-badges">
            <span className="tech-badge">React + Stagewise</span>
            <span className="tech-badge">Mobile First</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 