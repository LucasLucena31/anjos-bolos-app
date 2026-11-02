import { useState } from "react";
import styles from "../styles/TextBox.module.css";

export function TextBox(props) {
  const [isFocused, setIsFocused] = useState(false);

  const isActive = isFocused || props.value !== "";

  return (
    <div className={styles["input-container"]}>
      <input
        name={props.name}
        type={props.type}
        value={props.value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={props.onChange}
        className={styles.input}
      />
      <label className={`${styles.label} ${isActive ? styles.active : ""}`}>
        {props.label}
      </label>
    </div>
  );
}