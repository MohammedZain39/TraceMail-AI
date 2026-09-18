"use client";

import { useEffect, useState } from "react";

export default function CyberBackground() {
  const [mouse, setMouse] = useState({
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="cyber-background">
      {/* Mouse-following glow */}
      <div
        className="mouse-glow"
        style={{
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
        }}
      />

      {/* Central ambient glow */}
      <div className="ambient-glow" />

      {/* Cyber floor */}
      <div className="cyber-floor">
        <div className="floor-grid" />
        <div className="floor-dots" />
      </div>

      {/* Moving scan line */}
      <div className="scan-line" />

      {/* Floating data particles */}
      <div className="particles">
        <span className="particle p1" />
        <span className="particle p2" />
        <span className="particle p3" />
        <span className="particle p4" />
        <span className="particle p5" />
        <span className="particle p6" />
        <span className="particle p7" />
        <span className="particle p8" />
        <span className="particle p9" />
        <span className="particle p10" />
        <span className="particle p11" />
        <span className="particle p12" />
        <span className="particle p13" />
        <span className="particle p14" />
        <span className="particle p15" />
      </div>

      <style jsx>{`
        /* ==========================
           BACKGROUND WRAPPER
        ========================== */

        .cyber-background {
          position: fixed;
          inset: 0;

          width: 100%;
          height: 100%;

          pointer-events: none;

          overflow: hidden;

          z-index: 0;
        }

        /* ==========================
           MOUSE GLOW
        ========================== */

        .mouse-glow {
          position: fixed;

          width: 420px;
          height: 420px;

          transform: translate(-50%, -50%);

          pointer-events: none;

          border-radius: 50%;

          background: radial-gradient(
            circle,
            rgba(47, 181, 216, 0.11) 0%,
            rgba(47, 181, 216, 0.055) 25%,
            rgba(47, 181, 216, 0.018) 48%,
            transparent 72%
          );

          filter: blur(10px);

          transition:
            left 0.18s ease-out,
            top 0.18s ease-out;

          z-index: 1;
        }

        /* ==========================
           CENTRAL AMBIENT GLOW
        ========================== */

        .ambient-glow {
          position: fixed;

          width: 850px;
          height: 500px;

          left: 50%;
          top: 55%;

          transform: translate(-50%, -50%);

          background: radial-gradient(
            ellipse,
            rgba(27, 128, 160, 0.075),
            transparent 68%
          );

          filter: blur(28px);

          pointer-events: none;

          animation: ambientPulse 7s ease-in-out infinite;

          z-index: 0;
        }

        /* ==========================
           CYBER FLOOR
        ========================== */

        .cyber-floor {
          position: fixed;

          left: -12%;
          right: -12%;
          bottom: -18%;

          height: 52%;

          transform:
            perspective(650px)
            rotateX(57deg);

          transform-origin: center bottom;

          overflow: hidden;

          pointer-events: none;

          opacity: 0.42;

          z-index: 0;
        }

        .floor-grid {
          position: absolute;

          inset: -30%;

          background-image:
            linear-gradient(
              rgba(38, 157, 190, 0.17) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(38, 157, 190, 0.17) 1px,
              transparent 1px
            );

          background-size: 72px 72px;

          animation: gridMove 14s linear infinite;
        }

        .floor-dots {
          position: absolute;

          inset: 0;

          background-image:
            radial-gradient(
              circle,
              rgba(53, 176, 207, 0.28) 1px,
              transparent 1.5px
            );

          background-size: 25px 25px;

          opacity: 0.5;

          mask-image: linear-gradient(
            to top,
            black,
            transparent 82%
          );
        }

        /* ==========================
           SCAN LINE
        ========================== */

        .scan-line {
          position: fixed;

          left: 0;
          right: 0;

          top: -10px;

          height: 1px;

          background: linear-gradient(
            90deg,
            transparent,
            rgba(57, 185, 219, 0.08),
            rgba(57, 185, 219, 0.32),
            rgba(57, 185, 219, 0.08),
            transparent
          );

          box-shadow:
            0 0 12px rgba(49, 174, 211, 0.16);

          pointer-events: none;

          animation: scan 10s linear infinite;

          z-index: 2;
        }

        /* ==========================
           PARTICLES
        ========================== */

        .particles {
          position: fixed;

          inset: 0;

          overflow: hidden;

          pointer-events: none;

          z-index: 1;
        }

        .particle {
          position: absolute;

          width: 2px;
          height: 2px;

          border-radius: 50%;

          background: rgba(91, 198, 222, 0.42);

          box-shadow:
            0 0 7px rgba(66, 180, 213, 0.4);

          animation:
            particleFloat
            var(--duration)
            ease-in-out
            infinite alternate;
        }

        .p1 {
          left: 8%;
          top: 28%;
          --duration: 6s;
        }

        .p2 {
          left: 17%;
          top: 70%;
          --duration: 8s;
        }

        .p3 {
          left: 26%;
          top: 20%;
          --duration: 7s;
        }

        .p4 {
          left: 34%;
          top: 78%;
          --duration: 9s;
        }

        .p5 {
          left: 43%;
          top: 14%;
          --duration: 6.5s;
        }

        .p6 {
          left: 52%;
          top: 72%;
          --duration: 8s;
        }

        .p7 {
          left: 61%;
          top: 25%;
          --duration: 7s;
        }

        .p8 {
          left: 70%;
          top: 67%;
          --duration: 9s;
        }

        .p9 {
          left: 78%;
          top: 35%;
          --duration: 6s;
        }

        .p10 {
          left: 88%;
          top: 76%;
          --duration: 8s;
        }

        .p11 {
          left: 94%;
          top: 42%;
          --duration: 7s;
        }

        .p12 {
          left: 12%;
          top: 84%;
          --duration: 9s;
        }

        .p13 {
          left: 73%;
          top: 16%;
          --duration: 7s;
        }

        .p14 {
          left: 57%;
          top: 88%;
          --duration: 8s;
        }

        .p15 {
          left: 37%;
          top: 31%;
          --duration: 6s;
        }

        /* ==========================
           ANIMATIONS
        ========================== */

        @keyframes gridMove {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(72px);
          }
        }

        @keyframes scan {
          0% {
            top: -10px;
            opacity: 0;
          }

          10% {
            opacity: 0.45;
          }

          90% {
            opacity: 0.45;
          }

          100% {
            top: 105%;
            opacity: 0;
          }
        }

        @keyframes particleFloat {
          from {
            transform:
              translate3d(0, 0, 0)
              scale(0.8);

            opacity: 0.18;
          }

          to {
            transform:
              translate3d(10px, -25px, 0)
              scale(1.2);

            opacity: 0.65;
          }
        }

        @keyframes ambientPulse {
          0%,
          100% {
            opacity: 0.5;

            transform:
              translate(-50%, -50%)
              scale(1);
          }

          50% {
            opacity: 0.85;

            transform:
              translate(-50%, -50%)
              scale(1.08);
          }
        }

        /* ==========================
           REDUCED MOTION
        ========================== */

        @media (prefers-reduced-motion: reduce) {
          .mouse-glow {
            transition: none;
          }

          .ambient-glow,
          .floor-grid,
          .scan-line,
          .particle {
            animation: none;
          }
        }

        /* ==========================
           MOBILE
        ========================== */

        @media (max-width: 600px) {
          .mouse-glow {
            display: none;
          }

          .cyber-floor {
            height: 40%;
            bottom: -12%;
          }

          .scan-line {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}