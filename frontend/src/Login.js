
import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8183/auth",
  withCredentials: true,
});

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function Login({ onLogin }) {
  const resetToken = new URLSearchParams(window.location.search).get("token");

  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setMessage("");
    setShowPassword(false);
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await api.post("/register", form);
setMessage(response.data.message);

setForm({
  username: form.email,
  email: "",
  password: "",
});
setShowPassword(false);
setMode("login");
      } else if (mode === "login") {
        const response = await api.post("/login", {
          username: form.username.trim(),
          password: form.password,
        });
        await onLogin(response.data);
      } else if (mode === "forgot") {
        const response = await api.post("/forgot-password", {
          email: form.email.trim(),
        });
        setMessage(response.data.message);
      } else if (mode === "reset") {
        const response = await api.post("/reset-password", {
          token: resetToken,
          newPassword: form.password,
        });
        setMessage(response.data.message);
        setForm({ username: "", email: "", password: "" });
        window.history.replaceState({}, "", "/");
        setMode("login");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to complete the request. Check the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  };
const needsPassword =
  mode === "login" ||
  mode === "register" ||
  mode === "reset"
  {(mode === "register" || mode === "reset") && (
  <ul className="password-rules">
    {passwordRules.map((rule) => (
      <li
        key={rule.label}
        className={
          form.password && rule.test(form.password)
            ? "rule-valid"
            : ""
        }
      >
        {form.password && rule.test(form.password) ? "✓" : "○"}{" "}
        {rule.label}
      </li>
    ))}
  </ul>
)};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">WS</div>
        <h1>WorkSphere</h1>
        <p className="auth-subtitle">Your workplace, organized.</p>

        <h2>
          {mode === "register" && "Create your account"}
          {mode === "login" && "Welcome back!"}
          {mode === "forgot" && "Forgot your password?"}
          {mode === "reset" && "Create a new password"}
        </h2>

        <p className="auth-description">
          {mode === "register" && "Create your employee account."}
          {mode === "login" && "Sign in to access your workspace."}
          {mode === "forgot" && "Enter your registered email to request a reset link."}
          {mode === "reset" && "Choose a strong new password."}
        </p>

        {mode === "login" && (
          <div className="auth-tabs">
            <button type="button" className="active">Email Login</button>
            <button type="button" onClick={() => changeMode("register")}>
              Register
            </button>
          </div>
        )}

        {mode === "register" && (
          <button
            type="button"
            className="text-button"
            onClick={() => changeMode("login")}
          >
            Already registered? Sign in
          </button>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot") && (
            <>
              <label htmlFor="email">
                {mode === "login" ? "Email address" : "Email address"}
              </label>
              <input
                id="email"
                name={mode === "login" ? "username" : "email"}
                type="email"
                value={mode === "login" ? form.username : form.email}
                onChange={handleChange}
                placeholder="Enter your registered email"
                autoComplete="email"
                required
              />
            </>
          )}

          {needsPassword && (
            <>
              <label htmlFor="password">
                {mode === "reset" ? "New password" : "Password"}
              </label>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={
                    mode === "register" ? "new-password" : "new-password"
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <ul className="password-rules">
                {passwordRules.map((rule) => (
                  <li
                    key={rule.label}
                    className={
                      form.password && rule.test(form.password)
                        ? "rule-valid"
                        : ""
                    }
                  >
                    {form.password && rule.test(form.password) ? "✓" : "○"}{" "}
                    {rule.label}
                  </li>
                ))}
              </ul>
            </>
          )}

          {mode === "login" && (
            <div className="forgot-row">
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("forgot")}
              >
                Forgot password?
              </button>
            </div>
          )}

          {message && (
            <div className="auth-message" role="status">
              {message}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "register"
              ? "Create Account"
              : mode === "login"
              ? "Sign In"
              : mode === "forgot"
              ? "Send Reset Link"
              : "Reset Password"}
          </button>
        </form>

        {mode === "forgot" && (
          <button
            type="button"
            className="text-button back-button"
            onClick={() => changeMode("login")}
          >
            Back to login
          </button>
        )}

        <p className="auth-footer">
          Secure employee management for your workplace.
        </p>
      </div>
    </div>
  );
}

export default Login;
