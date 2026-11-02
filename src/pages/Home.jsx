import styles from '../styles/Home.module.css';
import '../styles/fonts/fonts.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpModal } from '../components/HelpModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function Home(props) {
    useDocumentTitle(props.titulo);
    const navigate = useNavigate();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const handleHelpClick = () => {
        setIsHelpModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsHelpModalOpen(false);
    };
    return (
        <div className={styles.homeContainer}>
            <div className={styles.topButtons}>
                <button className={styles.topButton} onClick={() => navigate('/login')}>Login</button>
                <button className={styles.topButton} onClick={handleHelpClick}>Ajuda</button>
            </div>
            <div className={styles.centerContent}>
                <h1 className={styles.title}>Boas Vindas!</h1>
                <div className={styles.subtitle}>O bolo da anjos bolos é...</div>
                <div className={styles.subtitle}>Uma delícia!</div>
            </div>
            
            <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseModal} />
        </div>
    );
}
