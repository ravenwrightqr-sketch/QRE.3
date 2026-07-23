export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#020202",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,.035), transparent 40%)",
          animation: "qreAtmosphere 25s ease-in-out infinite",
        }}
      />

      <style>
        {`
          @keyframes qreAtmosphere {

            0% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.08);
            }

            100% {
              transform: scale(1);
            }

          }
        `}
      </style>
    </div>
  );
}