"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } else {
      setError("Mot de passe incorrect");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Administration</h1>
        <p>Connectez-vous pour gérer les produits</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe admin"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
