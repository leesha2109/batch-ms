"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        background: "linear-gradient(160deg, #001D39 0%, #0A4174 50%, #7BBDE8 85%, #BDD8E9 100%)",
      }}
    >
      <main className="flex flex-col items-center justify-center gap-4 text-center px-8">
        {/* Glass Frame Container */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "24px",
            padding: "60px 50px",
            maxWidth: "500px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          }}
        >

        {/* Icon */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "24px",
            background: "#FFE566",
            border: "3px solid rgba(255,255,255,0.6)",
            boxShadow: "0 0 0 6px rgba(255,229,102,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            margin: "0 auto 20px",
          }}
        >
          {/* Replace with your preferred icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"
            fill="none" stroke="#001D39" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>

        {/* Logo pill */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 500,
            color: "#fff",
            background: "rgba(189,216,233,0.15)",
            border: "1px solid rgba(255,229,102,0.45)",
            borderRadius: "10px",
            padding: "6px 24px",
            letterSpacing: "0.5px",
          }}
        >
          Batch<span style={{ color: "#FFE566" }}>MS</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mt-4">
          Welcome to BatchMS
        </h1>

        {/* Subtitle */}
        <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: "340px", lineHeight: 1.8, fontSize: "17px" }}>
          A comprehensive Special Batch management system for University Of Ruhuna.
    
        </p>
        <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: "340px", lineHeight: 1.8, fontSize: "14px" }}>
          Department Of Computer Science.
        </p>


        {/* Login Button */}
        <button
          onClick={() => router.push("/login")}
          style={{
            marginTop: "24px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 40px",
            borderRadius: "10px",
            background: "#FFE566",
            border: "none",
            color: "#001D39",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#FFD633", e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.background = "#FFE566", e.currentTarget.style.transform = "translateY(0)")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="#001D39" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Login
        </button>

        </div>
      </main>
    </div>
  );
}
