import { NavLink } from "react-router-dom";
import "./page404.css";

// Shown for any address that does not match a route.
export function Page404() {
    return (
        <div className="Page404">

            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist or has been moved.</p>

            <NavLink to="/home">Back To Home</NavLink>

        </div>
    );
}
