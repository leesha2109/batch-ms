"use client";

import { useState, useEffect } from "react";
import TopHeader from "@/components/TopHeader";

export default function StudentSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/settings/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setForm({
            name: data.user.name || "",
            phone: data.user.phone || "",
            bio: data.user.bio || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Unable to save profile");
      } else {
        setProfile(data.user);
        setSuccess("Profile saved successfully.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopHeader title="Settings" subtitle="Update your student profile" />

      <div className="px-8 py-6">
        {loading ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-sm text-gray-400">Loading your profile…</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-6 max-w-3xl">
            <form onSubmit={handleSave} className="space-y-6">
              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  value={profile?.email || ""}
                  disabled
                  className="mt-2 w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={4}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="A short note about yourself"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
