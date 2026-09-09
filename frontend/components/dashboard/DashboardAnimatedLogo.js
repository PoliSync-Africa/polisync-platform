"use client";

const OFFICIAL_LOGO = "/polisync-official-logo.svg";

export default function DashboardAnimatedLogo() {
  return (
    <div className="dashboard-animated-logo" aria-label="PoliSync Africa">
      <img
        src={OFFICIAL_LOGO}
        alt="PoliSync Africa — Africa's Political Intelligence Platform"
        draggable="false"
      />
      <style jsx>{`
        .dashboard-animated-logo {
          width: 124px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 720px;
          overflow: visible;
        }

        .dashboard-animated-logo img {
          display: block;
          width: 118px;
          height: auto;
          max-height: 66px;
          object-fit: contain;
          object-position: center;
          transform-origin: 50% 50%;
          transform-style: preserve-3d;
          backface-visibility: visible;
          will-change: transform, filter;
          animation: dashboard-logo-swing 2.8s cubic-bezier(.45,.05,.55,.95) infinite;
          filter: drop-shadow(0 4px 8px rgba(6,77,43,.12));
        }

        @keyframes dashboard-logo-swing {
          0%, 100% {
            transform: rotateY(-10deg) rotateX(1deg) scale(.985);
          }
          25% {
            transform: rotateY(-3deg) rotateX(0deg) scale(1);
          }
          50% {
            transform: rotateY(10deg) rotateX(-1deg) scale(.985);
          }
          75% {
            transform: rotateY(3deg) rotateX(0deg) scale(1);
          }
        }

        @media (max-width: 1100px) {
          .dashboard-animated-logo {
            width: 112px;
          }

          .dashboard-animated-logo img {
            width: 106px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-animated-logo img {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
