import React, { useRef, useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import styles from "../styles/Encomendas.module.css";
import { FaRegCalendarAlt, FaSearch, FaLock, FaLockOpen } from "react-icons/fa";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLocation } from "react-router-dom";
import api from '../provider/api';
import { ModernToast } from '../components/ModernToast';
import ModalItensStyles from '../styles/ModalItensPedido.module.css';
import { Modal } from '../components/Modal';

export function Encomendas(props) {
  useDocumentTitle(props.titulo);
  const location = useLocation();

  // Função para formatar status para exibição
  const formatarStatusParaExibicao = (status) => {
    if (status === 'Pendente de Pagamento') {
      return 'Pendente Pag';
    }
    return status;
  };

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

  // Ler parâmetros da URL
  const searchParams = new URLSearchParams(location.search);
  const urlDataPedidoInicio = searchParams.get('dataPedidoInicio');
  const urlDataRetiradaInicio = searchParams.get('dataRetiradaInicio');
  const urlDataRetiradaFim = searchParams.get('dataRetiradaFim');
  const urlStatus = searchParams.get('status');

  // startDate = Data do Pedido (vem de dataPedidoInicio)
  // endDate = Data de Retirada (não usado mais)
  // endDateFim = Data de Retirada fim (vem de dataRetiradaFim)
  const [startDate, setStartDate] = useState(urlDataPedidoInicio || '');
  const [endDate, setEndDate] = useState('');
  const [endDateFim, setEndDateFim] = useState(urlDataRetiradaFim || '');
  
  console.log('Parâmetros URL:', {
    dataPedidoInicio: urlDataPedidoInicio,
    dataRetiradaInicio: urlDataRetiradaInicio,
    dataRetiradaFim: urlDataRetiradaFim,
    status: urlStatus
  });
  console.log('Estados de data:', { startDate, endDate, endDateFim });
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Estado para controlar seleção múltipla de status
  // Se urlStatus contém vírgula, é múltiplo; caso contrário, é único
  const [statusSelecionados, setStatusSelecionados] = useState(() => {
    if (urlStatus && urlStatus !== 'Todos') {
      const statusArray = urlStatus.includes(',') ? urlStatus.split(',').map(s => s.trim()) : [urlStatus];
      console.log('Status iniciais da URL:', urlStatus, '-> array:', statusArray);
      return statusArray;
    }
    console.log('Nenhum status na URL');
    return [];
  });
  const [mostrarFiltroStatus, setMostrarFiltroStatus] = useState(false);
  const statusDisponiveis = ['Confirmado', 'Pendente de Pagamento', 'Cancelado', 'Finalizado'];

  const [filtros, setFiltros] = useState({
    dia: urlDataRetiradaInicio || startDate,
    mes: urlDataRetiradaFim || endDate,
    valor: "Todos",
    categoria: 'Todos'
  });

  const [encomendas, setEncomendas] = useState([]);
  const [pedidosFull, setPedidosFull] = useState([]);
  const [itensFull, setItensFull] = useState([]);
  const [statusEditando, setStatusEditando] = useState({});
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estado para modal de itens do pedido
  const [modalItensOpen, setModalItensOpen] = useState(false);
  const [itensPedidoModal, setItensPedidoModal] = useState([]);
  const [pedidoIdModal, setPedidoIdModal] = useState(null);
  const [dataRetiradaModal, setDataRetiradaModal] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Carregar pedidos onde dataRetirada > dataPedido (encomendas futuras)
  useEffect(() => {
    let mounted = true;
    let intervalId;

    async function loadEncomendas() {
      try {
        // ...existing code...
        let pedidosResp = await api.get('/pedidos', { headers: { 'Cache-Control': 'no-cache' } });
        let itensResp = await api.get('/itens-pedido', { headers: { 'Cache-Control': 'no-cache' } });

        const pedidos = Array.isArray(pedidosResp.data) ? pedidosResp.data : (pedidosResp.data && pedidosResp.data.content) ? pedidosResp.data.content : [];
        const itens = Array.isArray(itensResp.data) ? itensResp.data : (itensResp.data && itensResp.data.content) ? itensResp.data.content : [];

        // Filtrar APENAS ENCOMENDAS (dataRetirada > dataPedido)
        console.log('Total de pedidos recebidos:', pedidos.length);
        let encomendasFiltradas = pedidos.filter(pedido => {
          const dataPedidoStr = pedido.dataPedido || '';
          const dataRetiradaStr = pedido.dataRetirada || '';
          if (!dataPedidoStr || !dataRetiradaStr) {
            console.log(`Pedido ${pedido.id}: dataRetirada ou dataPedido ausente, não é encomenda`);
            return false;
          }
          const dataPedido = new Date(dataPedidoStr);
          const dataRetirada = new Date(dataRetiradaStr);
          const isEncomenda = dataRetirada > dataPedido;
          console.log(`Pedido ${pedido.id}: dataPedido=${dataPedidoStr}, dataRetirada=${dataRetiradaStr}, isEncomenda=${isEncomenda}, status=${pedido.status}`);
          return isEncomenda;
        });
        
        console.log('Total de encomendas encontradas:', encomendasFiltradas.length);

        // Filtrar por data de pedido E data de retirada
        if (startDate || endDate || endDateFim) {
          encomendasFiltradas = encomendasFiltradas.filter(pedido => {
            const dataPedidoStr = (pedido.dataPedido || '').slice(0, 10);
            const dataRetiradaStr = (pedido.dataRetirada || '').slice(0, 10);
            
            // Filtro de data de pedido (startDate = início)
            if (startDate && dataPedidoStr < startDate) {
              console.log(`Pedido ${pedido.id}: dataPedido=${dataPedidoStr} < ${startDate} → excluído`);
              return false;
            }
            
            // Filtro de data de retirada (endDate = não usado, endDateFim = fim)
            if (endDateFim && dataRetiradaStr > endDateFim) {
              console.log(`Pedido ${pedido.id}: dataRetirada=${dataRetiradaStr} > ${endDateFim} → excluído`);
              return false;
            }
            
            console.log(`Pedido ${pedido.id}: passou no filtro de datas ✅`);
            return true;
          });
        }
        
        console.log('Encomendas após filtro de datas:', encomendasFiltradas.length);

        const pedidosIdsFiltrados = new Set(encomendasFiltradas.map(p => Number(p.id)));
        const itensFiltrados = itens.filter(it => pedidosIdsFiltrados.has(Number(it.pedidoId)));
        const resultado = aplicarFiltrosEAgregar(encomendasFiltradas, itensFiltrados);
        if (mounted) {
          setEncomendas(resultado);
          setPedidosFull(encomendasFiltradas);
          setItensFull(itensFiltrados);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar encomendas:', err);
      }
    }

    loadEncomendas();
    intervalId = setInterval(() => {
      loadEncomendas();
    }, 10000); // Atualiza a cada 10 segundos

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [startDate, endDate, endDateFim, statusSelecionados, filtros.categoria, filtros.valor]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setMostrarFiltroStatus(false);
      }
    };

    if (mostrarFiltroStatus) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarFiltroStatus]);

  const aplicarFiltrosEAgregar = (pedidos, itens) => {
    let pedidosFiltrados = [...pedidos];
    let itensFiltrados = [...itens];

    console.log('aplicarFiltrosEAgregar - statusSelecionados:', statusSelecionados);
    console.log('aplicarFiltrosEAgregar - pedidos recebidos:', pedidos.length);

    // Filtrar por status (múltiplos)
    if (statusSelecionados.length > 0) {
      console.log('Aplicando filtro de status...');
      pedidosFiltrados = pedidosFiltrados.filter(p => {
        const normalize = s => (s || '').toString().replace(/_/g, '').replace(/ /g, '').toLowerCase();
        const statusNorm = normalize(p.status);
        const match = statusSelecionados.some(s => normalize(s) === statusNorm);
        console.log(`Pedido ${p.id}: status="${p.status}" normalizado="${statusNorm}" match=${match}`);
        console.log(`  Comparando com:`, statusSelecionados.map(s => `"${s}" -> "${normalize(s)}"`));
        return match;
      });
      console.log('Pedidos após filtro de status:', pedidosFiltrados.length);
    } else {
      console.log('Nenhum filtro de status aplicado, mostrando todos os pedidos');
    }

    const pedidoIds = new Set(pedidosFiltrados.map(p => Number(p.id)));
    itensFiltrados = itensFiltrados.filter(it => pedidoIds.has(Number(it.pedidoId)));

    // Filtrar por categoria
    if (filtros.categoria && filtros.categoria !== 'Todos') {
      itensFiltrados = itensFiltrados.filter(it => {
        const nome = (it.produto || it.nomeProduto || it.descricao || '').toString();
        const cat = inferCategoryFromProductName(nome);
        return cat === filtros.categoria;
      });

      const pedidoIdsComItens = new Set(itensFiltrados.map(it => Number(it.pedidoId)));
      pedidosFiltrados = pedidosFiltrados.filter(p => pedidoIdsComItens.has(Number(p.id)));
    }

    // Preparar dados agregados por pedido
    const resultado = pedidosFiltrados.map(pedido => {
      const itensDoPedido = itensFiltrados.filter(it => Number(it.pedidoId) === Number(pedido.id));
      const valorTotal = itensDoPedido.reduce((s, it) => s + (Number(it.precoUnitario) * (Number(it.quantidade) || 1)), 0);
      const qtdItens = itensDoPedido.reduce((s, it) => s + (Number(it.quantidade) || 0), 0);

      const dataRetiradaStr = pedido.dataRetirada || '';
      const dt = dataRetiradaStr ? new Date(dataRetiradaStr) : null;
      const dia = dt ? String(dt.getDate()).padStart(2, '0') : '??';
      const mes = dt ? String(dt.getMonth() + 1).padStart(2, '0') : '??';
      const ano = dt ? dt.getFullYear() : '????';
      const dataRetiradaFormatada = `${dia}/${mes}/${ano}`;

      return {
        pedidoId: pedido.id,
        valor: valorTotal,
        itens: qtdItens,
        dataRetirada: dataRetiradaFormatada,
        dataRetiradaCompleta: dataRetiradaStr.split(' ')[0],
        status: pedido.status || 'PENDENTE',
        nomeCliente: pedido.Cliente || pedido.nomeCliente || 'Cliente',
        pedidoCompleto: pedido
      };
    });

    // Filtrar por valor
    let resultadoFinal = resultado;
    if (filtros.valor && filtros.valor !== 'Todos') {
      resultadoFinal = resultado.filter(v => {
        const valor = v.valor;
        if (filtros.valor === 'Abaixo de R$ 50') return valor < 50;
        if (filtros.valor === 'R$ 50 - R$ 100') return valor >= 50 && valor <= 100;
        if (filtros.valor === 'R$ 100 - R$ 200') return valor >= 100 && valor <= 200;
        if (filtros.valor === 'Acima de R$ 200') return valor > 200;
        return true;
      });
    }

    resultadoFinal.sort((a, b) => new Date(a.dataRetiradaCompleta) - new Date(b.dataRetiradaCompleta));
    
    return resultadoFinal;
  };

  const handlePesquisar = () => {
    console.log("🔍 Filtros aplicados:", filtros);

    try {
      const resultado = aplicarFiltrosEAgregar(pedidosFull, itensFull, filtros);
      setEncomendas(resultado);
      console.log('✅ Pesquisa aplicada com sucesso. Registros encontrados:', resultado.length);
    } catch (err) {
      console.error('❌ Erro ao aplicar filtros:', err);
    }
  };

  function inferCategoryFromProductName(nome) {
    if (!nome) return 'Outros';
    const n = nome.toLowerCase();
    if (n.includes('coxinha') || n.includes('empada') || n.includes('salgado')) return 'Salgados';
    if (n.includes('pote') || n.includes('bolo de pote')) return 'Bolos de Pote';
    if (n.includes('bolo') && (n.includes('festa') || n.includes('anivers'))) return 'Bolos de Festa';
    if (n.includes('bolo')) return 'Bolos Tradicionais';
    if (n.includes('suco') || n.includes('refrigerante') || n.includes('bebida')) return 'Bebidas';
    return 'Outros';
  }

  const handleStatusChange = (pedidoId, novoStatus) => {
    setStatusEditando(prev => ({
      ...prev,
      [pedidoId]: novoStatus
    }));
  };

  const handleSalvarStatus = async (pedidoId) => {
    // Mostrar informações do usuário logado
    // Buscar o usuário logado no localStorage e obter o id pelo nome
    let usuarioId = '';
    try {
      const usuarioStr = localStorage.getItem('usuario');
      if (usuarioStr) {
        const usuarioObj = JSON.parse(usuarioStr);
        console.log('Usuário logado (localStorage.usuario):', usuarioObj);
        // Buscar usuário pelo nome no backend
        if (usuarioObj.nome) {
          const resp = await api.get(`/usuarios/filtro-nome`, { params: { nome: usuarioObj.nome } });
          if (Array.isArray(resp.data) && resp.data.length > 0) {
            usuarioId = resp.data[0].id;
            console.log('Id do usuário encontrado pelo nome:', usuarioId);
          } else {
            console.log('Usuário não encontrado pelo nome no backend.');
          }
        } else {
          console.log('Nome do usuário não encontrado no localStorage.');
        }
      } else {
        console.log('Nenhum usuário logado encontrado em localStorage.');
      }
    } catch (e) {
      console.log('Erro ao buscar usuário logado:', e);
    }

    const novoStatus = statusEditando[pedidoId];
    if (!novoStatus) return;

    try {
      console.log('💾 Salvando status:', novoStatus);

      // Buscar pedido completo
      const pedidoResp = await api.get(`/pedidos/${pedidoId}`);
      const pedidoAtual = pedidoResp.data;

      // Buscar o cliente pelo nome do pedido e obter o id pelo nome
      let clienteId = '';
      try {
        let nomeCliente = pedidoAtual.nomeCliente || pedidoAtual.Cliente || (pedidoAtual.cliente && (pedidoAtual.cliente.nome || pedidoAtual.cliente.nomeCliente));
        if (!nomeCliente && pedidoAtual.cliente && typeof pedidoAtual.cliente === 'string') nomeCliente = pedidoAtual.cliente;
        if (nomeCliente) {
          const resp = await api.get(`/clientes/filtro-nome`, { params: { nome: nomeCliente } });
          if (Array.isArray(resp.data) && resp.data.length > 0) {
            clienteId = resp.data[0].id;
            console.log('Id do cliente encontrado pelo nome:', clienteId);
          } else {
            console.log('Cliente não encontrado pelo nome no backend.');
          }
        } else {
          console.log('Nome do cliente não encontrado no pedido.');
        }
      } catch (e) {
        console.log('Erro ao buscar cliente pelo nome:', e);
      }

      // Montar objeto conforme esperado pelo backend

      // Garantir formato ISO para datas
      function toDateTimeString(data) {
        if (!data) return '';
        // Se já está no formato 'yyyy-MM-dd HH:mm:ss', retorna como está
        if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data)) return data;
        // Se está no formato ISO, converte para 'yyyy-MM-dd HH:mm:ss'
        let dateObj;
        if (typeof data === 'string' && data.includes('T')) {
          dateObj = new Date(data);
        } else if (typeof data === 'string') {
          // Se vier como '2025-11-16 22:10:39', converte para Date
          dateObj = new Date(data.replace(' ', 'T'));
        } else {
          dateObj = new Date(data);
        }
        if (isNaN(dateObj.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
      }

      const pedidoAtualizado = {
        dataPedido: toDateTimeString(pedidoAtual.dataPedido) || null,
        dataRetirada: toDateTimeString(pedidoAtual.dataRetirada) || null,
        dataPagamento: toDateTimeString(pedidoAtual.dataPagamento) || null,
        formaPagamento: pedidoAtual.formaPagamento ? pedidoAtual.formaPagamento : null,
        status: novoStatus,
        observacao: pedidoAtual.observacao ? pedidoAtual.observacao : null,
        usuarioId: usuarioId || null,
        clienteId: clienteId || null,
      };

      // Log do JSON enviado para o PUT
      console.log('🔼 Enviando para PUT (JSON):', JSON.stringify(pedidoAtualizado, null, 2));

      // Validação básica
      for (const campo of ['status']) {
        if (!pedidoAtualizado[campo]) {
          showToast(`Campo obrigatório ausente: ${campo}`,'error');
          return;
        }
      }

      console.log('🔼 Enviando para PUT (JSON):', JSON.stringify(pedidoAtualizado, null, 2));
      Object.entries(pedidoAtualizado).forEach(([k,v]) => {
        console.log(`  ${k}:`, v, '| typeof:', typeof v);
      });

      await api.put(`/pedidos/${pedidoId}`, pedidoAtualizado);

      showToast('Status atualizado com sucesso!', 'success');

      // Recarregar pedidos do backend para garantir atualização
      try {
        let pedidosResp = await api.get('/pedidos');
        let itensResp = await api.get('/itens-pedido');
        const pedidos = Array.isArray(pedidosResp.data) ? pedidosResp.data : (pedidosResp.data && pedidosResp.data.content) ? pedidosResp.data.content : [];
        const itens = Array.isArray(itensResp.data) ? itensResp.data : (itensResp.data && itensResp.data.content) ? itensResp.data.content : [];
        const encomendasFiltradas = pedidos.filter(pedido => {
          const dataPedidoStr = pedido.dataPedido || '';
          const dataRetiradaStr = pedido.dataRetirada || '';
          if (!dataPedidoStr || !dataRetiradaStr) return false;
          const dataPedido = new Date(dataPedidoStr);
          const dataRetirada = new Date(dataRetiradaStr);
          return dataRetirada > dataPedido;
        });
        const pedidosIdsFiltrados = new Set(encomendasFiltradas.map(p => Number(p.id)));
        const itensFiltrados = itens.filter(it => pedidosIdsFiltrados.has(Number(it.pedidoId)));
        const resultado = aplicarFiltrosEAgregar(encomendasFiltradas, itensFiltrados);
        setEncomendas(resultado);
        setPedidosFull(encomendasFiltradas);
        setItensFull(itensFiltrados);
      } catch (e) {
        // fallback: não recarregou
      }

      // Limpar status editando
      setStatusEditando(prev => {
        const newState = { ...prev };
        delete newState[pedidoId];
        return newState;
      });

    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
      showToast('Erro ao atualizar status', 'error');
    }
  };



  return (
    <div className={styles.containerEncomendas}>
      <Navbar logado={true} />

      <div className={styles.contentEncomendas}>
        {/* Coluna de pesquisa */}
        <div className={styles.filtros}>
          <h1>Pesquisar</h1>
          
          <div className={styles.filtroItem}>
            <label>Data do Pedido</label>
            <div className={styles.periodoDate}
              onClick={() => startInputRef.current && startInputRef.current.showPicker && startInputRef.current.showPicker()}>
              <FaRegCalendarAlt className={styles.calendarIcon} />
              {!startDate && (
                <span className={styles.datePlaceholder}>dd/mm/aaaa</span>
              )}
              <input
                ref={startInputRef}
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                max={getDataHoje()}
                className={styles.invisibleDateInput}
              />
              {startDate && (
                <span className={styles.dateValue}>{formatDateBR(startDate)}</span>
              )}
            </div>
          </div>

          <div className={styles.filtroItem}>
            <label>Data de Retirada</label>
            <div
              className={styles.periodoDate}
              onClick={() => endInputRef.current && endInputRef.current.showPicker && endInputRef.current.showPicker()}
            >
              <FaRegCalendarAlt className={styles.calendarIcon} />
              {!endDateFim && (
                <span className={styles.datePlaceholder}>dd/mm/aaaa</span>
              )}
              <input
                ref={endInputRef}
                type="date"
                value={endDateFim}
                onChange={e => setEndDateFim(e.target.value)}
                className={styles.invisibleDateInput}
              />
              {endDateFim && (
                <span className={styles.dateValue}>{formatDateBR(endDateFim)}</span>
              )}
            </div>
          </div>

          <div className={styles.filterCompactRow}>
            <div className={styles.filtroCompactItem}>
              <label>Categoria</label>
              <select
                value={filtros.categoria || 'Todos'}
                onChange={e => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                className={styles.compactSelect}
              >
                <option value="Todos">Todos</option>
                <option value="Bolos Tradicionais">Bolos Tradicionais</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Salgados">Salgados</option>
                <option value="Bolos de Pote">Bolos de Pote</option>
                <option value="Bolos de Festa">Bolos de Festa</option>
              </select>
            </div>

            <div className={styles.filtroCompactItem} style={{position: 'relative'}} ref={statusDropdownRef}>
              <label>Status</label>
              <div 
                className={styles.compactSelect}
                onClick={() => setMostrarFiltroStatus(!mostrarFiltroStatus)}
                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '100%'}}
              >
                <span>
                  {statusSelecionados.length === 0 
                    ? 'Todos' 
                    : statusSelecionados.length === 1
                      ? formatarStatusParaExibicao(statusSelecionados[0])
                      : `${statusSelecionados.length} selecionados`}
                </span>
                <span style={{fontSize: '0.7rem'}}>▼</span>
              </div>
              {mostrarFiltroStatus && (
                <div className={styles.filtroStatusDropdown}>
                  <div 
                    className={styles.filtroStatusOpcao}
                    onClick={() => {
                      setStatusSelecionados([]);
                      setMostrarFiltroStatus(false);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={statusSelecionados.length === 0}
                      readOnly
                    />
                    <label>Todos</label>
                  </div>
                  {statusDisponiveis.map(status => (
                    <div 
                      key={status}
                      className={styles.filtroStatusOpcao}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (statusSelecionados.includes(status)) {
                          setStatusSelecionados(statusSelecionados.filter(s => s !== status));
                        } else {
                          setStatusSelecionados([...statusSelecionados, status]);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={statusSelecionados.includes(status)}
                        readOnly
                      />
                      <label>{formatarStatusParaExibicao(status)}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.filtroCompactItem}>
              <label>Valor</label>
              <select
                value={filtros.valor || 'Todos'}
                onChange={e => setFiltros(prev => ({ ...prev, valor: e.target.value }))}
                className={styles.compactSelect}
              >
                <option value="Todos">Todos</option>
                <option value="Abaixo de R$ 50">Abaixo de R$ 50</option>
                <option value="R$ 50 - R$ 100">R$ 50 - R$ 100</option>
                <option value="R$ 100 - R$ 200">R$ 100 - R$ 200</option>
                <option value="Acima de R$ 200">Acima de R$ 200</option>
              </select>
            </div>

            <button className={styles.btnPesquisar} onClick={handlePesquisar}>
              Pesquisar
            </button>
          </div>
        </div>

        <div className={styles.leftContent}>
          <h1 className={styles.pageTitle}>Encomendas</h1>
          
          <div className={styles.tabelaContainer}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Valor total</th>
                  <th>Itens</th>
                  <th>Data Retirada</th>
                  <th>Status Pedido</th>
                </tr>
              </thead>
              <tbody>
                {encomendas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.emptyMessage}>
                      Nenhuma encomenda encontrada para o período selecionado
                    </td>
                  </tr>
                ) : (
                  encomendas.map((enc, idx) => (
                    <tr key={idx}>
                      <td>{enc.nomeCliente}</td>
                      <td>R$ {enc.valor.toFixed(2)}</td>
                      <td>{enc.itens}</td>
                      <td>{enc.dataRetirada}</td>
                      <td>
                        <div className={styles.statusCell}>
                          {statusEditando[enc.pedidoId] ? (
                            <>
                              <div className={styles.selectLockWrapper}>
                                <select
                                  value={statusEditando[enc.pedidoId]}
                                  onChange={(e) => handleStatusChange(enc.pedidoId, e.target.value)}
                                  className={styles.statusSelectInline}
                                >
                                  <option value="Confirmado">Confirmado</option>
                                  <option value="Pendente de Pagamento">Pendente Pag</option>
                                  <option value="Finalizado">Finalizado</option>
                                  <option value="Cancelado">Cancelado</option>
                                </select>
                                <FaLockOpen className={styles.lockIcon} title="Edição habilitada" />
                              </div>
                              <button
                                className={styles.btnIconRound}
                                onClick={() => setStatusEditando(prev => { const n = { ...prev }; delete n[enc.pedidoId]; return n; })}
                                title="Cancelar edição"
                              >
                                <span style={{fontSize: 18, lineHeight: 1}}>&#10005;</span>
                              </button>
                              <button
                                className={styles.btnIconRound}
                                onClick={() => handleSalvarStatus(enc.pedidoId)}
                                title="Salvar alteração"
                              >
                                <span style={{fontSize: 18, lineHeight: 1}}>&#10003;</span>
                              </button>

                              <button
                                className={styles.btnIconRound}
                                title="Visualizar"
                                tabIndex={-1}
                                data-pedido-id={enc.pedidoId}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                      console.error('Token não encontrado. Usuário não está logado.');
                                      return;
                                    }
                                    setPedidoIdModal(enc.pedidoId);
                                    setDataRetiradaModal(enc.dataRetirada);
                                    setModalItensOpen(true);
                                    setItensPedidoModal([]);
                                    const resp = await api.get('/itens-pedido', {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    const todosItens = Array.isArray(resp.data) ? resp.data : [];
                                    const itensFiltrados = todosItens.filter(item => Number(item.pedidoId) === Number(enc.pedidoId));
                                    setItensPedidoModal(itensFiltrados);
                                  } catch (err) {
                                    setItensPedidoModal([]);
                                    if (err.response && err.response.status === 204) {
                                      setItensPedidoModal([]);
                                    } else {
                                      console.error('Erro ao buscar itens do pedido:', err);
                                    }
                                  }
                                }}
                              >
                                <FaSearch size={18} color="#7a5230" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={styles.selectLockWrapper}>
                                <select
                                  value={enc.status}
                                  disabled
                                  className={styles.statusSelectInline}
                                >
                                  <option value="Confirmado">Confirmado</option>
                                  <option value="Pendente de Pagamento">Pendente Pag</option>
                                  <option value="Finalizado">Finalizado</option>
                                  <option value="Cancelado">Cancelado</option>
                                </select>
                                <FaLock className={styles.lockIcon + ' ' + styles.locked} title="Edição bloqueada" />
                              </div>
                              <button
                                className={styles.btnIconRound}
                                onClick={() => setStatusEditando(prev => ({ ...prev, [enc.pedidoId]: enc.status }))}
                                title="Editar status"
                              >
                                <span style={{fontSize: 18, lineHeight: 1}}>&#9998;</span>
                              </button>

                              <button
                                className={styles.btnIconRound}
                                title="Visualizar"
                                tabIndex={-1}
                                data-pedido-id={enc.pedidoId}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                      console.error('Token não encontrado. Usuário não está logado.');
                                      return;
                                    }
                                    setPedidoIdModal(enc.pedidoId);
                                    setDataRetiradaModal(enc.dataRetirada);
                                    setModalItensOpen(true);
                                    setItensPedidoModal([]);
                                    const resp = await api.get('/itens-pedido', {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    const todosItens = Array.isArray(resp.data) ? resp.data : [];
                                    const itensFiltrados = todosItens.filter(item => Number(item.pedidoId) === Number(enc.pedidoId));
                                    setItensPedidoModal(itensFiltrados);
                                  } catch (err) {
                                    setItensPedidoModal([]);
                                    if (err.response && err.response.status === 204) {
                                      setItensPedidoModal([]);
                                    } else {
                                      console.error('Erro ao buscar itens do pedido:', err);
                                    }
                                  }
                                }}
                              >
                                <FaSearch size={18} color="#7a5230" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModernToast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Modal de Itens do Pedido */}
      <Modal isOpen={modalItensOpen} onClose={() => setModalItensOpen(false)}>
        <div className={ModalItensStyles.modalItensContent}>
          <div className={ModalItensStyles.modalItensHeader}>
            <h2>Encomenda - {dataRetiradaModal}</h2>
          </div>
          <div className={ModalItensStyles.tableItensWrapper}>
            {itensPedidoModal.length === 0 ? (
              <div className={ModalItensStyles.emptyItensState}>
                <p>Nenhum item encontrado para esta encomenda.</p>
              </div>
            ) : (
              <table className={ModalItensStyles.modalItensTable}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Unitário</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPedidoModal.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.produto || item.nomeProduto || item.descricao || '-'}</td>
                      <td>{item.quantidade || 1}</td>
                      <td>R$ {Number(item.precoUnitario || 0).toFixed(2)}</td>
                      <td>R$ {(Number(item.precoUnitario || 0) * Number(item.quantidade || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );

  function formatDateBR(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatStatus(status) {
    const statusMap = {
      'CONFIRMADO': 'Confirmado',
      'PENDENTE_PAGAMENTO': 'Pendente Pagamento',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
    };
    return statusMap[status] || status;
  }
}
