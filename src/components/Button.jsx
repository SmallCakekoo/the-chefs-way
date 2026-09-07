import { forwardRef } from "react";
import { sfx } from "../lib/sfx.js";
import styles from "./Button.module.css";

/** Boton plano (recorte). variant: primary | secondary | ghost | quiet
 *  Suena al pulsar (respeta ajuste de sonido via sfx). */
const Button = forwardRef(function Button(
  { variant = "ghost", wide = false, type = "button", className = "", onClick, sound = "tap", ...props },
  ref
) {
  const handle = (e) => {
    if (sound && sfx[sound]) sfx[sound]();
    onClick?.(e);
  };
  return (
    <button
      ref={ref}
      type={type}
      onClick={handle}
      className={[styles.btn, styles[variant], wide && styles.wide, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
});

export default Button;
