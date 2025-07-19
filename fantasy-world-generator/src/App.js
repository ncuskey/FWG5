import React from 'react';
import WorldGenerator from './components/WorldGenerator';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Fantasy World Generator</h1>
        <p>Generate procedural fantasy worlds with height maps and coastlines</p>
      </header>
      <main>
        <WorldGenerator />
      </main>
    </div>
  );
}

export default App;
