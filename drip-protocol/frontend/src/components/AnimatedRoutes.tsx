import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { Navbar } from "./Navbar";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import CreateStream from "@/pages/CreateStream";
import StreamDetail from "@/pages/StreamDetail";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Navbar /><Index /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/create" element={<PageTransition><CreateStream /></PageTransition>} />
        <Route path="/stream/:id" element={<PageTransition><StreamDetail /></PageTransition>} />
        <Route path="/history" element={<PageTransition><History /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
