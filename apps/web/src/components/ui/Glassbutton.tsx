 
import type { ReactNode } from "react";

export default function GlassButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass glow-text"
      style={{
        padding: "10px 14px",
        cursor: "pointer",
        marginRight: 8,
        transition: "0.2s",
      }}
    >
      {children}
    </button>
  );
}