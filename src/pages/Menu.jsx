import styles from '../styles/Menu.module.css';
import '../styles/fonts/fonts.css';
import {Navbar} from '../components/Navbar';
import caixa from '../assets/caixa-registradora.png';
import historico from '../assets/historico-de-pedidos.png';
import booking from '../assets/booking.png';
import ganhar from '../assets/ganhar-dinheiro.png';
import catalogo from '../assets/catalogo.png';
import addIcon from '../assets/add.png';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useState, useEffect } from 'react';
import api from '../provider/api';

export function Menu(props) {
    useDocumentTitle(props.titulo);
    const navigate = useNavigate();
    const [showNotification, setShowNotification] = useState(false);
    const [notificacoes, setNotificacoes] = useState({
        hoje: 0,
        totalEncomendas: 0,
        pendentesPagamento: 0
    });
    const [datasEncomendas, setDatasEncomendas] = useState({
        minDataRetirada: null,
        maxDataRetirada: null
    });


    useEffect(() => {
        async function fetchNotificacoes() {
            try {
                const pedidosResp = await api.get('/pedidos');
                const pedidos = Array.isArray(pedidosResp.data)
                    ? pedidosResp.data
                    : (pedidosResp.data && pedidosResp.data.content)
                        ? pedidosResp.data.content
                        : [];

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const hojeStr = hoje.toISOString().slice(0, 10);

                console.log('Total de pedidos:', pedidos.length);
                console.log('Data de hoje:', hojeStr);

                let hojeCount = 0;
                let totalEncomendasCount = 0;
                let pendentesPagamentoCount = 0;
                let minDataRetirada = null;
                let maxDataRetirada = null;

                pedidos.forEach(pedido => {
                    const dataRetirada = pedido.dataRetirada ? pedido.dataRetirada.slice(0, 10) : null;
                    const dataPedido = pedido.dataPedido ? pedido.dataPedido.slice(0, 10) : null;
                    const status = (pedido.status || '').toUpperCase();
                    
                    console.log('Pedido:', pedido.id, 'dataRetirada:', dataRetirada, 'dataPedido:', dataPedido, 'status:', status);
                    
                    // Verificar se é encomenda (dataRetirada > dataPedido)
                    const isEncomenda = dataRetirada && dataPedido && new Date(dataRetirada) > new Date(dataPedido);
                    
                    console.log('  É encomenda?', isEncomenda);
                    
                    // Contar APENAS ENCOMENDAS (não canceladas e não finalizadas)
                    if (isEncomenda && status !== 'CANCELADO' && status !== 'FINALIZADO') {
                        // Atualizar min/max datas de retirada
                        if (!minDataRetirada || dataRetirada < minDataRetirada) {
                            minDataRetirada = dataRetirada;
                        }
                        if (!maxDataRetirada || dataRetirada > maxDataRetirada) {
                            maxDataRetirada = dataRetirada;
                        }
                        
                        // Total de encomendas (apenas Confirmado e Pendente de Pagamento)
                        if (status === 'CONFIRMADO' || status === 'PENDENTE_PAGAMENTO' || status === 'PENDENTEPAGAMENTO' || status === 'PENDENTE DE PAGAMENTO' || (status.includes('PENDENTE') && status.includes('PAGAMENTO'))) {
                            totalEncomendasCount++;
                            console.log('  -> Encomenda ativa contabilizada (Confirmado ou Pendente Pagamento)');
                        }
                        
                        // Encomendas para hoje
                        if (dataRetirada === hojeStr) {
                            hojeCount++;
                            console.log('  -> Encomenda para hoje contabilizada');
                        }
                        
                        // Pagamento pendente (APENAS se for encomenda, não cancelado nem finalizado)
                        if (status === 'PENDENTE_PAGAMENTO' || status === 'PENDENTEPAGAMENTO' || status === 'PENDENTE DE PAGAMENTO' || (status.includes('PENDENTE') && status.includes('PAGAMENTO'))) {
                            pendentesPagamentoCount++;
                            console.log('  -> Pendente de pagamento contabilizada');
                        }
                    }
                });

                console.log('Resultado final:', { hojeCount, totalEncomendasCount, pendentesPagamentoCount });
                console.log('Período de encomendas:', { minDataRetirada, maxDataRetirada });

                setNotificacoes({
                    hoje: hojeCount,
                    totalEncomendas: totalEncomendasCount,
                    pendentesPagamento: pendentesPagamentoCount
                });
                
                setDatasEncomendas({
                    minDataRetirada: minDataRetirada || hojeStr,
                    maxDataRetirada: maxDataRetirada || hojeStr
                });
            } catch (err) {
                console.error('Erro ao buscar notificações:', err);
                setNotificacoes({ hoje: 0, totalEncomendas: 0, pendentesPagamento: 0 });
            }
        }
        fetchNotificacoes();
        const timer = setTimeout(() => {
            setShowNotification(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.MenuContainer}>
            <Navbar logado={true} />
            
            {/* Card de Notificações Fixo */}

            {/* Notificações dinâmicas - só exibe se houver notificações */}
            {(notificacoes.hoje > 0 || notificacoes.totalEncomendas > 0 || notificacoes.pendentesPagamento > 0) && (
                <div 
                    className={`${styles.notificationCard} ${showNotification ? styles.notificationShow : ''}`}
                >
                    <div className={styles.notificationHeader}>
                        <div className={styles.bellIconContainer}>
                            <svg className={styles.bellIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className={styles.notificationBadge}>
                                {notificacoes.hoje + notificacoes.totalEncomendas + notificacoes.pendentesPagamento}
                            </span>
                        </div>
                        <h3 className={styles.notificationTitle}>Notificações</h3>
                    </div>
                    <div className={styles.notificationBody}>
                        {notificacoes.hoje > 0 && (
                            <div 
                                className={styles.notificationItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const hoje = new Date();
                                    const dataHoje = hoje.toISOString().split('T')[0];
                                    // Navegar para encomendas de hoje, filtrando apenas Confirmado e Pendente de Pagamento
                                    navigate(`/encomendas?dataRetiradaInicio=${dataHoje}&dataRetiradaFim=${dataHoje}&status=CONFIRMADO,PENDENTE_PAGAMENTO`);
                                }}
                            >
                                <div className={styles.notificationDotRed}></div>
                                <div className={styles.notificationText}>
                                    {notificacoes.hoje === 1 ? (
                                        <>{notificacoes.hoje} Encomenda <strong>Pendente para Hoje</strong></>
                                    ) : (
                                        <>{notificacoes.hoje} Encomendas <strong>Pendentes para Hoje</strong></>
                                    )}
                                </div>
                            </div>
                        )}
                        {notificacoes.totalEncomendas > 0 && (
                            <div 
                                className={styles.notificationItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/encomendas?status=Confirmado,Pendente de Pagamento');
                                }}
                            >
                                <div className={styles.notificationDotOrange}></div>
                                <div className={styles.notificationText}>
                                    {notificacoes.totalEncomendas === 1 ? (
                                        <>{notificacoes.totalEncomendas} Encomenda <strong>Pendente no Total</strong></>
                                    ) : (
                                        <>{notificacoes.totalEncomendas} Encomendas <strong>Pendentes no Total</strong></>
                                    )}
                                </div>
                            </div>
                        )}
                        {notificacoes.pendentesPagamento > 0 && (
                            <div 
                                className={styles.notificationItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/encomendas?status=Pendente de Pagamento');
                                }}
                            >
                                <div className={styles.notificationDotOrange}></div>
                                <div className={styles.notificationText}>
                                    {notificacoes.pendentesPagamento === 1 ? (
                                        <>{notificacoes.pendentesPagamento} Encomenda <strong>Pendente de Pagamento</strong></>
                                    ) : (
                                        <>{notificacoes.pendentesPagamento} Encomendas <strong>Pendentes de Pagamento</strong></>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.centerContentMenu}>
                <h1 className={styles.title}>Gigante pela própria natureza!</h1>
                <div className={styles.cardGrid}>
                    <div className={styles.modernCard} onClick={() => navigate('/registro-vendas')}>
                        <img src={caixa} alt="Registrar Vendas" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Registrar Vendas</div>
                    </div>
                    <div className={styles.modernCard} onClick={() => navigate('/historico-vendas?status=FINALIZADO')}>
                        <img src={historico} alt="Histórico de Vendas" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Histórico de Vendas</div>
                    </div>
                    <div className={styles.modernCard} onClick={() => {
                        const hoje = new Date();
                        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
                        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
                        navigate(`/encomendas?dataPedidoInicio=${primeiroDia}&dataRetiradaFim=${ultimoDia}&status=Confirmado,Pendente de Pagamento`);
                    }}>
                        <img src={booking} alt="Encomendas" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Encomendas</div>
                    </div>
                    <div className={styles.modernCard} onClick={() => navigate('/dash-vendas')}>
                        <img src={ganhar} alt="Painel de Métricas" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Painel de Métricas</div>
                    </div>
                    <div className={styles.modernCard} onClick={() => navigate('/catalogo-produtos')}>
                        <img src={catalogo} alt="Catálogo" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Catálogo</div>
                    </div>
                    <div className={styles.modernCard} onClick={() => navigate('/cadastro')}>
                        <img src={addIcon} alt="Cadastro de Funcionário" className={styles.cardIcon} />
                        <div className={styles.cardLabel}>Cadastro de Funcionário</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
