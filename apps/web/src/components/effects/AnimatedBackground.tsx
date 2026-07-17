export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at 20% 20%, rgba(0,255,136,0.08), transparent 40%)," +
          "radial-gradient(circle at 80% 60%, rgba(0,170,255,0.06), transparent 40%)," +
          "radial-gradient(circle at 40% 90%, rgba(255,0,120,0.04), transparent 50%)," +
          "#05060a",
        zIndex: 0,
        animation: "pulse 6s infinite alternate",
      }}
    />
  );
}