import { Routes, Route, Navigate } from 'react-router-dom';
import StartPage from './pages/StartPage';
import KycPage from './pages/KycPage';
import SigningPage from './pages/SigningPage';
import SuccessPage from './pages/SuccessPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/start" replace />} />
      <Route path="/start" element={<StartPage />} />
      <Route path="/kyc" element={<KycPage />} />
      <Route path="/signing" element={<SigningPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}

export default App;
