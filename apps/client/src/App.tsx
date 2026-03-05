import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/protected-route";
import { AppPage } from "./pages/app-page";
import { CallPage } from "./pages/call-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/app" element={<AppPage />} />
      <Route path="/app/calls/:callId" element={<CallPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/app" replace />} />
  </Routes>
);