import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameMenu from './components/GameMenu';
import Mathdrops from './games/Mathdrops/Mathdrops';
import MemoryTiles from './games/MemoryTiles/MemoryTiles';
import LaneMemory from './games/LaneMemory/LaneMemory';
import './App.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GameMenu />} />
      <Route path="/mathdrops" element={<Mathdrops />} />
      <Route path="/memory-tiles" element={<MemoryTiles />} />
      <Route path="/lane-memory" element={<LaneMemory />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
