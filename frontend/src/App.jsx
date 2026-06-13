import { BrowserRouter, Routes, Route } from "react-router";
import { NavBar } from "./components/NavBar";
import { DashboardPage } from "./components/DashboardPage";
import { ReviewsListPage } from "./components/ReviewsListPage";
import { ReviewPage } from "./components/ReviewPage";
import { InsightsPage } from "./components/InsightsPage";
import { GuidelinesPage } from "./components/GuidelinesPage";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#f6f4fb", fontFamily: "'Inter', sans-serif" }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reviews" element={<ReviewsListPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
