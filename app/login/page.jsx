"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // redirect based on role — fetch session to get role
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;

    if (role === "hod") router.push("/dashboard/hod");
    else if (role === "coordinator") router.push("/dashboard/coordinator");
    else if (role === "lecturer") router.push("/dashboard/lecturer");
    else if (role === "student") router.push("/dashboard/student");
    else router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #001D39 0%, #0A4174 50%, #7BBDE8 85%, #BDD8E9 100%)',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '50px 40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        {/* Header with Logo */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            Batch<span style={{ color: '#FFE566' }}>MS</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '14px',
          marginBottom: '28px'
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(192, 57, 43, 0.2)',
              color: '#FFB3B3',
              padding: '11px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid rgba(192, 57, 43, 0.4)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(255, 229, 102, 0.4)' : '#FFE566',
              color: loading ? 'rgba(0, 29, 57, 0.5)' : '#001D39',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#FFD633')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#FFE566')}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Don't have access?{' '}
              <button
                onClick={() => router.push('/request-access')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFE566',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD633')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#FFE566')}
              >
                Request Access
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
