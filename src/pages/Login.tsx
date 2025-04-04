import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setIsRegistering(!isRegistering);
    setError(null);
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fullEmail = email; // Use only the email part without appending the domain

    // If registering, ensure passwords match.
    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? "/register" : "/login"; // Remove "/api" as it is handled in the base URL
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: fullEmail, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "An error occurred");
        setLoading(false);
        return;
      }
      if (isRegistering) {
        setIsRegistering(false);
        setError("Registration successful. Please login.");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with logos */}
      <header className="w-full p-4 flex justify-between items-center bg-white shadow-sm">
        <div className="h-12">
          <img 
            src="../assets/1.png" 
            alt="Left Logo" 
            className="h-full object-contain"
          />
        </div>
        <div className="h-12">
          <img 
            src="../assets/logo-right.png" 
            alt="Right Logo" 
            className="h-full object-contain"
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isRegistering ? "Register" : "Login"}
          </h2>
          {error && <div className="mb-4 text-center text-red-600">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="text" // Changed from "email" to "text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="your.email" // User only needs to enter the part before '@'
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll append "@premierenergies.com" automatically.
              </p>
            </div>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="Enter your password"
                required
              />
            </div>
            {isRegistering && (
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition-colors"
              disabled={loading}
            >
              {loading
                ? isRegistering
                  ? "Registering..."
                  : "Logging in..."
                : isRegistering
                ? "Register"
                : "Login"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleToggle}
              className="text-sm text-primary hover:underline"
            >
              {isRegistering
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-4 bg-gray-100 border-t border-gray-200 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Premier Energies. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;