"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CyberBackground from "../../components/CyberBackground";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setSuccess(
          "ACCOUNT CREATED. CHECK YOUR EMAIL TO VERIFY YOUR ACCOUNT."
        );

        setLoading(false);

        setTimeout(() => {
          router.push("/login");
        }, 1800);

        return;
      }

      setLoading(false);

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Registration error:", err);

      setError("Unable to create account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <CyberBackground />

      <main className="register-page">

        {/* TOP BRANDING */}
        <div className="register-top-brand">
          <div className="brand-mark">
            <div className="brand-mark-inner">
              T
            </div>
          </div>

          <div>
            <div className="brand-name">
              TRACE MAIL <span>AI</span>
            </div>

            <div className="brand-subtitle">
              FORENSIC INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        {/* CENTER CONTENT */}
        <section className="register-container">

          {/* BRAND / LOGO */}
          <div className="register-brand">

            <div className="register-icon">

              <div className="icon-ring ring-one" />
              <div className="icon-ring ring-two" />

              <div className="shield">
                <div className="shield-line" />
                <div className="shield-core">
                  T
                </div>
              </div>

            </div>

            <h1>
              TRACE MAIL <span>AI</span>
            </h1>

            <p>
              FROM SUSPICIOUS EMAIL TO FORENSIC INTELLIGENCE
            </p>

          </div>

          {/* REGISTER FORM */}
          <div className="register-form-wrapper">

            <div className="section-label">
              <span className="label-line" />
              NEW USER REGISTRATION
              <span className="label-line" />
            </div>

            <form
              onSubmit={handleRegister}
              className="register-form"
            >

              {/* FULL NAME */}
              <div className="input-group">

                <label htmlFor="name">
                  FULL NAME
                </label>

                <div className="input-wrapper">

                  <span className="input-prefix">
                    ID
                  </span>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="ENTER YOUR NAME"
                    autoComplete="name"
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div className="input-group">

                <label htmlFor="email">
                  ANALYST EMAIL
                </label>

                <div className="input-wrapper">

                  <span className="input-prefix">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="ANALYST@COMPANY.COM"
                    autoComplete="email"
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="input-group">

                <label htmlFor="password">
                  PASSWORD
                </label>

                <div className="input-wrapper">

                  <span className="input-prefix">
                    #
                  </span>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="CREATE PASSWORD"
                    autoComplete="new-password"
                  />

                </div>

              </div>

              {/* CONFIRM PASSWORD */}
              <div className="input-group">

                <label htmlFor="confirmPassword">
                  CONFIRM PASSWORD
                </label>

                <div className="input-wrapper">

                  <span className="input-prefix">
                    #
                  </span>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="CONFIRM PASSWORD"
                    autoComplete="new-password"
                  />

                </div>

              </div>

              {/* PASSWORD INFO */}
              <div className="password-info">
                <span className="status-dot" />
                MINIMUM 6 CHARACTERS REQUIRED
              </div>

              {/* ERROR */}
              {error && (
                <div className="form-message error-message">
                  <span className="message-icon">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* SUCCESS */}
              {success && (
                <div className="form-message success-message">
                  <span className="message-icon">✓</span>
                  <span>{success}</span>
                </div>
              )}

              {/* REGISTER BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="register-button"
              >

                <span className="button-corner top-left" />
                <span className="button-corner top-right" />
                <span className="button-corner bottom-left" />
                <span className="button-corner bottom-right" />

                <span className="button-text">

                  {loading
                    ? "INITIALIZING..."
                    : "CREATE ACCOUNT"}

                </span>

                <span className="button-arrow">
                  →
                </span>

                <span className="button-scan" />

              </button>

            </form>

            {/* LOGIN LINK */}
            <div className="login-link">

              <span>
                ALREADY HAVE AN ACCOUNT?
              </span>

              <Link href="/login">
                SIGN IN
              </Link>

            </div>

          </div>

          {/* SECURITY FOOTER */}
          <div className="register-footer">

            <span className="footer-status">
              <span className="status-dot green" />
              SYSTEM SECURE
            </span>

            <span className="footer-divider">
              //
            </span>

            <span>
              TRACEMAIL AI
            </span>

            <span className="footer-divider">
              //
            </span>

            <span>
              AUTHENTICATION NODE
            </span>

          </div>

        </section>

      </main>

      <style jsx>{`

        /* =========================================
           PAGE
        ========================================= */

        .register-page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          color: #e5faff;
          font-family: "Rajdhani", sans-serif;
          overflow: hidden;
          z-index: 2;
        }


        /* =========================================
           TOP BRAND
        ========================================= */

        .register-top-brand {
          position: fixed;
          top: 28px;
          left: 34px;
          display: flex;
          align-items: center;
          gap: 11px;
          z-index: 10;
          animation: brandEnter 0.8s ease forwards;
        }

        .brand-mark {
          width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(67, 220, 255, 0.65);
          background: rgba(0, 20, 32, 0.55);
          box-shadow:
            0 0 12px rgba(67, 220, 255, 0.16),
            inset 0 0 10px rgba(67, 220, 255, 0.08);
        }

        .brand-mark-inner {
          font-size: 13px;
          font-weight: 700;
          color: #52e5ff;
          text-shadow: 0 0 8px rgba(82, 229, 255, 0.7);
        }

        .brand-name {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 2px;
          line-height: 1;
          color: #e8fbff;
        }

        .brand-name span {
          color: #45dcff;
          text-shadow: 0 0 9px rgba(69, 220, 255, 0.55);
        }

        .brand-subtitle {
          margin-top: 4px;
          font-size: 7px;
          letter-spacing: 2.2px;
          color: rgba(170, 205, 215, 0.48);
        }


        /* =========================================
           MAIN CONTAINER
        ========================================= */

        .register-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: containerEnter 0.9s ease forwards;
        }


        /* =========================================
           BRAND
        ========================================= */

        .register-brand {
          text-align: center;
          margin-bottom: 25px;
          animation: logoEnter 0.8s ease forwards;
        }

        .register-brand h1 {
          margin: 13px 0 0;
          font-size: 28px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: 5px;
          color: #ecfcff;
          text-shadow:
            0 0 9px rgba(210, 249, 255, 0.18),
            0 0 25px rgba(36, 212, 255, 0.08);
        }

        .register-brand h1 span {
          color: #4ce1ff;
          text-shadow:
            0 0 7px rgba(76, 225, 255, 0.8),
            0 0 22px rgba(76, 225, 255, 0.35);
        }

        .register-brand p {
          margin: 8px 0 0;
          font-size: 8px;
          letter-spacing: 2.5px;
          color: rgba(170, 210, 220, 0.48);
        }


        /* =========================================
           CYBER ICON
        ========================================= */

        .register-icon {
          position: relative;
          width: 76px;
          height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(63, 222, 255, 0.25);
        }

        .ring-one {
          width: 72px;
          height: 72px;
          animation: rotateRing 9s linear infinite;
          border-top-color: rgba(63, 222, 255, 0.8);
          border-bottom-color: rgba(63, 222, 255, 0.5);
        }

        .ring-two {
          width: 58px;
          height: 58px;
          border-color: rgba(63, 222, 255, 0.14);
          border-right-color: rgba(63, 222, 255, 0.7);
          animation: rotateRingReverse 6s linear infinite;
        }

        .shield {
          position: relative;
          width: 36px;
          height: 42px;
          clip-path: polygon(
            50% 0%,
            91% 15%,
            85% 67%,
            50% 100%,
            15% 67%,
            9% 15%
          );
          background: rgba(35, 203, 242, 0.08);
          border: 1px solid rgba(72, 225, 255, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 12px rgba(55, 221, 255, 0.18),
            inset 0 0 14px rgba(55, 221, 255, 0.08);
        }

        .shield-core {
          font-size: 15px;
          font-weight: 700;
          color: #57e4ff;
          text-shadow:
            0 0 7px rgba(87, 228, 255, 0.9);
        }

        .shield-line {
          position: absolute;
          left: 4px;
          right: 4px;
          top: 50%;
          height: 1px;
          background: rgba(70, 222, 255, 0.35);
        }


        /* =========================================
           SECTION LABEL
        ========================================= */

        .section-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 8px;
          letter-spacing: 2.3px;
          color: rgba(119, 219, 239, 0.56);
        }

        .label-line {
          height: 1px;
          width: 36px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(53, 214, 247, 0.42)
          );
        }

        .label-line:last-child {
          transform: rotate(180deg);
        }


        /* =========================================
           FORM
        ========================================= */

        .register-form-wrapper {
          width: 100%;
          animation: formEnter 0.9s ease 0.15s both;
        }

        .register-form {
          width: 100%;
        }

        .input-group {
          margin-bottom: 13px;
        }

        .input-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 8px;
          letter-spacing: 1.8px;
          color: rgba(170, 211, 221, 0.55);
        }

        .input-wrapper {
          position: relative;
          width: 100%;
        }

        .input-prefix {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: rgba(61, 220, 255, 0.48);
          pointer-events: none;
          z-index: 2;
        }

        .input-wrapper input {
          width: 100%;
          height: 37px;
          box-sizing: border-box;
          border: 1px solid rgba(109, 162, 176, 0.17);
          background: rgba(4, 15, 25, 0.65);
          color: #dffaff;
          padding: 0 12px 0 32px;
          outline: none;
          border-radius: 1px;
          font-family: "Rajdhani", sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.7px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .input-wrapper input::placeholder {
          color: rgba(125, 165, 176, 0.32);
        }

        .input-wrapper input:hover {
          border-color: rgba(70, 216, 245, 0.28);
          background: rgba(5, 19, 31, 0.75);
        }

        .input-wrapper input:focus {
          border-color: rgba(58, 219, 255, 0.72);
          box-shadow:
            0 0 0 1px rgba(58, 219, 255, 0.06),
            0 0 14px rgba(58, 219, 255, 0.11);
          background: rgba(4, 20, 31, 0.82);
        }

        .input-wrapper:focus-within .input-prefix {
          color: #4de1ff;
          text-shadow: 0 0 8px rgba(77, 225, 255, 0.65);
        }


        /* =========================================
           PASSWORD INFO
        ========================================= */

        .password-info {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 1px;
          margin-bottom: 14px;
          font-size: 7px;
          letter-spacing: 1.5px;
          color: rgba(140, 177, 186, 0.38);
        }

        .status-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #40dfff;
          box-shadow:
            0 0 5px rgba(64, 223, 255, 0.8);
        }

        .status-dot.green {
          background: #40f0a0;
          box-shadow:
            0 0 5px rgba(64, 240, 160, 0.8);
        }


        /* =========================================
           MESSAGES
        ========================================= */

        .form-message {
          min-height: 34px;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 12px;
          padding: 8px 11px;
          border-radius: 1px;
          font-size: 9px;
          letter-spacing: 0.7px;
          line-height: 1.35;
        }

        .error-message {
          border: 1px solid rgba(255, 77, 98, 0.25);
          background: rgba(255, 40, 60, 0.055);
          color: rgba(255, 135, 148, 0.85);
        }

        .success-message {
          border: 1px solid rgba(62, 241, 165, 0.25);
          background: rgba(35, 220, 135, 0.055);
          color: rgba(110, 246, 186, 0.86);
        }

        .message-icon {
          font-weight: 700;
          color: currentColor;
        }


        /* =========================================
           REGISTER BUTTON
        ========================================= */

        .register-button {
          position: relative;
          width: 100%;
          height: 39px;
          margin-top: 4px;
          border: 1px solid rgba(55, 220, 255, 0.5);
          background:
            linear-gradient(
              90deg,
              rgba(20, 164, 195, 0.10),
              rgba(45, 215, 244, 0.16),
              rgba(20, 164, 195, 0.10)
            );
          color: #57e4ff;
          cursor: pointer;
          overflow: hidden;
          font-family: "Rajdhani", sans-serif;
          letter-spacing: 2px;
          font-size: 10px;
          font-weight: 700;
          transition:
            background 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .register-button:hover:not(:disabled) {
          border-color: rgba(79, 228, 255, 0.95);
          background:
            linear-gradient(
              90deg,
              rgba(20, 164, 195, 0.18),
              rgba(45, 215, 244, 0.25),
              rgba(20, 164, 195, 0.18)
            );
          box-shadow:
            0 0 15px rgba(50, 220, 255, 0.12),
            inset 0 0 15px rgba(50, 220, 255, 0.05);
        }

        .register-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .button-text {
          position: relative;
          z-index: 3;
        }

        .button-arrow {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          font-size: 14px;
          color: rgba(79, 226, 255, 0.7);
          transition: transform 0.2s ease;
        }

        .register-button:hover .button-arrow {
          transform:
            translate(3px, -50%);
        }

        .button-scan {
          position: absolute;
          top: 0;
          left: -100%;
          width: 70%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(91, 231, 255, 0.10),
            transparent
          );
          transform: skewX(-20deg);
          transition: left 0.7s ease;
        }

        .register-button:hover .button-scan {
          left: 130%;
        }

        .button-corner {
          position: absolute;
          width: 7px;
          height: 7px;
          border-color: rgba(74, 226, 255, 0.9);
          border-style: solid;
          z-index: 4;
        }

        .top-left {
          top: -1px;
          left: -1px;
          border-width: 1px 0 0 1px;
        }

        .top-right {
          top: -1px;
          right: -1px;
          border-width: 1px 1px 0 0;
        }

        .bottom-left {
          bottom: -1px;
          left: -1px;
          border-width: 0 0 1px 1px;
        }

        .bottom-right {
          bottom: -1px;
          right: -1px;
          border-width: 0 1px 1px 0;
        }


        /* =========================================
           LOGIN LINK
        ========================================= */

        .login-link {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          margin-top: 17px;
          font-size: 8px;
          letter-spacing: 1.4px;
          color: rgba(142, 180, 189, 0.42);
        }

        .login-link a {
          color: rgba(72, 224, 255, 0.78);
          text-decoration: none;
          font-weight: 700;
          transition: color 0.2s ease, text-shadow 0.2s ease;
        }

        .login-link a:hover {
          color: #62e7ff;
          text-shadow:
            0 0 8px rgba(62, 224, 255, 0.65);
        }


        /* =========================================
           FOOTER
        ========================================= */

        .register-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 30px;
          font-size: 6px;
          letter-spacing: 1.6px;
          color: rgba(126, 166, 175, 0.25);
          animation: footerEnter 1s ease 0.4s both;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .footer-divider {
          color: rgba(92, 145, 157, 0.2);
        }


        /* =========================================
           ANIMATIONS
        ========================================= */

        @keyframes brandEnter {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes containerEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logoEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes formEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes footerEnter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes rotateRing {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateRingReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 600px) {

          .register-page {
            padding:
              80px 20px
              35px;
          }

          .register-top-brand {
            top: 20px;
            left: 20px;
          }

          .brand-name {
            font-size: 14px;
          }

          .brand-subtitle {
            font-size: 6px;
          }

          .register-brand h1 {
            font-size: 23px;
            letter-spacing: 3px;
          }

          .register-brand p {
            font-size: 6px;
            letter-spacing: 1.7px;
          }

          .register-container {
            max-width: 390px;
          }

          .register-footer {
            flex-wrap: wrap;
            line-height: 1.8;
          }

        }

      `}</style>
    </>
  );
}