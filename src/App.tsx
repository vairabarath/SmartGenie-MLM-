import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Personal from "./pages/Personal";
import LevelStatus from "./pages/LevelStatus";
import GenealogyTree from "./pages/GenealogyTree";

// Authentication components
import MultiWallet from "./components/auth/MultiWallet";
import Session from "./components/auth/Session";
import Register from "./components/auth/Register";
// import ProtectedRoute from "./components/auth/ProtectedRoute";
import WalletConnectionChecker from "./components/auth/WalletConnectionChecker";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route
          path="/"
          element={
            <WalletConnectionChecker>
              <MultiWallet />
            </WalletConnectionChecker>
          }
        />
        <Route path="/session" element={<Session />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            // <ProtectedRoute>
            <Layout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<Personal />} />
          <Route path="personal" element={<Personal />} />
          <Route path="level-status" element={<LevelStatus />} />
          <Route path="genealogy-tree" element={<GenealogyTree />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
