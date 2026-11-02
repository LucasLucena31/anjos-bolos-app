import { useEffect, useState } from 'react';
import styles from '../styles/ModernToast.module.css';

let __toastZ = 20000; // module-scoped counter to ensure newest toast is on top

export function ModernToast({ isOpen, isVisible, message, type = 'success', onClose, duration = 4000 }) {
    // Accept either prop name for backward compatibility
    const parentShow = typeof isOpen !== 'undefined' ? isOpen : isVisible;
    const [visible, setVisible] = useState(false);
    const [zIndex, setZIndex] = useState(20000);

    useEffect(() => {
        if (parentShow) {
            // bump z-index for newest toast
            __toastZ += 1;
            setZIndex(__toastZ);
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                if (typeof onClose === 'function') onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [parentShow, onClose, duration]);

    if (!visible) return null;

    // inline style to pass CSS variable for progress animation duration and z-index
    const inlineStyle = {
        zIndex: zIndex,
        '--progress-duration': `${duration}ms`,
        '--enter-duration': '220ms'
    };

    return (
        <div className={`${styles.toast} ${styles[type]}`} style={inlineStyle}>
            <div className={styles.toastContent}>
                <div className={styles.iconContainer}>
                    <div className={styles.icon}>
                        {type === 'success' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        )}
                    </div>
                </div>
                <div className={styles.messageWrapper}>
                    <span className={styles.message}>{message}</span>
                </div>
                <div className={styles.progressBar}></div>
            </div>
        </div>
    );
}