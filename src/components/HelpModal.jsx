import React from 'react';
import { FaTimes, FaPhone, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import styles from '../styles/HelpModal.module.css';

export function HelpModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButtonTop} onClick={onClose}>
                    X
                </button>
                
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Precisa de ajuda?</h2>
                </div>
                
                <div className={styles.modalBody}>
                    <div className={styles.contactItem}>
                        <div className={styles.contactIcon}>
                            <FaPhone />
                        </div>
                        <div className={styles.contactInfo}>
                            <span className={styles.contactLabel}>Telefone / WhatsApp</span>
                            <span className={styles.contactValue}>(11) 9999-9999</span>
                            <span className={styles.contactNote}>Mesmo número para ligações e WhatsApp</span>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.contactIcon}>
                            <FaEnvelope />
                        </div>
                        <div className={styles.contactInfo}>
                            <span className={styles.contactLabel}>E-mail</span>
                            <span className={styles.contactValue}>suporte@anjosbolos.com.br</span>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <p className={styles.footerText}>
                        Estamos aqui para ajudar! Entre em contato conosco através de qualquer um dos canais acima.
                    </p>
                </div>
            </div>
        </div>
    );
}