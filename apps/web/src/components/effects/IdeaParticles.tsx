import { useMemo } from "react";

const ideas = [
  "Create a dog tag",
  "Create a wedding living memory",
  "Create a relationship living memory",
  "Create a living memory",
  "Create an artist film",
  "Create a business film",
  "Create an event",
  "Create a rave living memory",
  "Make this funny",
  "Make this weird",
  "Bring this place to life",
  "Turn this into a game",
];

const traces = [
  { left: "12%", top: "26%", width: "24vw", rotate: -18 },
  { left: "60%", top: "24%", width: "28vw", rotate: 18 },
  { left: "18%", top: "60%", width: "34vw", rotate: 14 },
  { left: "57%", top: "63%", width: "30vw", rotate: -14 },
  { left: "38%", top: "18%", width: "22vw", rotate: 90 },
  { left: "47%", top: "50%", width: "20vw", rotate: 0 },
];

export default function IdeaParticles() {
  const particles = useMemo(
    () =>
      ideas.map((text, index) => ({
        text,
        index,
        duration: 18 + index * 1.7,
        delay: -(index * 2.1),
        size: 12 + (index % 3),
      })),
    [],
  );

  return (
    <div className="idea-particle-layer" aria-hidden="true">
      <div className="qre-circuit-core" />

      {traces.map((trace, index) => (
        <div
          key={`trace-${index}`}
          className="qre-circuit-trace"
          style={{
            left: trace.left,
            top: trace.top,
            width: trace.width,
            transform: `rotate(${trace.rotate}deg)`,
            animationDelay: `${index * -1.4}s`,
          }}
        >
          <span className="qre-circuit-pulse" />
        </div>
      ))}

      {particles.map((particle) => (
        <div
          key={particle.index}
          className="idea-particle"
          style={{
            fontSize: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          <span className="idea-node" />
          <span className="idea-label">{particle.text}</span>
        </div>
      ))}

      <style>{`
        .idea-particle-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          isolation: isolate;
        }

        .qre-circuit-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 2px;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 0 10px rgba(255,255,255,.3), 0 0 38px rgba(255,255,255,.12);
          opacity: .8;
        }

        .qre-circuit-trace {
          position: absolute;
          height: 1px;
          transform-origin: left center;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.045) 8%, rgba(255,255,255,.12) 48%, rgba(255,255,255,.045) 92%, transparent);
          box-shadow: 0 0 8px rgba(255,255,255,.035);
          opacity: .72;
        }

        .qre-circuit-trace::before,
        .qre-circuit-trace::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 4px;
          height: 4px;
          margin-top: -2px;
          border-radius: 50%;
          background: rgba(255,255,255,.2);
          box-shadow: 0 0 12px rgba(255,255,255,.12);
        }

        .qre-circuit-trace::before { left: 2%; }
        .qre-circuit-trace::after { right: 2%; }

        .qre-circuit-pulse {
          position: absolute;
          top: -1px;
          left: -10px;
          width: 24px;
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,.5);
          filter: blur(.8px);
          animation: qreCircuitPulse 5s linear infinite;
        }

        .idea-particle {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 270px;
          color: rgba(255,255,255,.23);
          letter-spacing: 1.1px;
          white-space: normal;
          animation: floatIdea linear infinite;
          text-shadow: 0 0 18px rgba(255,255,255,.05);
        }

        .idea-node {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: rgba(255,255,255,.58);
          box-shadow: 0 0 8px rgba(255,255,255,.28), 0 0 22px rgba(255,255,255,.08);
        }

        .idea-particle:nth-child(8) { top: 13%; left: 8%; }
        .idea-particle:nth-child(9) { top: 20%; right: 7%; }
        .idea-particle:nth-child(10) { top: 38%; left: 5%; }
        .idea-particle:nth-child(11) { top: 52%; right: 8%; }
        .idea-particle:nth-child(12) { top: 72%; left: 9%; }
        .idea-particle:nth-child(13) { top: 14%; left: 51%; }
        .idea-particle:nth-child(14) { top: 79%; right: 8%; }
        .idea-particle:nth-child(15) { top: 46%; left: 66%; }
        .idea-particle:nth-child(16) { top: 31%; left: 25%; }
        .idea-particle:nth-child(17) { top: 68%; left: 34%; }
        .idea-particle:nth-child(18) { top: 33%; right: 27%; }
        .idea-particle:nth-child(19) { top: 85%; left: 44%; }

        @media (max-width: 768px) {
          .idea-particle { font-size: 11px !important; max-width: 165px; }
          .idea-particle:nth-child(n + 14) { display: none; }
          .qre-circuit-trace:nth-of-type(n + 4) { display: none; }
        }

        @keyframes floatIdea {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -18px, 0); }
        }

        @keyframes qreCircuitPulse {
          from { transform: translateX(0); opacity: 0; }
          8% { opacity: .8; }
          50% { opacity: .5; }
          92% { opacity: .8; }
          to { transform: translateX(calc(24vw - 4px)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
