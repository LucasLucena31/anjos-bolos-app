import imagemPadraoProduto from '../assets/bolo.png';
import React from "react";
import { Button } from "../components/Button";
import { Navbar } from "../components/Navbar";
import styles from "../styles/RegistroVendas.module.css";
import { Produto } from "../components/Produto";
import { Modal } from "../components/Modal";
import { ModernToast } from "../components/ModernToast";
import api from '../provider/api';
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { GiWhisk } from "react-icons/gi";
import { MdCake } from "react-icons/md";
import { TbBowlSpoonFilled } from "react-icons/tb";
import { generateMenuPDF } from '../utils/generateMenuPDF';
import Logo from '../assets/anjos-bolos.png';

export function RegistroVendas(props) {
  useDocumentTitle(props.titulo);

  // Estado dos produtos
  const [produtos, setProdutos] = React.useState([]);
  const [massas, setMassas] = React.useState([]);
  const [recheios, setRecheios] = React.useState([]);
  const [coberturas, setCoberturas] = React.useState([]);

  // Estado da interface
  const [isButtonActive, setIsButtonActive] = React.useState(false);
  const [categoria, setCategoria] = React.useState("tradicionais");
  const [tipoVenda, setTipoVenda] = React.useState("Pronta-Entrega");

  // Estado das vendas
  const [vendas, setVendas] = React.useState([]);

  // Estado dos modais
  const [showEncomendaModal, setShowEncomendaModal] = React.useState(false);
  const [showBoloFestaModal, setShowBoloFestaModal] = React.useState(false);

  // Estado da encomenda
  const [orderDetails, setOrderDetails] = React.useState({
    date: '',
    time: '',
    cpf: '',
    clientName: '',
    phone: '',
    clientId: null
  });

  // Estado do bolo de festa
  const [selectedMassa, setSelectedMassa] = React.useState('');
  const [selectedRecheio, setSelectedRecheio] = React.useState('');
  const [selectedCobertura, setSelectedCobertura] = React.useState('');
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState('error');

  const [festaMontada, setFestaMontada] = React.useState({
    id: null,
    massa: [],
    recheio: [],
    cobertura: []
  });
  const [festaModalInput, setFestaModalInput] = React.useState({
    peso: '',
    preco: '',
    observacao: ''
  });

  const cpfDebounceRef = React.useRef(null);
  const toastResetRef = React.useRef(null);

  // Carregar produtos da API por categoria selecionada
  React.useEffect(() => {
    let mounted = true;

    // map local category key -> categoria id da API
    const categoriaToId = {
      tradicionais: 1, // 'Bolo Tradicional'
      bebidas: 2,       // 'Bebida'
      salgados: 3,      // 'Salgados'
      pote: 4,          // 'Bolo de Pote'
      festa: 5          // 'Bolo de Festa'
    };

    async function loadProdutosByCategoria() {
      try {
        const catKey = categoria || 'tradicionais';
        const catId = categoriaToId[catKey] || 1;
        console.log(`🔍 Carregando produtos para categoria '${catKey}' (id=${catId})`);

        const resp = await api.get(`/produtos/categoria/${catId}`);
        // endpoint pode retornar array direto ou envelopado em .content
        const content = Array.isArray(resp.data) ? resp.data : (resp?.data?.content || []);

        const mapped = content.map(p => ({
          id: p.id,
          imagem: p.nomeImagem || imagemPadraoProduto,
          titulo: p.nome || p.titulo || '',
          valor: Number(p.precoFinal || p.preco || p.valor || 0) || 0,
          categoria: catKey
        }));

        console.log(`✅ Produtos carregados (${mapped.length}) para categoria '${catKey}'`);
        if (mounted) setProdutos(mapped);
      } catch (err) {
        console.error('Erro ao carregar produtos por categoria:', err);
        if (mounted) setProdutos([]);
      }
    }

    loadProdutosByCategoria();
    return () => { mounted = false };
  }, [categoria]);

  // Carregar receitas da API
  React.useEffect(() => {
    let mounted = true;

    async function loadReceitas() {
      try {
        const resp = await api.get(`/receitas`);
        const list = resp?.data || [];
        if (!mounted) return;

        const m = list
          .filter(r => String(r.tipoReceita || '').toLowerCase().startsWith('massa'))
          .map(r => ({ id: r.id, nome: r.nome }));
        const rec = list
          .filter(r => String(r.tipoReceita || '').toLowerCase().startsWith('recheio'))
          .map(r => ({ id: r.id, nome: r.nome }));
        const c = list
          .filter(r => String(r.tipoReceita || '').toLowerCase().startsWith('cobertura'))
          .map(r => ({ id: r.id, nome: r.nome }));

        setMassas(m);
        setRecheios(rec);
        setCoberturas(c);
      } catch (err) {
        console.error('Erro ao carregar receitas:', err);
      }
    }

    loadReceitas();
    return () => { mounted = false };
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastResetRef.current) clearTimeout(toastResetRef.current);
    };
  }, []);

  // Funções auxiliares
  function normalizeDigits(str = '') {
    return String(str).replace(/\D/g, '');
  }

  function generateTimeOptions() {
    const options = [];
    const start = 8 * 60;
    const end = 20 * 60;
    for (let t = start; t <= end; t += 30) {
      const h = Math.floor(t / 60).toString().padStart(2, '0');
      const m = (t % 60).toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
    return options;
  }

  const timeOptions = generateTimeOptions();
  const telefoneRegex = /^\(\d{2}\) 9\d{4}-\d{4}$/;

  function maskCpf(value = '') {
    const digits = normalizeDigits(value).slice(0, 11);
    let masked = digits;
    masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
    masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
    masked = masked.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return masked;
  }

  function maskPhone(value = '') {
    const digits = normalizeDigits(value).slice(0, 11);
    if (!digits) return '';

    if (digits.length <= 2) {
      return digits.length === 2 ? `(${digits}) ` : `(${digits}`;
    }

    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function isValidCPF(value = '') {
    const cpf = normalizeDigits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (baseLength) => {
      let sum = 0;
      for (let i = 0; i < baseLength; i += 1) {
        sum += Number(cpf[i]) * (baseLength + 1 - i);
      }
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const digit1 = calcDigit(9);
    const digit2 = calcDigit(10);

    return digit1 === Number(cpf[9]) && digit2 === Number(cpf[10]);
  }

  function isValidPickupDate(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(`${dateStr}T00:00:00`);
    selected.setHours(0, 0, 0, 0);
    return selected >= today;
  }

  const showToast = (message, type = 'error') => {
    if (toastResetRef.current) {
      clearTimeout(toastResetRef.current);
    }

    setToastVisible(false);
    toastResetRef.current = setTimeout(() => {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
    }, 20);
  };

  // Buscar cliente por CPF
  async function fetchClientByCpf(cpf) {
    try {
      const resp = await api.get(`/clientes`);
      const list = Array.isArray(resp.data) ? resp.data : [];
      const found = list.find(c => normalizeDigits(c.cpf) === normalizeDigits(cpf));

      if (found) {
        // update state and persist resumoVendas so ResumoVenda can read clientId immediately
        setOrderDetails(prev => {
          const updated = {
            ...prev,
            clientId: found.id,
            clientName: found.nome,
            phone: maskPhone(found.telefone || prev.phone)
          };
          try {
            const payload = { vendas, tipoVenda };
            if (tipoVenda === 'Encomenda') payload.orderDetails = updated;
            localStorage.setItem('resumoVendas', JSON.stringify(payload));
          } catch (e) {
            console.error('Erro ao atualizar resumoVendas no localStorage (fetchClientByCpf):', e);
          }
          return updated;
        });
      } else {
        setOrderDetails(prev => {
          const updated = {
            ...prev,
            clientId: null,
            clientName: prev.clientName || '',
            phone: prev.phone || ''
          };
          try {
            const payload = { vendas, tipoVenda };
            if (tipoVenda === 'Encomenda') payload.orderDetails = updated;
            localStorage.setItem('resumoVendas', JSON.stringify(payload));
          } catch (e) {
            console.error('Erro ao atualizar resumoVendas no localStorage (fetchClientByCpf):', e);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar cliente por CPF:', err);
    }
  }

  // Handlers
  function handleCpfChange(e) {
    const masked = maskCpf(e.target.value);
    setOrderDetails(prev => ({ ...prev, cpf: masked, clientId: null }));

    if (cpfDebounceRef.current) clearTimeout(cpfDebounceRef.current);
    cpfDebounceRef.current = setTimeout(() => {
      if (normalizeDigits(masked).length === 11) {
        fetchClientByCpf(masked);
      }
    }, 500);
  }

  function handlePhoneChange(e) {
    const masked = maskPhone(e.target.value);
    setOrderDetails(prev => ({ ...prev, phone: masked }));
  }

  const handleTipoVendaChange = (e) => {
    const value = e.target.value;
    setTipoVenda(value);
    if (value === 'Encomenda') {
      setShowEncomendaModal(true);
    }
  };

  const handleConfirmEncomenda = async () => {
    const trimmedName = orderDetails.clientName.trim();
    const hasCpf = isValidCPF(orderDetails.cpf);
    const hasPhone = telefoneRegex.test(orderDetails.phone);

    if (!orderDetails.date) {
      showToast('Informe a data de retirada.');
      return;
    }

    if (!isValidPickupDate(orderDetails.date)) {
      showToast('Data de retirada não pode ser no passado.');
      return;
    }

    if (!orderDetails.time) {
      showToast('Selecione o horário previsto.');
      return;
    }

    if (!trimmedName) {
      showToast('Informe o nome do cliente.');
      return;
    }

    if (!hasPhone) {
      showToast("Telefone deve estar no formato '(XX) 9XXXX-XXXX'.");
      return;
    }

    let normalizedDetails = {
      ...orderDetails,
      clientName: trimmedName,
      cpf: maskCpf(orderDetails.cpf),
      phone: maskPhone(orderDetails.phone)
    };

    if (!orderDetails.clientId) {
      try {
        const payload = {
          nome: trimmedName,
          cpf: normalizedDetails.cpf,
          telefone: normalizedDetails.phone
        };
        const resp = await api.post(`/clientes`, payload);
        const newClient = resp?.data;
        if (newClient?.id) {
          normalizedDetails = { ...normalizedDetails, clientId: newClient.id };
        }
      } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        showToast('Não foi possível cadastrar o cliente. Tente novamente.');
        return;
      }
    }

    setOrderDetails(() => {
      const updated = { ...normalizedDetails };
      try {
        const payload = { vendas, tipoVenda };
        if (tipoVenda === 'Encomenda') payload.orderDetails = updated;
        localStorage.setItem('resumoVendas', JSON.stringify(payload));
      } catch (e) {
        console.error('Erro ao atualizar resumoVendas no localStorage (handleConfirmEncomenda):', e);
      }
      return updated;
    });

    setShowEncomendaModal(false);
    showToast('Detalhes da encomenda confirmados.', 'success');
  };

  const handleCancelEncomenda = () => {
    setShowEncomendaModal(false);
    setTipoVenda('Pronta-Entrega');
    setOrderDetails({
      date: '',
      time: '',
      cpf: '',
      clientName: '',
      phone: '',
      clientId: null
    });
  };

  const handleCancelBoloFesta = () => {
    setShowBoloFestaModal(false);
  };

  const handleProdutoClick = (produto) => {
    setIsButtonActive(true);
    setVendas(prevVendas => [
      ...prevVendas,
      {
        nome: produto.titulo,
        valorFinal: produto.valor,
        categoriaEntrega: tipoVenda,
        produtoId: produto.id || null,
        categoria: produto.categoria || ''
      }
    ]);
  };

  function handleProdutoRemove(produto) {
    setVendas(prevVendas => {
      const updatedVendas = prevVendas.filter(venda => venda.nome !== produto.titulo);
      setIsButtonActive(updatedVendas.length > 0);
      return updatedVendas;
    });
  }

  const handleAdicionarItemBolo = () => {
    const id = festaMontada.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    
    const temAlgoSelecionado = selectedMassa || selectedRecheio || selectedCobertura;
    
    if (!temAlgoSelecionado) {
      showToast('Selecione uma massa, recheio ou cobertura antes de adicionar.');
      return;
    }

    const novasMassas = selectedMassa ? [...(festaMontada.massa || []), selectedMassa] : festaMontada.massa || [];
    const novosRecheios = selectedRecheio ? [...(festaMontada.recheio || []), selectedRecheio] : festaMontada.recheio || [];
    const novasCoberturas = selectedCobertura ? [...(festaMontada.cobertura || []), selectedCobertura] : festaMontada.cobertura || [];

    setFestaMontada({
      id,
      massa: novasMassas,
      recheio: novosRecheios,
      cobertura: novasCoberturas
    });

    setIsButtonActive(true);
    setSelectedMassa('');
    setSelectedRecheio('');
    setSelectedCobertura('');
  };

  const handleRemoverMontagem = () => {
    setFestaMontada({ id: null, massa: [], recheio: [], cobertura: [] });
    setIsButtonActive(vendas.length > 0);
  };

  const handleDownloadCardapio = async () => {
    try {
      await generateMenuPDF(produtos, Logo);
      showToast('Cardápio baixado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao gerar cardápio:', error);
      showToast('Erro ao gerar cardápio. Tente novamente.');
    }
  };

  const handleConfirmarBoloFesta = () => {
    const temMassa = festaMontada && (festaMontada.massa?.length > 0);

    if (!temMassa) {
      showToast('Selecione pelo menos uma massa para o bolo.');
      return;
    }

    const pesoNum = parseFloat(String(festaModalInput.peso || '').replace(',', '.'));
    const precoNum = parseFloat(String(festaModalInput.preco || '').replace(',', '.'));

    if (Number.isNaN(pesoNum) || pesoNum <= 0) {
      showToast('Informe um peso válido para o bolo.');
      return;
    }
    if (Number.isNaN(precoNum) || precoNum <= 0) {
      showToast('Informe um preço válido para o bolo.');
      return;
    }

    const bolo = {
      categoriaEntrega: tipoVenda,
      nome: 'Bolo de festa',
      massa: festaMontada.massa.join(' | '),
      recheio: festaMontada.recheio.join(' | '),
      cobertura: festaMontada.cobertura.join(' | '),
      peso: pesoNum,
      valorFinal: precoNum,
      observacao: festaModalInput.observacao || ''
    };

    const updatedVendas = [...vendas, bolo];
    const payload = { vendas: updatedVendas, tipoVenda };
    if (tipoVenda === 'Encomenda' && orderDetails) {
      payload.orderDetails = orderDetails;
    }
    localStorage.setItem('resumoVendas', JSON.stringify(payload));

    setFestaMontada({ id: null, massa: [], recheio: [], cobertura: [] });
    setFestaModalInput({ peso: '', preco: '', observacao: '' });
    setShowBoloFestaModal(false);

    window.location.href = '/resumo-venda';
  };

  const navigateToResumoVendas = async () => {
    const temMontagemParcial = festaMontada && (
      (festaMontada.massa?.length) ||
      (festaMontada.recheio?.length) ||
      (festaMontada.cobertura?.length)
    );

    if (temMontagemParcial) {
      const temMassa = festaMontada.massa?.length > 0;

      if (temMassa) {
        setShowBoloFestaModal(true);
        return;
      }

      showToast('Selecione uma massa para completar a montagem do bolo.');
      return;
    }

    // Contar bolos
    const cakeCategories = ['tradicionais', 'pote', 'festa'];
    const normalize = s => String(s || '').toLowerCase();
    let boloCount = 10;





    // Salvar no localStorage e navegar
    try {
      const payload = { vendas, tipoVenda };
      if (tipoVenda === 'Encomenda' && orderDetails) {
        payload.orderDetails = orderDetails;
      }
      localStorage.setItem('resumoVendas', JSON.stringify(payload));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }

    window.location.href = '/resumo-venda';
  };

  const temMontagemAtual = festaMontada && (
    (festaMontada.massa?.length > 0) ||
    (festaMontada.recheio?.length > 0) ||
    (festaMontada.cobertura?.length > 0)
  );
  const toastDuration = toastType === 'success' ? 1800 : 1500;

  return (
    <div className={styles.containerRegistroVendas}>
      <Navbar logado={true} />
      <h1>Registro de Vendas</h1>

      <div className={styles.labelFiltro}>
        <div>
          <h4>Tipo de venda</h4>
          <select value={tipoVenda} onChange={handleTipoVendaChange}>
            <option value="Pronta-Entrega">Pronta-Entrega</option>
            <option value="Encomenda">Encomenda</option>
          </select>
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.downloadButton}
            onClick={handleDownloadCardapio}
          >
            Download do Cardápio
          </button>
          <button
            disabled={!isButtonActive}
            className={!isButtonActive ? styles.inactiveButton : ''}
            onClick={navigateToResumoVendas}
          >
            Registrar
          </button>
        </div>
      </div>

      {/* Modal de Encomenda */}
      <Modal isOpen={showEncomendaModal} onClose={handleCancelEncomenda}>
        <div className={styles.modalEncomenda}>
          <h3>Detalhes da Encomenda</h3>
          <div className={styles.modalEncomendaField}>
            <label>Data de retirada</label>
            <input
              type="date"
              value={orderDetails.date}
              onChange={e => setOrderDetails(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className={styles.modalEncomendaField}>
            <label>CPF do cliente</label>
            <input
              type="text"
              value={orderDetails.cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className={styles.modalEncomendaField}>
            <label>Horário previsto</label>
            <select
              value={orderDetails.time}
              onChange={e => setOrderDetails(prev => ({ ...prev, time: e.target.value }))}
            >
              <option value="">-- selecione --</option>
              {timeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.modalEncomendaField}>
            <label>Nome do cliente</label>
            <input
              type="text"
              value={orderDetails.clientName}
              onChange={e => setOrderDetails(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Nome do cliente"
            />
          </div>
          <div className={styles.modalEncomendaField}>
            <label>Telefone do cliente</label>
            <input
              type="tel"
              value={orderDetails.phone}
              onChange={handlePhoneChange}
              placeholder="(XX) 9XXXX-XXXX"
              maxLength={15}
            />
          </div>
          <div className={styles.modalEncomendaButtons}>
            <button className={styles.modalCancelButton} onClick={handleCancelEncomenda}>
              Cancelar
            </button>
            <button className={styles.modalConfirmButton} onClick={handleConfirmEncomenda}>
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Bolo de Festa */}
      <Modal isOpen={showBoloFestaModal} onClose={handleCancelBoloFesta}>
        <div style={{ padding: 20, maxWidth: 720, backgroundColor: '#fff', borderRadius: "8px", paddingTop: "2px" }}>
          <h3>Detalhes do Bolo de Festa</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {!temMontagemAtual ? (
              <div>Nenhum bolo montado. Volte e adicione massa, recheio e cobertura antes de confirmar.</div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e8e1d8', padding: 12, borderRadius: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label>Peso (kg)</label>
                    <input
                      type="text"
                      value={festaModalInput.peso || ''}
                      onChange={e => setFestaModalInput(prev => ({ ...prev, peso: e.target.value }))}
                      placeholder="Ex: 2.5"
                      style={{ width: '70%', padding: 8, marginTop: 6 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Preço (R$)</label>
                    <input
                      type="text"
                      value={festaModalInput.preco || ''}
                      onChange={e => setFestaModalInput(prev => ({ ...prev, preco: e.target.value }))}
                      placeholder="Ex: 150.00"
                      style={{ width: '70%', padding: 8, marginTop: 6 }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label>Observação (Opcional)</label>
                  <textarea
                    value={festaModalInput.observacao || ''}
                    onChange={e => setFestaModalInput(prev => ({ ...prev, observacao: e.target.value }))}
                    placeholder="Observações sobre o bolo"
                    style={{ width: '80%', padding: 8, marginTop: 6, minHeight: 60 }}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={handleCancelBoloFesta} style={{ padding: '8px 12px' }}>
              Cancelar
            </button>
            <button onClick={handleConfirmarBoloFesta} style={{ padding: '8px 12px' }}>
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Filtro de Categorias */}
      <div className={styles.filtro}>
        <h4>Filtrar por categorias</h4>
        <div>
          <label>
            <input
              type="radio"
              name="categoria"
              value="tradicionais"
              checked={categoria === "tradicionais"}
              onChange={() => setCategoria("tradicionais")}
            />
            Bolos Tradicionais
          </label>
          <label>
            <input
              type="radio"
              name="categoria"
              value="bebidas"
              checked={categoria === "bebidas"}
              onChange={() => setCategoria("bebidas")}
            />
            Bebidas
          </label>
          <label>
            <input
              type="radio"
              name="categoria"
              value="salgados"
              checked={categoria === "salgados"}
              onChange={() => setCategoria("salgados")}
            />
            Salgados
          </label>
          <label>
            <input
              type="radio"
              name="categoria"
              value="pote"
              checked={categoria === "pote"}
              onChange={() => setCategoria("pote")}
            />
            Bolos de Pote
          </label>
          <label>
            <input
              type="radio"
              name="categoria"
              value="festa"
              checked={categoria === "festa"}
              onChange={() => setCategoria("festa")}
            />
            Bolos de Festa
          </label>
        </div>
      </div>

      {/* Seção de Montagem de Bolo de Festa */}
      {categoria === 'festa' && (
        <div className={styles.festaAssembly}>
          <h3>Montar Bolo de Festa</h3>
          <div className={styles.festaGrid}>
            <div className={styles.festaSelects}>
              <div className={styles.festaSelectGroup}>
                <label><MdCake className={styles.labelIcon} /> Massa</label>
                <select
                  value={selectedMassa}
                  onChange={e => setSelectedMassa(e.target.value)}
                >
                  <option value="">Selecione a Massa</option>
                  {massas.length ? massas.map(r => (
                    <option key={r.id} value={r.nome}>{r.nome}</option>
                  )) : produtos.filter(p => p.categoria === 'massa').map(p => (
                    <option key={p.titulo} value={p.titulo}>{p.titulo}</option>
                  ))}
                </select>
              </div>
              <div className={styles.festaSelectGroup}>
                <label><TbBowlSpoonFilled className={styles.labelIcon} /> Recheio</label>
                <select
                  value={selectedRecheio}
                  onChange={e => setSelectedRecheio(e.target.value)}
                >
                  <option value="">Selecione o Recheio</option>
                  {recheios.length ? recheios.map(r => (
                    <option key={r.id} value={r.nome}>{r.nome}</option>
                  )) : produtos.filter(p => p.categoria === 'recheio').map(p => (
                    <option key={p.titulo} value={p.titulo}>{p.titulo}</option>
                  ))}
                </select>
              </div>
              <div className={styles.festaSelectGroup}>
                <label><GiWhisk className={styles.labelIconWhisk} /> Cobertura</label>
                <select
                  value={selectedCobertura}
                  onChange={e => setSelectedCobertura(e.target.value)}
                >
                  <option value="">Selecione a Cobertura</option>
                  {coberturas.length ? coberturas.map(r => (
                    <option key={r.id} value={r.nome}>{r.nome}</option>
                  )) : produtos.filter(p => p.categoria === 'cobertura').map(p => (
                    <option key={p.titulo} value={p.titulo}>{p.titulo}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdicionarItemBolo}
              className={styles.festaAddButton}
            >
              Adicionar item
            </button>

            {temMontagemAtual && (
              <div className={styles.montagemAtualCard}>
                <strong>Montagem atual</strong>
                <div className={styles.montagemDetails}>
                  {festaMontada.massa?.length > 0 && (
                    <div className={styles.montagemItem}>
                      <strong>Massa:</strong> <span>{festaMontada.massa.join(' | ')}</span>
                    </div>
                  )}
                  {festaMontada.recheio?.length > 0 && (
                    <div className={styles.montagemItem}>
                      <strong>Recheio:</strong> <span>{festaMontada.recheio.join(' | ')}</span>
                    </div>
                  )}
                  {festaMontada.cobertura?.length > 0 && (
                    <div className={styles.montagemItem}>
                      <strong>Cobertura:</strong> <span>{festaMontada.cobertura.join(' | ')}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoverMontagem}
                    className={styles.removerButton}
                  >
                    Remover montagem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast de validação */}
      <ModernToast
        isOpen={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={toastDuration}
        onClose={() => setToastVisible(false)}
      />

      {/* Lista de Produtos */}
      <div className={styles.produtos}>
        {produtos
          .filter(produto => produto.categoria === categoria && categoria !== 'festa')
          .map(produto => (
            <Produto
              key={produto.id || produto.titulo}
              imagem={produto.imagem}
              titulo={produto.titulo}
              valor={produto.valor.toFixed(2).replace('.', ',')}
              onAdd={() => handleProdutoClick(produto)}
              onRemove={() => handleProdutoRemove(produto)}
            />
          ))}
      </div>
    </div>
  );
}