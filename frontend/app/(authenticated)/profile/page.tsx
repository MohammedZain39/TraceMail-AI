"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("TraceMail Analyst");
  const [email, setEmail] = useState("analyst@tracemail.local");
  const [role, setRole] = useState("Security Analyst");

  const handleLogout = () => {
    // Temporary demo logout.
    // Real JWT/session logout will be connected when backend auth is added.
    localStorage.removeItem("tracemail_user");
    localStorage.removeItem("tracemail_session");

    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#07111c] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-[#08131f] p-5">
        <div className="mb-10">
          <div className="text-xl font-bold tracking-[0.25em] text-cyan-400">
            TRACE MAIL
          </div>

          <div className="text-xs tracking-[0.35em] text-slate-500">
            AI FORENSICS
          </div>
        </div>

        <nav className="space-y-7 text-sm">
          <NavGroup title="OVERVIEW">
            <NavButton
              label="Dashboard"
              onClick={() => router.push("/dashboard")}
            />
          </NavGroup>

          <NavGroup title="INVESTIGATE">
            <NavButton
              label="New Analysis"
              onClick={() => router.push("/analysis/new")}
            />

            <NavButton
              label="Investigations"
              onClick={() => router.push("/investigations")}
            />
          </NavGroup>

          <NavGroup title="INTELLIGENCE">
            <NavButton
              label="Threat Graph"
              onClick={() => router.push("/threat-graph")}
            />

            <NavButton
              label="Campaigns"
              onClick={() => router.push("/campaigns")}
            />

            <NavButton
              label="Geo Intelligence"
              onClick={() => router.push("/geo-intelligence")}
            />
          </NavGroup>

          <NavGroup title="EVIDENCE">
            <NavButton
              label="Evidence Integrity"
              onClick={() => router.push("/evidence")}
            />

            <NavButton
              label="Reports"
              onClick={() => router.push("/reports")}
            />
          </NavGroup>

          <NavGroup title="SYSTEM">
            <NavButton
              label="Settings"
              onClick={() => router.push("/settings")}
            />

            <NavButton
              label="Profile"
              active
              onClick={() => router.push("/profile")}
            />
          </NavGroup>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-5 right-5">
          <button
            onClick={handleLogout}
            className="w-full border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-xs font-semibold tracking-wider text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
          >
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="ml-64 min-h-screen p-8">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-xs tracking-[0.3em] text-cyan-400">
            USER CONFIGURATION
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Analyst Profile
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage your TraceMail analyst identity and session.
          </p>
        </div>

        {/* Profile identity */}
        <section className="mb-6 border border-slate-800 bg-[#0a1622] p-6">
          <div className="flex items-center gap-5 border-b border-slate-800 pb-6">
            <div className="flex h-16 w-16 items-center justify-center border border-cyan-400/30 bg-cyan-500/10 text-xl font-semibold text-cyan-400">
              TA
            </div>

            <div>
              <p className="text-lg font-semibold">
                {name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {role}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-400" />

                <span className="text-xs text-emerald-400">
                  ACTIVE SESSION
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <ProfileField
              label="DISPLAY NAME"
              value={name}
              onChange={setName}
            />

            <ProfileField
              label="EMAIL ADDRESS"
              value={email}
              onChange={setEmail}
            />

            <ProfileField
              label="ROLE"
              value={role}
              onChange={setRole}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => alert("Profile updated successfully.")}
              className="border border-cyan-400 bg-cyan-500 px-5 py-3 text-xs font-semibold tracking-wider text-black hover:bg-cyan-300"
            >
              SAVE PROFILE
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="mb-6 border border-slate-800 bg-[#0a1622]">
          <div className="border-b border-slate-800 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400">
              ACCOUNT
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Current account and authentication information.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-800">
            <AccountItem
              label="ACCOUNT TYPE"
              value="ANALYST"
            />

            <AccountItem
              label="AUTHENTICATION"
              value="LOCAL SESSION"
            />

            <AccountItem
              label="ACCESS LEVEL"
              value="INVESTIGATION"
            />

            <AccountItem
              label="SESSION STATUS"
              value="ACTIVE"
            />
          </div>
        </section>

        {/* Security */}
        <section className="mb-6 border border-slate-800 bg-[#0a1622]">
          <div className="border-b border-slate-800 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400">
              SECURITY
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Account security controls.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            <SecurityRow
              title="PASSWORD"
              description="Change your account password."
              action="CHANGE PASSWORD"
              onClick={() =>
                alert("Password management will be connected with backend authentication.")
              }
            />

            <SecurityRow
              title="ACTIVE SESSIONS"
              description="Review and revoke active sessions."
              action="MANAGE SESSIONS"
              onClick={() =>
                alert("Session management will be connected later.")
              }
            />

            <SecurityRow
              title="TWO-FACTOR AUTHENTICATION"
              description="Add an additional authentication layer to your account."
              action="CONFIGURE"
              onClick={() =>
                alert("2FA will be connected after backend authentication.")
              }
            />
          </div>
        </section>

        {/* Logout */}
        <section className="border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-red-400">
            SESSION
          </p>

          <p className="mt-3 text-sm text-slate-400">
            Sign out of the current TraceMail AI session.
          </p>

          <button
            onClick={handleLogout}
            className="mt-5 border border-red-500/30 px-5 py-3 text-xs font-semibold tracking-wider text-red-400 hover:bg-red-500/10"
          >
            SIGN OUT OF TRACE MAIL
          </button>
        </section>
      </section>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] text-slate-500">
        {title}
      </p>

      {children}
    </div>
  );
}

function NavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mt-1 w-full rounded px-3 py-2 text-left ${
        active
          ? "bg-cyan-500/10 text-cyan-400"
          : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function ProfileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-slate-700 bg-[#08131f] px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400"
      />
    </div>
  );
}

function AccountItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#08131f] p-5">
      <p className="text-[10px] tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function SecurityRow({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-8 p-6">
      <div>
        <p className="text-sm font-medium text-slate-200">
          {title}
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <button
        onClick={onClick}
        className="shrink-0 border border-slate-700 px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
      >
        {action}
      </button>
    </div>
  );
}