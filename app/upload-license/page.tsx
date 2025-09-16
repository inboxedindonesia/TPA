"use client";
import { useState } from "react";

export default function UploadLicensePage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("/api/upload-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">License</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs p-4 bg-white rounded shadow border"
      >
        <textarea
          name="licenseKey"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          rows={4}
          className="border rounded p-2 text-sm resize-none"
          placeholder="Paste your license key here"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold"
        >
          Submit
        </button>
      </form>
      {message && <p className="mt-4 text-red-600 text-sm">{message}</p>}
    </div>
  );
}
