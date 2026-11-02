import { useState, useRef, useEffect } from "react";
import { FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from '../styles/DashProdutos.module.css';
import '../styles/fonts/fonts.css';
import { Navbar } from '../components/Navbar';
import { DashSidebar } from '../components/DashSidebar';
import { FaFilter } from "react-icons/fa";
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../provider/api';

export function DashProdutos(props) {
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
	
	// Hook de navegação
	const navigate = useNavigate();
	
	// Função para redirecionar para histórico de vendas com as datas e status FINALIZADO
	const handleSearchClick = () => {
		// Montar query params com as datas atuais e status FINALIZADO
		const params = new URLSearchParams();
		
		if (startDate) params.append('dataInicio', startDate);
		if (endDate) params.append('dataFim', endDate);
		params.append('status', 'FINALIZADO'); // Sempre filtrar por status FINALIZADO
		
		// Navegar para histórico com os parâmetros
		navigate(`/historico-vendas?${params.toString()}`);
	};

	// Estados para filtros
	const [showRecomendFilter, setShowRecomendFilter] = useState(false);
	const [showCategoriasFilter, setShowCategoriasFilter] = useState(false);
	const [selectedRecomendFilters, setSelectedRecomendFilters] = useState([
		"Bolos Tradicionais"
	]);
	const [selectedCategoriaType, setSelectedCategoriaType] = useState("Categorias de Produtos");
	
	// Estado para dados da tabela TOP 5 do backend
	const [top5Produtos, setTop5Produtos] = useState([]);
	const [loading, setLoading] = useState(false);
	
	// Estados para recomendações de feriados
	const [recomendacoes, setRecomendacoes] = useState([]);
	const [loadingRecomendacoes, setLoadingRecomendacoes] = useState(false);

	// Opções de filtro para recomendações (múltipla seleção)
	const recomendOptions = [
		"Bolos Tradicionais",
		"Bebidas", 
		"Salgados",
		"Bolos de Pote",
		"Bolos de Festa"
	];

	// Opções para a tabela TOP 5 (seleção única)
	const categoriaTypeOptions = [
		"Categorias de Produtos",
		"Bolos Tradicionais",
		"Bebidas", 
		"Salgados",
		"Bolos de Pote",
		"Bolos de Festa"
	];

	// Funções para gerenciar filtros de recomendação
	const handleRecomendFilterChange = (option) => {
		setSelectedRecomendFilters(prev => {
			if (prev.includes(option)) {
				return prev.filter(item => item !== option);
			} else {
				return [...prev, option];
			}
		});
		// Filtro aplicado imediatamente - aqui você pode implementar a lógica de filtro
	};

	// Função para gerenciar filtro de categoria (seleção única)
	const handleCategoriaTypeChange = (type) => {
		setSelectedCategoriaType(type);
		setShowCategoriasFilter(false);
	};

	// Função para buscar recomendações de produtos por feriado
	const fetchRecomendacoesFeriados = async () => {
		try {
			setLoadingRecomendacoes(true);
			console.log('🎉 Buscando produtos recomendados para feriados...');
			
			const resp = await api.get('/dashboards/produtos-recomendados-feriados');
			
			console.log('✅ Resposta do endpoint:', resp.data);
			
			const lista = Array.isArray(resp.data) ? resp.data : [];
			
			// Mapear para o formato usado pela tabela
			const mapped = lista.map(item => ({
				data: item.dataFeriado || '',
				feriado: item.feriado || '',
				categoria: item.categoria || '',
				produto: item.produto || ''
			}));
			
			console.log('📊 Recomendações mapeadas:', mapped);
			setRecomendacoes(mapped);
		} catch (error) {
			console.error("❌ Erro ao buscar recomendações de feriados:", error);
			setRecomendacoes([]);
		} finally {
			setLoadingRecomendacoes(false);
		}
	};
	
	// Função para buscar TOP 5 produtos do backend
	const fetchTop5Produtos = async () => {
		if (!startDate || !endDate) {
			setTop5Produtos([]);
			return;
		}

		try {
			setLoading(true);
			let url = `/dashboards/produtos-mais-vendidos?inicio=${startDate}&fim=${endDate}`;
			
			console.log('🏆 Buscando TOP 5 produtos em:', url);
			console.log('📅 Data início selecionada:', startDate);
			console.log('📅 Data fim selecionada:', endDate);
			
			const response = await api.get(url);
			
			console.log('✅ TOP 5 produtos carregados:', response.data);
			console.log('📊 Quantidade de produtos retornados:', response.data.length);
			
			if (Array.isArray(response.data)) {
				setTop5Produtos(response.data);
			} else {
				setTop5Produtos([]);
			}
		} catch (error) {
			console.error("❌ Erro ao buscar TOP 5 produtos:", error);
			setTop5Produtos([]);
		} finally {
			setLoading(false);
		}
	};

	// Buscar recomendações ao carregar a página
	useEffect(() => {
		fetchRecomendacoesFeriados();
	}, []);
	
	// Buscar dados quando as datas ou filtro de categoria mudarem
	useEffect(() => {
		if (startDate && endDate) {
			fetchTop5Produtos();
		}
	}, [startDate, endDate]);

	// Filtrar produtos por categoria localmente
	const getFiltredProdutos = () => {
		console.log('🔍 Filtrando produtos...');
		console.log('📦 Total de produtos recebidos do backend:', top5Produtos.length);
		console.log('🏷️ Categoria selecionada:', selectedCategoriaType);
		
		if (selectedCategoriaType === "Categorias de Produtos") {
			console.log('✅ Agrupando por CATEGORIAS');
			
			// Agrupar produtos por categoria e somar quantidades
			const categorias = {};
			
			top5Produtos.forEach(produto => {
				const categoria = produto.categoriaProduto;
				if (categorias[categoria]) {
					categorias[categoria] += produto.quantidadeVendida;
				} else {
					categorias[categoria] = produto.quantidadeVendida;
				}
			});
			
			// Converter objeto em array e ordenar por quantidade (decrescente)
			const categoriasArray = Object.keys(categorias).map(categoria => ({
				nomeProduto: categoria, // Aqui o "produto" é a categoria
				quantidadeVendida: categorias[categoria],
				categoriaProduto: categoria
			}));
			
			// Ordenar por quantidade vendida (maior para menor)
			categoriasArray.sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);
			
			// Pegar TOP 5 categorias
			const top5Categorias = categoriasArray.slice(0, 5);
			
			console.log('📊 Categorias agrupadas:', top5Categorias);
			
			return top5Categorias;
		}
		
		// Mapear nomes de categoria do frontend para o backend
		const categoriaMap = {
			"Bolos Tradicionais": "Bolo Tradicional",
			"Bebidas": "Bebida",
			"Salgados": "Salgados",
			"Bolos de Pote": "Bolo de Pote",
			"Bolos de Festa": "Bolo de Festa"
		};
		
		const categoriaBackend = categoriaMap[selectedCategoriaType] || selectedCategoriaType;
		console.log('🔄 Categoria mapeada para backend:', categoriaBackend);
		
		const filtrados = top5Produtos.filter(produto => 
			produto.categoriaProduto === categoriaBackend
		);
		
		console.log('✅ Produtos após filtro:', filtrados.length);
		console.log('📋 Produtos filtrados:', filtrados);
		
		return filtrados;
	};

	const produtosFiltrados = getFiltredProdutos();

	// Função para gerar título dinâmico
	const getTableTitle = () => {
		if (selectedCategoriaType === "Categorias de Produtos") {
			return "TOP 5 Categorias de produtos mais vendidos:";
		} else if (selectedCategoriaType === "Bebidas") {
			return `TOP 5 ${selectedCategoriaType} mais vendidas:`;
		} else {
			return `TOP 5 ${selectedCategoriaType} mais vendidos:`;
		}
	};

	// Fechar filtros ao clicar fora
	useEffect(() => {
		const handleClickOutside = (event) => {
			// Se clicou fora dos filtros, fechar
			if (!event.target.closest(`.${styles.filterDropdown}`) && 
				!event.target.closest('th')) {
				setShowRecomendFilter(false);
				setShowCategoriasFilter(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Filtrar recomendações por categorias selecionadas
	const recomendacoesFiltradas = recomendacoes.filter(rec => 
		selectedRecomendFilters.includes(rec.categoria)
	);
	
	// Função para formatar data no formato brasileiro
	const formatDateBRFromISO = (dateString) => {
		if (!dateString) return '';
		const [ano, mes, dia] = dateString.split('-');
		return `${dia}/${mes}/${ano}`;
	};

	return (
		<div className={styles.dashContainer}>
			<Navbar logado={true} activePage="produtos" />
			<div className={styles.dashMain}>
				<DashSidebar activeItem="produto" />
				<main className={styles.dashContent}>
					{/* Tabela de recomendações */}
					<section style={{ width: "100%", maxWidth: 900, margin: "0 auto 8px auto", position: "relative" }}>
						<h3 className={styles.sectionTitle}>Recomendação para produção e venda:</h3>
						
						{/* Filtro de Recomendações - fora da tabela */}
						{showRecomendFilter && (
							<div className={`${styles.filterDropdown} ${styles.filterDropdownRecomend}`}>
								<div className={`${styles.filterTitle} ${styles.filterTitleRecomend}`}>
									Filtrar por Categoria
								</div>
								<div className={styles.filterOptionsContainer}>
									{recomendOptions.map((option, i) => (
										<div key={i} className={styles.filterOption}>
											<input
												type="checkbox"
												id={`recomend-${i}`}
												checked={selectedRecomendFilters.includes(option)}
												onChange={() => handleRecomendFilterChange(option)}
											/>
											<label htmlFor={`recomend-${i}`}>{option}</label>
										</div>
									))}
								</div>
							</div>
						)}

						<div className={styles.recomendTableWrapper}>
							<table className={styles.recomendTable}>
								<thead>
									<tr>
										<th>Data</th>
										<th>Feriado</th>
										<th 
											style={{ cursor: "pointer" }}
											onClick={() => setShowRecomendFilter(!showRecomendFilter)}
										>
											Categoria <FaFilter style={{ fontSize: 17, marginLeft: 4, verticalAlign: "middle" }} />
										</th>
										<th>Produto</th>
									</tr>
							</thead>
							<tbody>
								{loadingRecomendacoes ? (
									<tr>
										<td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
											Carregando recomendações...
										</td>
									</tr>
								) : recomendacoesFiltradas.length === 0 ? (
									<tr>
										<td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
											Nenhuma recomendação disponível
										</td>
									</tr>
								) : (
									recomendacoesFiltradas.map((rec, i) => (
										<tr key={i}>
											<td>{formatDateBRFromISO(rec.data)}</td>
											<td>{rec.feriado}</td>
											<td>{rec.categoria}</td>
											<td>{rec.produto}</td>
										</tr>
									))
								)}
							</tbody>
							</table>
						</div>
					</section>

					{/* Período */}
					<section className={styles.dashPeriodo} style={{ width: "100%", maxWidth: 900, margin: "0 auto 8px auto", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<h2 className={styles.sectionTitle}>Selecione um período:</h2>
						<div className={styles.periodoInputs}>
							{/* Data inicial */}
							<div
								className={styles.periodoDate}
								onClick={() => startInputRef.current && startInputRef.current.showPicker && startInputRef.current.showPicker()}
								style={{ position: "relative", cursor: "pointer" }}
							>
								<FaRegCalendarAlt className={styles.calendarIcon} />
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

					{/* Tabela TOP 5 Categorias */}
					<section style={{ width: "100%", maxWidth: 900, margin: "0 auto 8px auto", position: "relative" }}>
						<h3 className={styles.sectionTitle}>{getTableTitle()}</h3>
						
						{/* Filtro de Categorias - fora da tabela */}
						{showCategoriasFilter && (
							<div className={`${styles.filterDropdown} ${styles.filterDropdownCategorias}`}>
								<div className={`${styles.filterTitle} ${styles.filterTitleCategorias}`}>
									Filtrar por:
								</div>
								<div className={styles.filterOptionsContainer}>
									{categoriaTypeOptions.map((option, i) => (
										<div key={i} className={styles.filterOption}>
											<input
												type="radio"
												id={`categoria-${i}`}
												name="categoriaType"
												checked={selectedCategoriaType === option}
												onChange={() => handleCategoriaTypeChange(option)}
											/>
											<label htmlFor={`categoria-${i}`}>{option}</label>
										</div>
									))}
								</div>
							</div>
						)}

						<div style={{ overflowX: "auto" }}>
							<table className={styles.categoriasTable}>
								<thead>
									<tr>
										<th>Ranking</th>
										<th 
											style={{ cursor: "pointer" }}
											onClick={() => setShowCategoriasFilter(!showCategoriasFilter)}
										>
										{selectedCategoriaType === "Categorias de Produtos" ? "Categoria" : "Produto"} <FaFilter style={{ fontSize: 17, marginLeft: 4, verticalAlign: "middle" }} />
									</th>
									<th>Qtd.</th>
									<th>Detalhes</th>
								</tr>
								</thead>
								<tbody>
									{loading ? (
										<tr>
											<td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
												Carregando...
											</td>
										</tr>
									) : produtosFiltrados.length > 0 ? (
										produtosFiltrados.map((produto, index) => (
											<tr key={index}>
												<td>{index + 1}º</td>
												<td>{produto.nomeProduto}</td>
												<td>{produto.quantidadeVendida}</td>
												<td><FaSearch 
													style={{ color: "#4d2c0c", fontSize: 24, cursor: 'pointer' }} 
													onClick={handleSearchClick}
												/></td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan="4" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#8b6239' }}>
												{startDate && endDate ? "Nenhum produto encontrado no período selecionado." : "Selecione um período para visualizar os produtos mais vendidos."}
											</td>
										</tr>
									)}
								</tbody>
							</table>
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
