import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // 404 Error: User attempted to access non-existent route: location.pathname
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dem-dark">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-display text-white">404</h1>
        <p className="mb-4 text-xl font-body text-white/40">Oops! Page not found</p>
        <a href="/" className="text-dem font-body underline hover:text-dem/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
