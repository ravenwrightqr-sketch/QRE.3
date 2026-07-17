import React from "react";

export default function NeonButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {

  return (

    <button

      {...props}

      className="cyber-button"

    />

  );

}