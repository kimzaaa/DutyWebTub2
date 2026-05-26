import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import dutyBase62 from "./data/dutyBase62.json";
import dutyBase23 from "./data/dutyBase23.json";

export default function Router() {
  return (
    <BrowserRouter basename="/DutyWebTub2">
      <Routes>
        <Route path="/" element={<Navigate to="/6-2" replace />} />
        <Route path="/6-2" element={<App className="6-2" dataset={dutyBase62} />} />
        <Route path="/2-3" element={<App className="2-3" dataset={dutyBase23} />} />
        <Route path="*" element={<Navigate to="/6-2" replace />} />
      </Routes>
    </BrowserRouter>
  );
}