"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #001D39 0%, #0A4174 50%, #7BBDE8 85%, #BDD8E9 100%)",
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
            padding: "56px 50px",
            maxWidth: "500px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: "104px",
              height: "104px",
              borderRadius: "26px",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "0 12px 28px rgba(0, 29, 57, 0.35), 0 0 0 6px rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              padding: "14px",
            }}
          >
            <Image
              src="/bms.png"
              alt="BMS logo"
              width={80}
              height={80}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* Heading with inline wordmark styling */}
          <h1 className="text-3xl font-bold text-white mt-2 tracking-tight">
            Welcome to <span style={{ color: "#FFE566" }}>BMS</span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "13px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginTop: "4px",
              fontWeight: 600,
            }}
          >
            Batch Management System
          </p>

          {/* Subtitle */}
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              maxWidth: "340px",
              lineHeight: 1.8,
              fontSize: "17px",
              marginTop: "20px",
            }}
          >
            A comprehensive Special Batch Management System for University Of
            Ruhuna.
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              maxWidth: "340px",
              lineHeight: 1.6,
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            Department Of Computer Science
          </p>

          {/* Login Button */}
          <button
            onClick={() => router.push("/login")}
            style={{
              marginTop: "28px",
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
            onMouseEnter={(e) => (
              (e.currentTarget.style.background = "#FFD633"),
              (e.currentTarget.style.transform = "translateY(-2px)")
            )}
            onMouseLeave={(e) => (
              (e.currentTarget.style.background = "#FFE566"),
              (e.currentTarget.style.transform = "translateY(0)")
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#001D39"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Login
          </button>
        </div>

        {/* Footer credit line */}
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "12px",
            marginTop: "20px",
            letterSpacing: "0.02em",
          }}
        >
          © {new Date().getFullYear()} BMS — University of Ruhuna
        </p>
      </main>
    </div>
  );
}