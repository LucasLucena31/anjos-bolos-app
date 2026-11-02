import React, { useEffect } from 'react';
import styles from '../styles/SuccessPopup.module.css';
import { FaCheckCircle } from 'react-icons/fa';

export function SuccessPopup({ show, message, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // Fecha após 1 segundo

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <FaCheckCircle className={styles.icon} />
        </div>
        <h2 className={styles.title}>Sucesso!</h2>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
