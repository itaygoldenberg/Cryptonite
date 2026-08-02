import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "../../pages-area/home/home";
import { Reports } from "../../pages-area/reports/reports";
import { AiAdvice } from "../../pages-area/ai-advice/ai-advice";
import { About } from "../../pages-area/about/about";
import { Page404 } from "../../pages-area/page404/page404";

// All application routes, with a redirect from the root and a fallback for unknown addresses.
export function Routing() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<Home />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-advice" element={<AiAdvice />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}
