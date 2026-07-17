import type { ReactNode } from "react";

export default function GlassCard({
  children,
  glow = false,
  style,
}: {
  children: ReactNode;
  glow?: boolean;
  style?: React.CSSProperties;
}) {

  return (

    <div

      style={{

        position:"relative",

        padding:24,

        background:
          "linear-gradient(145deg, rgba(20,25,35,.85), rgba(5,8,15,.92))",

        border:
          glow
            ? "1px solid rgba(0,255,200,.35)"
            : "1px solid rgba(255,255,255,.08)",


        borderRadius:14,


        boxShadow:

          glow

          ?

          `
          0 0 25px rgba(0,255,200,.12),
          inset 0 0 40px rgba(0,255,200,.04)
          `

          :

          `
          inset 0 0 30px rgba(255,255,255,.02)
          `,


        backdropFilter:
          "blur(18px)",


        overflow:"hidden",


        ...style

      }}

    >


      <div

        style={{

          position:"absolute",

          inset:0,

          pointerEvents:"none",

          background:
            "linear-gradient(120deg, transparent 20%, rgba(0,255,200,.05), transparent 70%)"

        }}

      />


      <div

        style={{

          position:"relative",

          zIndex:1

        }}

      >

        {children}

      </div>


    </div>

  );

}