"use client";

import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("rafta_user");
      const session = localStorage.getItem("rafta_session");

      if (!user || session !== "active") {
        window.location.href = "/login";
        return;
      }

      setAuthenticated(true);
    } catch (error) {
      console.error("Authentication check failed:", error);
      window.location.href = "/login";
    } finally {
      setChecking(false);
    }
  }, []);

  if (checking || !authenticated) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-logo">♫</div>
        <p>Loading RAFTA AI...</p>
      </div>
    );
  }

  return <>{children}</>;
}