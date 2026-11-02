import { supabase } from '../provider/supabase';
import Logo from "../assets/anjos-bolos.png"
import styles from "../styles/Navbar.module.css"
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HelpModal } from "./HelpModal";

export function Navbar(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [menuAberto, setMenuAberto] = useState(false);
    const irPara = (rota) => { setMenuAberto(false); navigate(rota); };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('usuario');
            if (raw) setUser(JSON.parse(raw));
            else setUser(null);
        } catch (err) {
            setUser(null);
        }
    }, []);

    const handleHelpClick = () => {
        setIsHelpModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsHelpModalOpen(false);
    };

    const handleLogout = async () => {
        try { await supabase?.auth.signOut(); } catch (e) { console.warn(e); }
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    }

    const handleLoginClick = () => {
        navigate('/login');
    }

    return(
        <>
            <nav>
                <div className={ styles.logo }>
                    <img src={ Logo } alt="Logotipo Anjos Bolos" />
                    {user ? (
                        <div className={ styles.userInfo }>
                            <svg className={ styles.userIcon } viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <h4>Olá, <span className={ styles.nomeCompleto }>{user.nome || user.name || user.email || 'Usuário'}</span><span className={ styles.primeiroNome }>{String(user.nome || user.name || user.email || 'Usuário').split(' ')[0]}</span></h4>
                        </div>
                    ) : props.logado && (
                        <div className={ styles.userInfo }>
                            <svg className={ styles.userIcon } viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <h4>Olá, Usuário</h4>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className={ styles.menuToggle }
                    aria-expanded={ menuAberto }
                    aria-label={ menuAberto ? 'Fechar menu' : 'Abrir menu' }
                    onClick={() => setMenuAberto(v => !v)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        {menuAberto
                            ? (<><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></>)
                            : (<><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></>)}
                    </svg>
                    Menu
                </button>

                <div className={ `${styles.links} ${menuAberto ? styles.aberto : ''}` }>
                    {!props.hideMenuButton && (
                        <button 
                            className={ `${styles.navlink} ${location.pathname === '/menu' ? styles.active : ''}` } 
                            onClick={() => irPara('/menu')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Menu
                        </button>
                    )}
                    {!props.hideMenuButton && (
                        <button 
                            className={ `${styles.navlink} ${location.pathname === '/registro-vendas' ? styles.active : ''}` } 
                            onClick={() => irPara('/registro-vendas')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            Registrar Vendas
                        </button>
                    )}
                    <button className={ styles.navlink } onClick={() => { setMenuAberto(false); handleHelpClick(); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Ajuda
                    </button>
                    {user ? (
                        <button className={ styles.navlink } onClick={handleLogout}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Sair
                        </button>
                    ) : location.pathname !== '/login' && location.pathname !== '/cadastro' && (
                        <button className={ styles.navlink } onClick={handleLoginClick}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            Entrar
                        </button>
                    )}
                </div>
            </nav>
            
            <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseModal} />
        </>
    )
}