import { FormEvent, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { LinkUpLogo } from "../components/ui/logo";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || password.length < 8) {
      setError("Enter a valid email and password (minimum 8 characters).");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate("/app");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(typeof message === "string" ? message : "Login failed");
      } else {
        setError("Login failed");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <LinkUpLogo className="mb-4" />
        <p className="mb-6 text-sm text-muted">Sign in to your workspace</p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />

          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error ? <div className="text-sm text-red-500">{error}</div> : null}
          <Button className="w-full" type="submit">Login</Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          New here? <Link className="text-accent" to="/register">Create account</Link>
        </p>
      </Card>
    </div>
  );
};
