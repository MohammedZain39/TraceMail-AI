"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CyberBackground from "../../components/CyberBackground";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  console.log("🔥 LOGIN HANDLER FIRED");

  setError("");

    if (!email.trim()) {
      setError("PLEASE ENTER YOUR ANALYST EMAIL.");
      return;
    }

    if (!password) {
      setError("PLEASE ENTER YOUR PASSWORD.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setError(error.message.toUpperCase());
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("AUTHENTICATION SESSION COULD NOT BE CREATED.");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "AUTHENTICATION SERVICE UNAVAILABLE. PLEASE TRY AGAIN."
      );

      setLoading(false);
    }
  }

  return (
    <>
      <CyberBackground />

      <main className="login-page">

        {/* TOP BRANDING */}
        <div className="top-brand">
          <div className="shield-logo">
            <div className="shield-inner">T</div>
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

        {/* CENTER LOGIN */}
        <section className="login-container">

          {/* BRAND */}
          <div className="center-brand">

            <div className="center-icon">

              <div className="icon-ring ring-one" />
              <div className="icon-ring ring-two" />

              <div className="center-shield">
                <div className="shield-line" />

                <div className="center-shield-inner">
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

          {/* FORM */}
          <div className="login-form-wrapper">

            <div className="form-title">

              <span className="title-line" />

              ANALYST AUTHENTICATION

              <span className="title-line" />

            </div>

            <form
              className="login-form"
              onSubmit={handleLogin}
            >

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
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="ENTER PASSWORD"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "◉" : "○"}
                  </button>

                </div>

              </div>

              {/* OPTIONS */}
              <div className="login-options">

                <label className="remember">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span className="custom-check" />

                  <span>
                    REMEMBER SESSION
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() =>
                    setError(
                      "PASSWORD RECOVERY IS AVAILABLE THROUGH YOUR AUTHENTICATION PROVIDER."
                    )
                  }
                >
                  FORGOT PASSWORD?
                </button>

              </div>

              {/* ERROR */}
              {error && (
                <div className="error-message">
                  <span className="error-icon">
                    !
                  </span>

                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                <span className="button-corner top-left" />
                <span className="button-corner top-right" />
                <span className="button-corner bottom-left" />
                <span className="button-corner bottom-right" />

                <span className="button-text">
                  {loading
                    ? "AUTHENTICATING..."
                    : "LOGIN"}
                </span>

                <span className="button-arrow">
                  →
                </span>

                <span className="button-scan" />

              </button>

            </form>

            {/* REGISTER */}
            <div className="register-link">

              <span>
                NEW USER?
              </span>

              <Link href="/register">
                CREATE ACCOUNT
              </Link>

            </div>

          </div>

          {/* FOOTER */}
          <div className="login-footer">

            <span className="system-status">

              <span className="status-dot" />

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
              SECURE AUTHENTICATION NODE
            </span>

          </div>

        </section>

      </main>

      <style jsx>{`

        /* =====================================
           PAGE
        ===================================== */

        .login-page {
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

          /* Keep the login UI above all decorative/background layers. */
          z-index: 20;
          pointer-events: auto;
        }


        /* =====================================
           TOP BRAND
        ===================================== */

        .top-brand {
          position: fixed;

          top: 28px;
          left: 34px;

          display: flex;
          align-items: center;

          gap: 11px;

          z-index: 10;

          animation:
            brandEnter
            0.8s
            ease
            forwards;
        }

        .shield-logo {
          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(67, 220, 255, 0.65);

          background:
            rgba(0, 20, 32, 0.55);

          box-shadow:
            0 0 12px
            rgba(67, 220, 255, 0.16),

            inset 0 0 10px
            rgba(67, 220, 255, 0.08);
        }

        .shield-inner {
          font-size: 13px;
          font-weight: 700;

          color: #52e5ff;

          text-shadow:
            0 0 8px
            rgba(82, 229, 255, 0.7);
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

          text-shadow:
            0 0 9px
            rgba(69, 220, 255, 0.55);
        }

        .brand-subtitle {
          margin-top: 4px;

          font-size: 7px;

          letter-spacing: 2.2px;

          color:
            rgba(170, 205, 215, 0.48);
        }


        /* =====================================
           CONTAINER
        ===================================== */

        .login-container {
          width: 100%;
          max-width: 420px;

          display: flex;
          flex-direction: column;
          align-items: center;

          animation:
            containerEnter
            0.9s
            ease
            forwards;
        }


        /* =====================================
           CENTER BRAND
        ===================================== */

        .center-brand {
          text-align: center;

          margin-bottom: 25px;

          animation:
            logoEnter
            0.8s
            ease
            forwards;
        }

        .center-brand h1 {
          margin: 13px 0 0;

          font-size: 28px;

          line-height: 1;

          font-weight: 700;

          letter-spacing: 5px;

          color: #ecfcff;

          text-shadow:
            0 0 9px
            rgba(210, 249, 255, 0.18),

            0 0 25px
            rgba(36, 212, 255, 0.08);
        }

        .center-brand h1 span {
          color: #4ce1ff;

          text-shadow:
            0 0 7px
            rgba(76, 225, 255, 0.8),

            0 0 22px
            rgba(76, 225, 255, 0.35);
        }

        .center-brand p {
          margin: 8px 0 0;

          font-size: 8px;

          letter-spacing: 2.5px;

          color:
            rgba(170, 210, 220, 0.48);
        }


        /* =====================================
           CENTER ICON
        ===================================== */

        .center-icon {
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

          border:
            1px solid
            rgba(63, 222, 255, 0.25);
        }

        .ring-one {
          width: 72px;
          height: 72px;

          border-top-color:
            rgba(63, 222, 255, 0.8);

          border-bottom-color:
            rgba(63, 222, 255, 0.5);

          animation:
            rotateRing
            9s
            linear
            infinite;
        }

        .ring-two {
          width: 58px;
          height: 58px;

          border-color:
            rgba(63, 222, 255, 0.14);

          border-right-color:
            rgba(63, 222, 255, 0.7);

          animation:
            rotateRingReverse
            6s
            linear
            infinite;
        }

        .center-shield {
          position: relative;

          width: 36px;
          height: 42px;

          clip-path:
            polygon(
              50% 0%,
              91% 15%,
              85% 67%,
              50% 100%,
              15% 67%,
              9% 15%
            );

          background:
            rgba(35, 203, 242, 0.08);

          border:
            1px solid
            rgba(72, 225, 255, 0.75);

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 0 12px
            rgba(55, 221, 255, 0.18),

            inset 0 0 14px
            rgba(55, 221, 255, 0.08);
        }

        .center-shield-inner {
          font-size: 15px;
          font-weight: 700;

          color: #57e4ff;

          text-shadow:
            0 0 7px
            rgba(87, 228, 255, 0.9);
        }

        .shield-line {
          position: absolute;

          left: 4px;
          right: 4px;

          top: 50%;

          height: 1px;

          background:
            rgba(70, 222, 255, 0.35);
        }


        /* =====================================
           FORM
        ===================================== */

        .login-form-wrapper {
          position: relative;
          width: 100%;
          z-index: 30;
          pointer-events: auto;

          animation:
            formEnter
            0.9s
            ease
            0.15s
            both;
        }

        .form-title {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 10px;

          margin-bottom: 18px;

          font-size: 8px;

          letter-spacing: 2.3px;

          color:
            rgba(119, 219, 239, 0.56);
        }

        .title-line {
          height: 1px;
          width: 36px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(53, 214, 247, 0.42)
            );
        }

        .title-line:last-child {
          transform: rotate(180deg);
        }

        .login-form {
          position: relative;
          width: 100%;
          z-index: 31;
          pointer-events: auto;
        }


        /* =====================================
           INPUTS
        ===================================== */

        .input-group {
          margin-bottom: 14px;
        }

        .input-group label {
          display: block;

          margin-bottom: 6px;

          font-size: 8px;

          letter-spacing: 1.8px;

          color:
            rgba(170, 211, 221, 0.55);
        }

        .input-wrapper {
          position: relative;

          width: 100%;
        }

        .input-prefix {
          position: absolute;

          left: 11px;
          top: 50%;

          transform:
            translateY(-50%);

          font-size: 11px;

          color:
            rgba(61, 220, 255, 0.48);

          pointer-events: none;

          z-index: 2;
        }

        .input-wrapper input {
          width: 100%;
          height: 37px;

          box-sizing: border-box;

          border:
            1px solid
            rgba(109, 162, 176, 0.17);

          background:
            rgba(4, 15, 25, 0.65);

          color: #dffaff;

          padding:
            0 40px 0 32px;

          outline: none;

          border-radius: 1px;

          font-family:
            "Rajdhani",
            sans-serif;

          font-size: 12px;

          font-weight: 500;

          letter-spacing: 0.7px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .input-wrapper input::placeholder {
          color:
            rgba(125, 165, 176, 0.32);
        }

        .input-wrapper input:hover {
          border-color:
            rgba(70, 216, 245, 0.28);

          background:
            rgba(5, 19, 31, 0.75);
        }

        .input-wrapper input:focus {
          border-color:
            rgba(58, 219, 255, 0.72);

          box-shadow:
            0 0 0 1px
            rgba(58, 219, 255, 0.06),

            0 0 14px
            rgba(58, 219, 255, 0.11);

          background:
            rgba(4, 20, 31, 0.82);
        }

        .input-wrapper:focus-within
        .input-prefix {
          color: #4de1ff;

          text-shadow:
            0 0 8px
            rgba(77, 225, 255, 0.65);
        }


        /* =====================================
           PASSWORD EYE
        ===================================== */

        .eye-button {
          position: absolute;

          right: 9px;
          top: 50%;

          transform:
            translateY(-50%);

          width: 24px;
          height: 24px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;

          background: transparent;

          color:
            rgba(92, 218, 240, 0.42);

          cursor: pointer;

          font-family:
            "Rajdhani",
            sans-serif;

          font-size: 13px;

          transition:
            color 0.2s ease,
            text-shadow 0.2s ease;
        }

        .eye-button:hover {
          color: #59e4ff;

          text-shadow:
            0 0 8px
            rgba(89, 228, 255, 0.7);
        }


        /* =====================================
           OPTIONS
        ===================================== */

        .login-options {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-top: 4px;
          margin-bottom: 14px;

          font-size: 7px;

          letter-spacing: 1.2px;
        }

        .remember {
          display: flex;

          align-items: center;

          gap: 7px;

          color:
            rgba(143, 181, 190, 0.42);

          cursor: pointer;
        }

        .remember input {
          display: none;
        }

        .custom-check {
          width: 9px;
          height: 9px;

          border:
            1px solid
            rgba(69, 220, 255, 0.35);

          background:
            rgba(0, 20, 30, 0.55);

          position: relative;
        }

        .remember input:checked
        + .custom-check {
          border-color:
            rgba(69, 225, 255, 0.8);

          box-shadow:
            0 0 6px
            rgba(69, 225, 255, 0.22);
        }

        .remember input:checked
        + .custom-check::after {
          content: "";

          position: absolute;

          left: 2px;
          top: 0px;

          width: 3px;
          height: 6px;

          border:
            solid
            #4de1ff;

          border-width:
            0 1px 1px 0;

          transform:
            rotate(45deg);
        }

        .forgot-button {
          border: none;

          background: transparent;

          color:
            rgba(72, 224, 255, 0.55);

          font-family:
            "Rajdhani",
            sans-serif;

          font-size: 7px;

          letter-spacing: 1.2px;

          cursor: pointer;

          padding: 0;
        }

        .forgot-button:hover {
          color: #62e7ff;

          text-shadow:
            0 0 8px
            rgba(62, 224, 255, 0.55);
        }


        /* =====================================
           ERROR
        ===================================== */

        .error-message {
          display: flex;

          align-items: center;

          gap: 9px;

          min-height: 34px;

          margin-bottom: 12px;

          padding: 8px 11px;

          border:
            1px solid
            rgba(255, 77, 98, 0.25);

          background:
            rgba(255, 40, 60, 0.055);

          color:
            rgba(255, 135, 148, 0.85);

          font-size: 8px;

          letter-spacing: 0.65px;

          line-height: 1.35;
        }

        .error-icon {
          font-weight: 700;
        }


        /* =====================================
           LOGIN BUTTON
        ===================================== */

        .login-button {
          position: relative;
          z-index: 40;

          width: 100%;
          height: 39px;

          margin-top: 3px;

          border:
            1px solid
            rgba(55, 220, 255, 0.5);

          background:
            linear-gradient(
              90deg,
              rgba(20, 164, 195, 0.10),
              rgba(45, 215, 244, 0.16),
              rgba(20, 164, 195, 0.10)
            );

          color: #57e4ff;

          cursor: pointer;
          pointer-events: auto;

          overflow: hidden;

          font-family:
            "Rajdhani",
            sans-serif;

          letter-spacing: 2px;

          font-size: 10px;

          font-weight: 700;

          transition:
            background 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          border-color:
            rgba(79, 228, 255, 0.95);

          background:
            linear-gradient(
              90deg,
              rgba(20, 164, 195, 0.18),
              rgba(45, 215, 244, 0.25),
              rgba(20, 164, 195, 0.18)
            );

          box-shadow:
            0 0 15px
            rgba(50, 220, 255, 0.12),

            inset 0 0 15px
            rgba(50, 220, 255, 0.05);
        }

        .login-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .button-text {
          position: relative;
          z-index: 3;
        }

        .button-arrow {
          position: absolute;

          right: 13px;
          top: 50%;

          transform:
            translateY(-50%);

          z-index: 3;

          font-size: 14px;

          color:
            rgba(79, 226, 255, 0.7);

          transition:
            transform 0.2s ease;
        }

        .login-button:hover
        .button-arrow {
          transform:
            translate(3px, -50%);
        }

        .button-scan {
          position: absolute;
          pointer-events: none;

          top: 0;
          left: -100%;

          width: 70%;
          height: 100%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(91, 231, 255, 0.10),
              transparent
            );

          transform:
            skewX(-20deg);

          transition:
            left 0.7s ease;
        }

        .login-button:hover
        .button-scan {
          left: 130%;
        }

        .button-corner {
          position: absolute;
          pointer-events: none;

          width: 7px;
          height: 7px;

          border-color:
            rgba(74, 226, 255, 0.9);

          border-style: solid;

          z-index: 4;
        }

        .top-left {
          top: -1px;
          left: -1px;

          border-width:
            1px 0 0 1px;
        }

        .top-right {
          top: -1px;
          right: -1px;

          border-width:
            1px 1px 0 0;
        }

        .bottom-left {
          bottom: -1px;
          left: -1px;

          border-width:
            0 0 1px 1px;
        }

        .bottom-right {
          bottom: -1px;
          right: -1px;

          border-width:
            0 1px 1px 0;
        }


        /* =====================================
           REGISTER LINK
        ===================================== */

        .register-link {
          display: flex;

          justify-content: center;
          align-items: center;

          gap: 7px;

          margin-top: 17px;

          font-size: 8px;

          letter-spacing: 1.4px;

          color:
            rgba(142, 180, 189, 0.42);
        }

        .register-link a {
          color:
            rgba(72, 224, 255, 0.78);

          text-decoration: none;

          font-weight: 700;

          transition:
            color 0.2s ease,
            text-shadow 0.2s ease;
        }

        .register-link a:hover {
          color: #62e7ff;

          text-shadow:
            0 0 8px
            rgba(62, 224, 255, 0.65);
        }


        /* =====================================
           FOOTER
        ===================================== */

        .login-footer {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          margin-top: 30px;

          font-size: 6px;

          letter-spacing: 1.6px;

          color:
            rgba(126, 166, 175, 0.25);

          animation:
            footerEnter
            1s
            ease
            0.4s
            both;
        }

        .system-status {
          display: flex;

          align-items: center;

          gap: 5px;
        }

        .status-dot {
          display: inline-block;

          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #40f0a0;

          box-shadow:
            0 0 5px
            rgba(64, 240, 160, 0.8);
        }

        .footer-divider {
          color:
            rgba(92, 145, 157, 0.2);
        }


        /* =====================================
           ANIMATIONS
        ===================================== */

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


        /* =====================================
           MOBILE
        ===================================== */

        @media (max-width: 600px) {

          .login-page {
            padding:
              80px 20px
              35px;
          }

          .top-brand {
            top: 20px;
            left: 20px;
          }

          .brand-name {
            font-size: 14px;
          }

          .brand-subtitle {
            font-size: 6px;
          }

          .center-brand h1 {
            font-size: 23px;
            letter-spacing: 3px;
          }

          .center-brand p {
            font-size: 6px;
            letter-spacing: 1.7px;
          }

          .login-container {
            max-width: 390px;
          }

          .login-footer {
            flex-wrap: wrap;
            line-height: 1.8;
          }

        }

      `}</style>
    </>
  );
}