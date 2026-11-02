import { useState, useRef, useEffect } from "react";
import { FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from '../styles/DashFinancas.module.css';
import '../styles/fonts/fonts.css';
import { Navbar } from '../components/Navbar';
import { DashSidebar } from '../components/DashSidebar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../provider/api';


import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar apenas os módulos necessários para o gráfico de linha nesta página
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


export function DashFinancas(props) {
    useDocumentTitle(props.titulo);
    
    // Função para obter o primeiro dia do mês atual no formato yyyy-MM-dd
    const getPrimeiroDiaDoMes = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        return `${ano}-${mes}-01`;
    };
    
    // Função para obter o último dia do mês atual no formato yyyy-MM-dd
    const getUltimoDiaDoMes = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth();
        // Criar data do próximo mês, dia 0 (que é o último dia do mês atual)
        const ultimoDia = new Date(ano, mes + 1, 0);
        const dia = String(ultimoDia.getDate()).padStart(2, '0');
        const mesFormatado = String(mes + 1).padStart(2, '0');
        return `${ano}-${mesFormatado}-${dia}`;
    };
    
    // Função para obter a data de hoje no formato yyyy-MM-dd
    const getDataHoje = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };
    
    // Estados para datas - inicializados com primeiro e último dia do mês atual
    const [startDate, setStartDate] = useState(getPrimeiroDiaDoMes());
    const [endDate, setEndDate] = useState(getUltimoDiaDoMes());
    const startInputRef = useRef(null);
    const endInputRef = useRef(null);
    
    // Estado para controlar quais opções do resumo financeiro estão selecionadas (array - múltiplas seleções)
    const [opcoesSelecionadas, setOpcoesSelecionadas] = useState(['entrada', 'saida', 'lucro']);
    
    // Estados para margem de lucro
    const [menorMargemLucro, setMenorMargemLucro] = useState(null);
    const [maiorMargemLucro, setMaiorMargemLucro] = useState(null);
    const [loadingMargem, setLoadingMargem] = useState(false);
    
    // Estados para resumo financeiro
    const [faturamento, setFaturamento] = useState(0);
    const [custos, setCustos] = useState(0);
    const [lucro, setLucro] = useState(0);
    const [loadingResumo, setLoadingResumo] = useState(false);
    
    // Estados para dados do gráfico
    const [dadosGraficoPorData, setDadosGraficoPorData] = useState({
        labels: [],
        entrada: [],
        saida: [],
        lucro: []
    });
    
    // Hook de navegação
    const navigate = useNavigate();
    
    // Função para formatar valor monetário com separador de milhares (1.000,00)
    const formatarMoeda = (valor) => {
        if (valor === null || valor === undefined) return 'R$ 0,00';
        const numStr = valor.toFixed(2);
        const [inteira, decimal] = numStr.split('.');
        const inteirAFormatada = parseInt(inteira).toLocaleString('pt-BR');
        return `R$ ${inteirAFormatada},${decimal}`;
    };
    
    // Função para buscar produto com menor margem de lucro
    const fetchMenorMargemLucro = async () => {
        try {
            setLoadingMargem(true);
            const response = await api.get('/dashboards/menor-margem-lucro');
            
            console.log('📉 Menor margem de lucro:', response.data);
            
            if (response.data) {
                setMenorMargemLucro({
                    nomeProduto: response.data.nomeProduto,
                    // margemLucro já vem em percentual (ex: 0.1 = 0.1%)
                    margemLucro: Number(response.data.margemLucro).toFixed(1)
                });
            }
        } catch (error) {
            console.error('❌ Erro ao buscar menor margem de lucro:', error);
            setMenorMargemLucro(null);
        } finally {
            setLoadingMargem(false);
        }
    };
    
    // Função para buscar produto com maior margem de lucro
    const fetchMaiorMargemLucro = async () => {
        try {
            setLoadingMargem(true);
            const response = await api.get('/dashboards/maior-margem-lucro');
            
            console.log('📈 Maior margem de lucro:', response.data);
            
            if (response.data) {
                setMaiorMargemLucro({
                    nomeProduto: response.data.nomeProduto,
                    // margemLucro já vem em percentual (ex: 0.1 = 0.1%)
                    margemLucro: Number(response.data.margemLucro).toFixed(1)
                });
            }
        } catch (error) {
            console.error('❌ Erro ao buscar maior margem de lucro:', error);
            setMaiorMargemLucro(null);
        } finally {
            setLoadingMargem(false);
        }
    };
    
    // Buscar dados ao carregar a página
    useEffect(() => {
        fetchMenorMargemLucro();
        fetchMaiorMargemLucro();
    }, []);
    
    // Função para buscar dados financeiros (faturamento, custos, lucro e gráfico)
    const fetchDadosFinanceiros = async () => {
        if (!startDate || !endDate) {
            return;
        }

        try {
            setLoadingResumo(true);
            const url = `/dashboards/pedidos-faturamento?inicio=${startDate}&fim=${endDate}`;
            const response = await api.get(url);
            
            console.log('💰 Dados financeiros recebidos:', response.data);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Calcular totais agregados
                const totais = response.data.reduce((acc, dia) => {
                    return {
                        faturamento: acc.faturamento + (dia.faturamento || 0),
                        custos: acc.custos + (dia.custos || 0)
                    };
                }, { faturamento: 0, custos: 0 });
                
                const lucroTotal = totais.faturamento - totais.custos;
                
                // Atualizar cards de resumo
                setFaturamento(totais.faturamento);
                setCustos(totais.custos);
                setLucro(lucroTotal);
                
                // Preparar dados do gráfico
                const labels = response.data.map(dia => {
                    // Converter dataPedido (yyyy-MM-dd) para formato "DD/MM"
                    const data = new Date(dia.dataPedido + 'T00:00:00');
                    const diaNum = String(data.getDate()).padStart(2, '0');
                    const mes = String(data.getMonth() + 1).padStart(2, '0');
                    return `${diaNum}/${mes}`;
                });
                
                const entrada = response.data.map(dia => dia.faturamento || 0);
                const saida = response.data.map(dia => dia.custos || 0);
                const lucroArray = response.data.map(dia => (dia.faturamento || 0) - (dia.custos || 0));
                
                setDadosGraficoPorData({
                    labels,
                    entrada,
                    saida,
                    lucro: lucroArray
                });
                
                console.log('📊 Gráfico atualizado:', { labels, entrada, saida, lucro: lucroArray });
            } else {
                // Sem dados
                setFaturamento(0);
                setCustos(0);
                setLucro(0);
                setDadosGraficoPorData({
                    labels: [],
                    entrada: [],
                    saida: [],
                    lucro: []
                });
            }
        } catch (error) {
            console.error('❌ Erro ao buscar dados financeiros:', error);
            setFaturamento(0);
            setCustos(0);
            setLucro(0);
        } finally {
            setLoadingResumo(false);
        }
    };
    
    // Buscar dados financeiros quando as datas mudarem
    useEffect(() => {
        if (startDate && endDate) {
            fetchDadosFinanceiros();
        }
    }, [startDate, endDate]);
    
    // Função para alternar seleção de uma opção
    const toggleOpcao = (opcao) => {
        setOpcoesSelecionadas(prev => {
            if (prev.includes(opcao)) {
                // Remove a opção se já estiver selecionada
                return prev.filter(o => o !== opcao);
            } else {
                // Adiciona a opção se não estiver selecionada
                return [...prev, opcao];
            }
        });
    };
    
    // Função para obter o título do gráfico baseado nas opções selecionadas
    const getTituloGrafico = () => {
        if (opcoesSelecionadas.length === 0) {
            return 'Selecione uma opção:';
        }
        if (opcoesSelecionadas.length === 3) {
            return 'Entrada, Saída e Lucro por Período:';
        }
        if (opcoesSelecionadas.length === 2) {
            const labels = opcoesSelecionadas.map(o => {
                if (o === 'entrada') return 'Entrada';
                if (o === 'saida') return 'Saída';
                if (o === 'lucro') return 'Lucro';
                return '';
            });
            return `${labels.join(' e ')} por Período:`;
        }
        // Apenas 1 selecionado
        const opcao = opcoesSelecionadas[0];
        if (opcao === 'entrada') return 'Entrada por Período:';
        if (opcao === 'saida') return 'Saída por Período:';
        if (opcao === 'lucro') return 'Lucro por Período:';
        return 'Entrada por Período:';
    };
    
    // Função para redirecionar para catálogo de produtos com filtro de nome
    const handleSearchClick = (nomeProduto) => {
        if (nomeProduto) {
            navigate(`/catalogo-produtos?nome=${encodeURIComponent(nomeProduto)}`);
        } else {
            navigate('/catalogo-produtos');
        }
    };

    // Configuração de cores para cada tipo de dado
    const coresGrafico = {
        entrada: {
            border: '#2e7d32',
            background: '#2e7d321a'
        },
        saida: {
            border: '#d32f2f',
            background: '#d32f2f1a'
        },
        lucro: {
            border: '#ed8936',
            background: '#ed89361a'
        }
    };
    
    // Labels para cada tipo
    const labelsGrafico = {
        entrada: 'Entrada',
        saida: 'Saída',
        lucro: 'Lucro'
    };
    
    // Construir datasets dinamicamente baseado nas opções selecionadas
    const construirDatasets = () => {
        return opcoesSelecionadas.map(opcao => ({
            label: labelsGrafico[opcao],
            data: dadosGraficoPorData[opcao] && dadosGraficoPorData[opcao].length > 0 
                ? dadosGraficoPorData[opcao] 
                : [0],
            borderColor: coresGrafico[opcao].border,
            backgroundColor: coresGrafico[opcao].background,
            borderWidth: 3,
            pointBackgroundColor: coresGrafico[opcao].border,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4,
        }));
    };
    
    const chartData = {
        labels: dadosGraficoPorData.labels.length > 0 ? dadosGraficoPorData.labels : ['Sem dados'],
        datasets: construirDatasets(),
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#6b3a13',
                    font: {
                        family: 'Montserrat, Arial, sans-serif',
                        size: 12,
                        weight: 600
                    }
                },
                onClick: (e, legendItem, legend) => {
                    // Mapear label da legenda para a opção correspondente
                    const labelParaOpcao = {
                        'Entrada': 'entrada',
                        'Saída': 'saida',
                        'Lucro': 'lucro'
                    };
                    
                    const opcao = labelParaOpcao[legendItem.text];
                    if (opcao) {
                        toggleOpcao(opcao);
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#2e7d32',
                bodyColor: '#2e7d32',
                borderColor: '#2e7d32',
                borderWidth: 1,
                titleFont: {
                    family: 'Montserrat, Arial, sans-serif'
                },
                bodyFont: {
                    family: 'Montserrat, Arial, sans-serif'
                },
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        return context.dataset.label + ': ' + value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        });
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#6b3a13',
                    font: {
                        family: 'Montserrat, Arial, sans-serif',
                        size: 11,
                        weight: 600
                    },
                    maxRotation: 0,
                    minRotation: 0
                },
                grid: {
                    display: true,
                    color: 'rgba(229, 229, 229, 0.5)'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#2e7d32',
                    font: {
                        family: 'Montserrat, Arial, sans-serif',
                        size: 11,
                        weight: 600
                    },
                    callback: function(value) {
                        return value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        });
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(229, 229, 229, 0.5)'
                }
            }
        }
    };

        return (
            <div className={styles.dashContainer}>
                <Navbar logado={true} activePage="financas" />
                <div className={styles.dashMain}>
                    <DashSidebar activeItem="financas" />
                    <main className={styles.dashContent}>
                        <section className={styles.dashPeriodo}>
                            <h2>Selecione um período:</h2>
                            <div className={styles.periodoInputs}>
                                {/* Data inicial */}
                                <div
                                    className={styles.periodoDate}
                                    onClick={() => startInputRef.current && startInputRef.current.showPicker && startInputRef.current.showPicker()}
                                    style={{ position: "relative", cursor: "pointer" }}
                                >
                                    <FaRegCalendarAlt className={styles.calendarIcon} />
                                    {/* Placeholder visível */}
                                    { !startDate && (
                                        <span className={styles.datePlaceholder}>dd/mm/aaaa</span>
                                    )}
                                    <input
                                        ref={startInputRef}
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        max={getDataHoje()}
                                        className={styles.invisibleDateInput}
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            width: "100%",
                                            height: "100%",
                                            opacity: 0,
                                            cursor: "pointer",
                                            zIndex: 2
                                        }}
                                    />
                                    {/* Data formatada se selecionada */}
                                    { startDate && (
                                        <span className={styles.dateValue}>{formatDateBR(startDate)}</span>
                                    )}
                                </div>
                                {/* Data final */}
                                <div
                                    className={styles.periodoDate}
                                    onClick={() => endInputRef.current && endInputRef.current.showPicker && endInputRef.current.showPicker()}
                                    style={{ position: "relative", cursor: "pointer" }}
                                >
                                    <FaRegCalendarAlt className={styles.calendarIcon} />
                                    { !endDate && (
                                        <span className={styles.datePlaceholder}>dd/mm/aaaa</span>
                                    )}
                                    <input
                                        ref={endInputRef}
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        max={getDataHoje()}
                                        className={styles.invisibleDateInput}
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            width: "100%",
                                            height: "100%",
                                            opacity: 0,
                                            cursor: "pointer",
                                            zIndex: 2
                                        }}
                                    />
                                    { endDate && (
                                        <span className={styles.dateValue}>{formatDateBR(endDate)}</span>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className={styles.dashCards}>
                            <div className={styles.dashCard}>
                                <div className={styles.dashCardTitle + ' ' + styles.dashCardTitleLucro}>Margem de Lucro sobre Produto</div>
                                <div className={styles.dashCardContent + ' ' + styles.lucroCardContainer}>
                                    <div className={styles.lucroSection}>
                                        <span className={styles.lucroLabel}>Mínima:</span>
                                        <div className={styles.lucroValueWrapper}>
                                            <span 
                                                className={styles.lucroValueMin}
                                                style={{
                                                    color: menorMargemLucro && menorMargemLucro.margemLucro < 30 ? '#d32f2f' : '#2e7d32'
                                                }}
                                            >
                                                {loadingMargem ? '...' : menorMargemLucro ? `${menorMargemLucro.margemLucro}%` : 'N/A'} 
                                                <FaSearch 
                                                    style={{ fontSize: 20, marginLeft: 6, color: '#4d2c0c', cursor: 'pointer' }} 
                                                    onClick={() => handleSearchClick(menorMargemLucro?.nomeProduto)}
                                                />
                                            </span>
                                        </div>
                                        <span className={styles.produtoNome}>
                                            {loadingMargem ? 'Carregando...' : menorMargemLucro?.nomeProduto || 'Sem dados'}
                                        </span>
                                    </div>
                                    <div className={styles.lucroSection}>
                                        <span className={styles.lucroLabel}>Máxima:</span>
                                        <div className={styles.lucroValueWrapper}>
                                            <span 
                                                className={styles.lucroValueMax}
                                                style={{
                                                    color: maiorMargemLucro && maiorMargemLucro.margemLucro < 30 ? '#d32f2f' : '#2e7d32'
                                                }}
                                            >
                                                {loadingMargem ? '...' : maiorMargemLucro ? `${maiorMargemLucro.margemLucro}%` : 'N/A'} 
                                                <FaSearch 
                                                    style={{ fontSize: 20, marginLeft: 6, color: '#4d2c0c', cursor: 'pointer' }} 
                                                    onClick={() => handleSearchClick(maiorMargemLucro?.nomeProduto)}
                                                />
                                            </span>
                                        </div>
                                        <span className={styles.produtoNome}>
                                            {loadingMargem ? 'Carregando...' : maiorMargemLucro?.nomeProduto || 'Sem dados'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.dashCard}>
                                <div className={styles.dashCardTitle + ' ' + styles.dashCardTitleResumo}>
                                    Resumo Financeiro
                                    <span className={styles.dashCardSubtitle}>Clique para exibir/ocultar no gráfico</span>
                                </div>
                                <div className={styles.dashCardContent + ' ' + styles.resumoCardContainer}>
                                    <div 
                                        className={`${styles.resumoItem} ${styles.resumoEntrada} ${opcoesSelecionadas.includes('entrada') ? styles.selected : styles.unselected}`}
                                        onClick={() => toggleOpcao('entrada')}
                                        title="Clique para exibir/ocultar no gráfico"
                                    >
                                        <span className={styles.resumoItemLabel}>Entrada:</span>
                                        <span className={styles.resumoItemValue}>
                                            {loadingResumo ? 'Carregando...' : formatarMoeda(faturamento)}
                                        </span>
                                    </div>
                                    <div 
                                        className={`${styles.resumoItem} ${styles.resumoSaida} ${opcoesSelecionadas.includes('saida') ? styles.selected : styles.unselected}`}
                                        onClick={() => toggleOpcao('saida')}
                                        title="Clique para exibir/ocultar no gráfico"
                                    >
                                        <span className={styles.resumoItemLabel}>Saída:</span>
                                        <span className={styles.resumoItemValue}>
                                            {loadingResumo ? 'Carregando...' : formatarMoeda(custos)}
                                        </span>
                                    </div>
                                    <div 
                                        className={`${styles.resumoItem} ${styles.resumoLucro} ${opcoesSelecionadas.includes('lucro') ? styles.selected : styles.unselected}`}
                                        onClick={() => toggleOpcao('lucro')}
                                        title="Clique para exibir/ocultar no gráfico"
                                    >
                                        <span className={styles.resumoItemLabel}>Lucro Aproximado:</span>
                                        <span 
                                            className={styles.resumoItemValue}
                                            style={{
                                                color: (lucro !== null && lucro !== undefined && lucro < 0) ? '#d32f2f' : 'inherit'
                                            }}
                                        >
                                            {loadingResumo ? 'Carregando...' : formatarMoeda(lucro)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className={styles.dashGrafico}>
                            <h2>{getTituloGrafico()}</h2>
                            <div className={styles.graficoPlaceholder}>
                                <Line 
                                    data={chartData}
                                    options={chartOptions}
                                />
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        );

        // Função para formatar data yyyy-mm-dd para dd/mm/aaaa
        function formatDateBR(dateStr) {
            if (!dateStr) return "";
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}/${y}`;
        }
}
