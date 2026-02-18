import { Routes, Route, Navigate } from 'react-router-dom';
import KycPage from './pages/KycPage';
import SigningPage from './pages/SigningPage';
import SuccessPage from './pages/SuccessPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kyc" replace />} />
      <Route path="/kyc" element={<KycPage />} />
      <Route path="/signing" element={<SigningPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}

export default App;
