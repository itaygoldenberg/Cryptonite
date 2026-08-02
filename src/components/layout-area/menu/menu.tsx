import { NavLink } from "react-router-dom";
import "./menu.css";

// Main menu, NavLink marks the current page with an active class automatically.
export function Menu() {
    return (
        <div className="Menu">
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/ai-advice">AI Advice</NavLink>
            <NavLink to="/about">About</NavLink>
        </div>
    );
}
