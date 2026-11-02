import { useState, useRef, useEffect } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import styles from '../styles/DashVendas.module.css';
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
	BarElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registrar módulos para gráficos de linha e barras
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend
);


export function DashVendas(props) {
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

	// Estados para dados do dashboard (seguindo o padrão do CatalogoProdutos)
	const [produtoMaisVendido, setProdutoMaisVendido] = useState("Selecione um período");
	const [diaSemanaComMaisVendas, setDiaSemanaComMaisVendas] = useState("Selecione um período");
	const [totalVendas, setTotalVendas] = useState("Selecione um período");
	const [faturamentoTotal, setFaturamentoTotal] = useState("Selecione um período");
	const [loading, setLoading] = useState(false);
	
	// Estados para os gráficos
	const [chartLabels, setChartLabels] = useState([]);
	const [chartDataValues, setChartDataValues] = useState([]);
	const [graficoAtivo, setGraficoAtivo] = useState('periodo'); // 'periodo' ou 'semana'
	
	// Estados para gráfico de vendas por dia da semana
	const [vendasPorDiaSemana, setVendasPorDiaSemana] = useState([]);

	// Função para buscar produtos mais vendidos (seguindo o padrão do CatalogoProdutos)
	const fetchProdutosMaisVendidos = async () => {
		if (!startDate || !endDate) {
			setProdutoMaisVendido("Selecione um período");
			return;
		}

		setLoading(true);
		try {
			// Caminho completo: /dashboards/produtos-mais-vendidos
			let url = `/dashboards/produtos-mais-vendidos?inicio=${startDate}&fim=${endDate}`;
			
			console.log('🔍 Buscando produtos mais vendidos em:', url);
			
			const response = await api.get(url);
			
			console.log('✅ Produtos mais vendidos carregados:', response.data);
			
			// Verificar se é um array ou objeto com propriedade content
			let dadosRecebidos;
			if (Array.isArray(response.data)) {
				dadosRecebidos = response.data;
			} else if (response.data.content && Array.isArray(response.data.content)) {
				dadosRecebidos = response.data.content;
			} else {
				dadosRecebidos = [];
			}
			
			if (dadosRecebidos && dadosRecebidos.length > 0) {
				// Pega o primeiro produto (mais vendido)
				const produto = dadosRecebidos[0];
				console.log('📦 Primeiro produto:', produto);
				const nomeProduto = produto.nomeProduto || produto.nome || 'Produto sem nome';
				setProdutoMaisVendido(nomeProduto);
			} else {
				setProdutoMaisVendido("Nenhum produto encontrado");
			}
		} catch (error) {
			console.error("❌ Erro ao buscar produtos mais vendidos:", error);
			console.error("📍 URL que falhou:", error.config?.url);
			console.error("📍 Status:", error.response?.status);
			console.error("📍 Resposta do servidor:", error.response?.data);
			
			// Se for 404, mostrar mensagem mais clara
			if (error.response?.status === 404) {
				setProdutoMaisVendido("Endpoint não encontrado - verifique o backend");
			} else {
				setProdutoMaisVendido("Erro ao carregar dados");
			}
		} finally {
			setLoading(false);
		}
	};

	// Função para buscar dia da semana com mais vendas
	const fetchDiaSemanaComMaisVendas = async () => {
		if (!startDate || !endDate) {
			setDiaSemanaComMaisVendas("Selecione um período");
			return;
		}

		try {
			let url = `/dashboards/dia-semana-mais-vendas?inicio=${startDate}&fim=${endDate}`;
			
			console.log('🔍 Buscando dia da semana com mais vendas em:', url);
			
			const response = await api.get(url);
			
			console.log('✅ Dia da semana carregado:', response.data);
			
			// O backend retorna apenas uma string com o dia
			if (response.data && typeof response.data === 'string') {
				// Traduzir para português se vier em inglês
				const diaEmPortugues = traduzirDiaSemana(response.data);
				setDiaSemanaComMaisVendas(diaEmPortugues);
			} else {
				setDiaSemanaComMaisVendas("Nenhum dia encontrado");
			}
		} catch (error) {
			console.error("❌ Erro ao buscar dia da semana:", error);
			console.error("📍 URL que falhou:", error.config?.url);
			console.error("📍 Status:", error.response?.status);
			
			if (error.response?.status === 404) {
				setDiaSemanaComMaisVendas("Endpoint não encontrado");
			} else {
				setDiaSemanaComMaisVendas("Erro ao carregar dados");
			}
		}
	};

	// Função auxiliar para traduzir dias da semana
	const traduzirDiaSemana = (dia) => {
		const traducoes = {
			'MONDAY': 'Segunda-feira',
			'TUESDAY': 'Terça-feira',
			'WEDNESDAY': 'Quarta-feira',
			'THURSDAY': 'Quinta-feira',
			'FRIDAY': 'Sexta-feira',
			'SATURDAY': 'Sábado',
			'SUNDAY': 'Domingo',
			// Também aceita versões em minúsculas
			'monday': 'Segunda-feira',
			'tuesday': 'Terça-feira',
			'wednesday': 'Quarta-feira',
			'thursday': 'Quinta-feira',
			'friday': 'Sexta-feira',
			'saturday': 'Sábado',
			'sunday': 'Domingo',
			// Se já vier em português, retorna como está
			'segunda-feira': 'Segunda-feira',
			'terça-feira': 'Terça-feira',
			'quarta-feira': 'Quarta-feira',
			'quinta-feira': 'Quinta-feira',
			'sexta-feira': 'Sexta-feira',
			'sábado': 'Sábado',
			'domingo': 'Domingo'
		};
		
		const diaLower = dia.toLowerCase().trim();
		return traducoes[dia] || traducoes[diaLower] || dia;
	};

	// Função para buscar faturamento e total de vendas usando o novo endpoint
	const fetchFaturamento = async () => {
		if (!startDate || !endDate) {
			setTotalVendas("Selecione um período");
			setFaturamentoTotal("Selecione um período");
			return;
		}

		try {
			let url = `/dashboards/pedidos-faturamento?inicio=${startDate}&fim=${endDate}`;
			
			console.log('🔍 Buscando faturamento em:', url);
			
			const response = await api.get(url);
			
			console.log('✅ Faturamento carregado:', response.data);
			
			// O backend retorna um array de objetos com dados por dia
			if (response.data && Array.isArray(response.data)) {
				// Somar os totais de todos os dias
				const totais = response.data.reduce((acc, dia) => {
					return {
						quantidadePedidos: acc.quantidadePedidos + (dia.quantidadePedidos || 0),
						faturamento: acc.faturamento + (dia.faturamento || 0)
					};
				}, { quantidadePedidos: 0, faturamento: 0 });
				
				// Total de vendas (quantidadePedidos)
				const quantidade = totais.quantidadePedidos;
				setTotalVendas(`${quantidade} ${quantidade === 1 ? 'venda' : 'vendas'}`);
				
				// Faturamento Total
				setFaturamentoTotal(
					new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL'
					}).format(totais.faturamento)
				);
			} else {
				setTotalVendas("0 vendas");
				setFaturamentoTotal("R$ 0,00");
			}
		} catch (error) {
			console.error("❌ Erro ao buscar faturamento:", error);
			console.error("📍 URL que falhou:", error.config?.url);
			console.error("📍 Status:", error.response?.status);
			
			if (error.response?.status === 404) {
				setTotalVendas("Endpoint não encontrado");
				setFaturamentoTotal("Endpoint não encontrado");
			} else {
				setTotalVendas("Erro ao carregar");
				setFaturamentoTotal("Erro ao carregar");
			}
		}
	};

	// Função para buscar vendas distribuídas por dia da semana
	const fetchVendasPorDiaSemana = async () => {
		if (!startDate || !endDate) {
			setVendasPorDiaSemana([]);
			return;
		}

		try {
			const token = localStorage.getItem('token');
			const url = `/dashboards/vendas-dia-semana?inicio=${startDate}&fim=${endDate}`;
			console.log('🔍 Buscando vendas por dia da semana em:', url);
			
			const response = await api.get(url, {
				headers: { Authorization: `Bearer ${token}` }
			});
			console.log('✅ Vendas por dia da semana carregadas:', response.data);
			
			// Espera-se um array com objetos {diaSemana: string, totalVendas: number}
			if (response.data && Array.isArray(response.data)) {
				console.log('📊 Dados recebidos para o gráfico:', response.data);
				setVendasPorDiaSemana(response.data);
			} else {
				setVendasPorDiaSemana([]);
			}
		} catch (error) {
			console.error("❌ Erro ao buscar vendas por dia da semana:", error);
			console.error("📍 URL que falhou:", error.config?.url);
			console.error("📍 Status:", error.response?.status);
			console.error("📍 Resposta do servidor:", error.response?.data);
			setVendasPorDiaSemana([]);
		}
	};

	// Função para buscar dados do gráfico (vendas por dia) usando o novo endpoint
	const fetchDadosGrafico = async () => {
		if (!startDate || !endDate) {
			setChartLabels([]);
			setChartDataValues([]);
			return;
		}

		try {
			const url = `/dashboards/pedidos-faturamento?inicio=${startDate}&fim=${endDate}`;
			const response = await api.get(url);
			
			console.log('📊 Response do backend:', response.data);
			
			// O backend retorna um array com dados por dia
			if (response.data && Array.isArray(response.data) && response.data.length > 0) {
				// Mapear os dados do array para labels (eixo X) e valores (eixo Y)
				// Eixo X: dataPedido formatado como "DD MMM"
				const labels = response.data.map(dia => {
					// Converter dataPedido (yyyy-MM-dd) para formato "DD MMM"
					const data = new Date(dia.dataPedido + 'T00:00:00');
					const diaNum = String(data.getDate()).padStart(2, '0');
					const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
					const mes = meses[data.getMonth()];
					return `${diaNum} ${mes}`;
				});
				
				// Eixo Y: quantidadePedidos
				const valores = response.data.map(dia => dia.quantidadePedidos || 0);
				
				setChartLabels(labels);
				setChartDataValues(valores);
				
				console.log('📊 Gráfico montado - Eixo X (datas):', labels);
				console.log('📊 Gráfico montado - Eixo Y (pedidos):', valores);
			} else {
				// Se não houver dados, criar array vazio
				console.log('⚠️ Nenhum dado retornado do backend');
				setChartLabels([]);
				setChartDataValues([]);
			}

		} catch (error) {
			console.error("❌ Erro ao buscar dados do gráfico:", error);
			setChartLabels([]);
			setChartDataValues([]);
		}
	};

	// Buscar dados quando as datas mudarem (seguindo o padrão do CatalogoProdutos)
	useEffect(() => {
		if (startDate && endDate) {
			fetchProdutosMaisVendidos();
			fetchDiaSemanaComMaisVendas();
			fetchFaturamento();
			fetchDadosGrafico();
			fetchVendasPorDiaSemana();
		}
	}, [startDate, endDate]);

	// Dados e configuração do gráfico Chart.js
	const chartData = {
		labels: chartLabels.length > 0 ? chartLabels : ['Selecione um período'],
		datasets: [
			{
				label: 'Quantidade de Vendas',
				data: chartDataValues.length > 0 ? chartDataValues : [0],
				borderColor: '#a86b32',
				backgroundColor: 'rgba(168, 107, 50, 0.1)',
				borderWidth: 3,
				pointBackgroundColor: '#a86b32',
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointRadius: 5,
				pointHoverRadius: 7,
				tension: 0.4,
			},
		],
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
				}
			},
			tooltip: {
				backgroundColor: 'rgba(255, 255, 255, 0.9)',
				titleColor: '#6b3a13',
				bodyColor: '#6b3a13',
				borderColor: '#a86b32',
				borderWidth: 1,
				titleFont: {
					family: 'Montserrat, Arial, sans-serif'
				},
				bodyFont: {
					family: 'Montserrat, Arial, sans-serif'
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
					}
				},
				grid: {
					display: true,
					color: 'rgba(229, 229, 229, 0.5)'
				}
			},
			y: {
				beginAtZero: true,
				ticks: {
					color: '#6b3a13',
					font: {
						family: 'Montserrat, Arial, sans-serif',
						size: 11,
						weight: 600
					},
					stepSize: 1,
					callback: function(value) {
						if (Number.isInteger(value)) {
							return value;
						}
					}
				},
				grid: {
					display: true,
					color: 'rgba(229, 229, 229, 0.5)'
				}
			}
		}
	};

	// Dados para o gráfico de barras (vendas por dia da semana)
	const diasSemanaOrdenados = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
	
	const chartDataSemana = {
		labels: diasSemanaOrdenados,
		datasets: [
			{
				label: 'Vendas por Dia da Semana',
				data: diasSemanaOrdenados.map(dia => {
					const vendaDia = vendasPorDiaSemana.find(v => v.diaSemana === dia);
					console.log(`🔍 Buscando vendas para ${dia}:`, vendaDia);
					return vendaDia?.totalVendas || 0;
				}),
				backgroundColor: [
					'rgba(168, 107, 50, 0.8)',
					'rgba(138, 90, 43, 0.8)',
					'rgba(168, 107, 50, 0.8)',
					'rgba(138, 90, 43, 0.8)',
					'rgba(168, 107, 50, 0.8)',
					'rgba(138, 90, 43, 0.8)',
					'rgba(168, 107, 50, 0.8)',
				],
				borderColor: '#4d2c0c',
				borderWidth: 2,
			},
		],
	};

	const chartOptionsSemana = {
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
				}
			},
			tooltip: {
				backgroundColor: 'rgba(255, 255, 255, 0.9)',
				titleColor: '#6b3a13',
				bodyColor: '#6b3a13',
				borderColor: '#a86b32',
				borderWidth: 1,
				titleFont: {
					family: 'Montserrat, Arial, sans-serif'
				},
				bodyFont: {
					family: 'Montserrat, Arial, sans-serif'
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
					}
				},
				grid: {
					display: false
				}
			},
			y: {
				beginAtZero: true,
				ticks: {
					color: '#6b3a13',
					font: {
						family: 'Montserrat, Arial, sans-serif',
						size: 11,
						weight: 600
					},
					stepSize: 1,
					callback: function(value) {
						if (Number.isInteger(value)) {
							return value;
						}
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
				   <Navbar logado={true} activePage="vendas" />
				<div className={styles.dashMain}>
					<DashSidebar activeItem="vendas" />
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
						
						{/* Layout principal: Gráficos à esquerda, Cards à direita */}
						<div className={styles.dashMainLayout}>
							{/* Seção de gráficos (esquerda) */}
							<section className={styles.graficosSection}>
								{/* Botões de seleção de gráfico */}
								<div className={styles.graficoSelector}>
									<button 
										className={`${styles.graficoBtn} ${graficoAtivo === 'periodo' ? styles.graficoBtnActive : ''}`}
										onClick={() => setGraficoAtivo('periodo')}
									>
										Vendas por Período
									</button>
									<button 
										className={`${styles.graficoBtn} ${graficoAtivo === 'semana' ? styles.graficoBtnActive : ''}`}
										onClick={() => setGraficoAtivo('semana')}
									>
										Vendas por Dia da Semana
									</button>
								</div>
								
								{/* Gráfico ativo */}
								<div className={styles.graficoPlaceholder}>
									{graficoAtivo === 'periodo' ? (
										<Line 
											data={chartData}
											options={chartOptions}
										/>
									) : (
										<Bar 
											data={chartDataSemana}
											options={chartOptionsSemana}
										/>
									)}
								</div>
							</section>
							
							{/* Seção de cards (direita) */}
							<section className={styles.cardsSection}>
								<div className={styles.dashCard}>
									<div className={styles.dashCardTitle + ' ' + styles.dashCardTitleTotal}>Produto mais vendido</div>
									<div className={styles.dashCardContent}>
										{loading ? "Carregando..." : produtoMaisVendido}
									</div>
								</div>
								<div className={styles.dashCard}>
									<div className={styles.dashCardTitle + ' ' + styles.dashCardTitleVendido}>Faturamento Total</div>
									<div className={styles.dashCardContent}>
										{loading ? "Carregando..." : faturamentoTotal}
									</div>
								</div>
								<div className={styles.dashCard}>
									<div className={styles.dashCardTitle + ' ' + styles.dashCardTitleVendido}>Total de Vendas</div>
									<div className={styles.dashCardContent}>
										{loading ? "Carregando..." : totalVendas}
									</div>
								</div>
							</section>
						</div>
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
