import { Leaf } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import Feed from './pages/Feed';
import PlanDetail from './pages/PlanDetail';
import CreatePlan from './pages/CreatePlan';
import MyPlans from './pages/MyPlans';
import Assistant from './pages/Assistant';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-[90%] max-w-[1600px] mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/assistant"
            element={
              <RequireAuth>
                <Assistant />
              </RequireAuth>
            }
          />
          <Route path="/plans/:id" element={<PlanDetail />} />
          <Route
            path="/plans/new"
            element={
              <RequireAuth>
                <CreatePlan />
              </RequireAuth>
            }
          />
          <Route
            path="/plans/:id/edit"
            element={
              <RequireAuth>
                <CreatePlan />
              </RequireAuth>
            }
          />
          <Route
            path="/my-plans"
            element={
              <RequireAuth>
                <MyPlans />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-[#e4e4e0] py-4 text-center text-xs font-semibold text-[#5f655f]">
        EcoPlan — share and discover low-carbon, water-saving, recycled production plans.{' '}
        <Leaf size={12} className="inline-block align-text-bottom text-[#059669]" />
      </footer>
    </div>
  );
}