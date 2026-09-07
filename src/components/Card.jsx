import styles from "./Card.module.css";

/**
 * Panel plano (recorte). Se distingue por color de relleno y un filo fino,
 * nunca por sombra de elevacion.
 * - `tint`   paper | yellow | lime | teal | coral
 * - `flat`   quita hasta el filo fino
 * - `ticket` borde superior dentado (recibo del turno)
 * - `badge`  pegatina de esquina (numero / simbolo corto)
 * - `tone`   color del badge: primary | secondary | yellow | forest | plain
 */
export default function Card({
  tint = null,
  flat = false,
  ticket = false,
  badge = null,
  tone = "primary",
  className = "",
  children,
  ...props
}) {
  const tintClass = tint
    ? styles["tint" + tint[0].toUpperCase() + tint.slice(1)]
    : null;
  return (
    <div
      className={[
        styles.card,
        tintClass,
        flat && styles.flat,
        ticket && styles.ticket,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {badge != null && (
        <span className={`${styles.badge} ${styles[tone]}`} aria-hidden="true">
          {badge}
        </span>
      )}
      {children}
    </div>
  );
}
