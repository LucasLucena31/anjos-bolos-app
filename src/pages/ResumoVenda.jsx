import React, { useRef, useState } from "react";
import { Navbar } from "../components/Navbar";
import { SuccessPopup } from "../components/SuccessPopup";
import styles from "../styles/ResumoVendas.module.css";
import { DateInput } from 'rsuite';
import { FaRegCalendarAlt, FaArrowLeft } from "react-icons/fa";
import { useEffect } from "react";
import api, { email as emailApi } from '../provider/api';
import { WHATSAPP_AVISOS } from '../provider/supabase';

export function ResumoVenda() {

  const [vendas, setVendas] = React.useState([]);
  const [resumoParsed, setResumoParsed] = React.useState(null);
  const [clienteCpfInput, setClienteCpfInput] = React.useState('');
  const [clienteIdLocal, setClienteIdLocal] = React.useState(null);
  // controles do menu lateral
  const [formaPagamentoSelect, setFormaPagamentoSelect] = React.useState('DINHEIRO');
  const [statusPedidoSelect, setStatusPedidoSelect] = React.useState('FINALIZADO');
  
  // Estado para o pop-up de sucesso
  const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);

  const handleVoltar = () => {
    window.location.href = '/registro-vendas';
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('resumoVendas');
      if (raw) {
        const parsed = JSON.parse(raw);
        setResumoParsed(parsed);
        // parsed may contain { vendas, tipoVenda }
        if (Array.isArray(parsed.vendas)) {
          setVendas(parsed.vendas);
          console.log('Vendas carregadas do localStorage:', parsed.vendas);
          // if orderDetails contains cpf/clientId (encomenda), prefill
          if (parsed.orderDetails) {
            if (parsed.orderDetails.cpf) setClienteCpfInput(formatCpf(parsed.orderDetails.cpf || ''));
            if (parsed.orderDetails.clientId) setClienteIdLocal(parsed.orderDetails.clientId);
          }
        } else if (Array.isArray(parsed)) {
          // backward compatibility if only array was saved
          setVendas(parsed);
          console.log('Vendas carregadas do localStorage (array):', parsed);
        }
      }
    } catch (error) {
      console.error('Erro ao ler vendas do localStorage:', error);
    }
  }, []);

  function normalizeDigits(str = '') {
    return String(str).replace(/\D/g, '');
  }

  function formatCpf(value = '') {
    const digits = normalizeDigits(value).slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }

  function parseOptionList(value) {
    if (!value) return [];
    const toList = (arr) => arr
      .map(item => String(item).trim())
      .filter(Boolean)
      .slice(0, 3);

    if (Array.isArray(value)) return toList(value);
    return toList(String(value).split('|'));
  }

  async function notifyHeavyPartyCake(venda, dataReferencia) {
    const payload = {
      pedido: {
        massas: parseOptionList(venda.massa),
        coberturas: parseOptionList(venda.cobertura),
        recheios: parseOptionList(venda.recheio),
        pesoKg: Number(venda.peso) || 0,
        observacao: venda.observacao || 'Sem observação'
      }
    };

    if (dataReferencia) {
      payload.dataReferencia = dataReferencia;
    }

    try {
      await emailApi.post('/bolos', payload);
    } catch (err) {
      console.error('Erro ao notificar bolo de festa pesado:', err, payload);
    }
  }

  // Buscar cliente por CPF (usado na tela de resumo quando o usuário fornece CPF)
  async function fetchClientByCpfResumo(cpf) {
    try {
      const resp = await api.get('/clientes');
      const list = Array.isArray(resp.data) ? resp.data : [];
      const found = list.find(c => normalizeDigits(c.cpf) === normalizeDigits(cpf));
      if (found) {
        setClienteIdLocal(found.id);
        console.log('Cliente encontrado na ResumoVenda:', found);
      } else {
        setClienteIdLocal(null);
        console.log('Cliente não encontrado na ResumoVenda para CPF:', cpf);
      }
    } catch (err) {
      console.error('Erro ao buscar cliente por CPF na ResumoVenda:', err);
    }
  }

  const [startDate, setStartDate] = useState("2025-06-01");
  const [endDate, setEndDate] = useState("2025-06-12");
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  const [filtros, setFiltros] = useState({
    dia: startDate,
    mes: endDate,
    valor: "Todos",
  });


  const handlePesquisar = () => {
    console.log("Filtros aplicados:", filtros);
  };

  const handleDownload = () => {
    console.log("Download solicitado");
  };

  // Aviso de bolo de festa (2 kg ou mais) pelo WhatsApp — substitui o antigo e-mail.
  // Precisa abrir aqui, direto no clique, senão o navegador bloqueia a nova aba.
  function avisarBolosFestaWhatsApp() {
    try {
      const raw = localStorage.getItem('resumoVendas');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const vendasLista = Array.isArray(parsed.vendas) ? parsed.vendas : (Array.isArray(parsed) ? parsed : []);
      const bolos = vendasLista.filter(v => String(v?.nome || '').toLowerCase().includes('bolo de festa') && (Number(v?.peso) || 0) >= 2);
      if (!bolos.length) return;
      const od = parsed.orderDetails || {};
      const retirada = od.date ? `${String(od.date).split('-').reverse().join('/')}${od.time ? ' às ' + od.time : ''}` : 'hoje';
      const linhas = bolos.map((b, i) => [
        `🎂 Bolo de festa ${bolos.length > 1 ? i + 1 + ' ' : ''}(${Number(b.peso)} kg)`,
        `Massa: ${parseOptionList(b.massa).join(', ') || '-'}`,
        `Recheio: ${parseOptionList(b.recheio).join(', ') || '-'}`,
        `Cobertura: ${parseOptionList(b.cobertura).join(', ') || '-'}`,
        b.observacao ? `Obs.: ${b.observacao}` : null
      ].filter(Boolean).join('\n'));
      const texto = `Nova encomenda de bolo de festa — retirada ${retirada}\n\n${linhas.join('\n\n')}`;
      window.open(`https://wa.me/${WHATSAPP_AVISOS}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    } catch (e) {
      console.warn('Não foi possível montar o aviso de WhatsApp:', e);
    }
  }

  const handleConfirmRegister = () => {
    avisarBolosFestaWhatsApp();
    // registrar pedido e itens no backend
    (async () => {
      try {
        const raw = localStorage.getItem('resumoVendas');
        if (!raw) {
          alert('Nenhuma venda encontrada no resumo.');
          return;
        }

        const parsed = JSON.parse(raw);
        const vendasPayload = Array.isArray(parsed.vendas) ? parsed.vendas : (Array.isArray(parsed) ? parsed : []);

        if (Array.isArray(vendasPayload) && vendasPayload.length > 5) {
          const totalProdutos = vendasPayload.reduce((acc, venda) => acc + Number(venda.quantidade || 1), 0);
          try {
            await emailApi.post('/resumo', {
              qtdVendas: vendasPayload.length,
              totalProdutos
            });
          } catch (emailErr) {
            console.error('Erro ao enviar email de resumo:', emailErr);
          }
        }

        const tipoVendaResumo = parsed.tipoVenda || (vendasPayload[vendasPayload.length - 1]?.categoriaEntrega) || null;
        const dataReferencia = tipoVendaResumo === 'Encomenda'
          ? (parsed.orderDetails?.date || null)
          : null;

        const heavyPartyCakes = vendasPayload.filter(v => {
          const isBoloFesta = String(v?.nome || '').toLowerCase().includes('bolo de festa');
          const peso = Number(v?.peso) || 0;
          return isBoloFesta && peso >= 2;
        });

        for (const bolo of heavyPartyCakes) {
          await notifyHeavyPartyCake(bolo, dataReferencia);
        }

        // montar payload do pedido
        const now = new Date();
        const formatDateTime = (dt) => {
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          const hh = String(dt.getHours()).padStart(2, '0');
          const min = String(dt.getMinutes()).padStart(2, '0');
          const ss = String(dt.getSeconds()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        };

        const clienteId = clienteIdLocal || parsed.orderDetails?.clientId || parsed.clienteId || null;

        // obter usuarioId do localStorage (chave 'usuario') quando disponível
        let usuarioIdFromStorage = null;
        try {
          const rawUser = localStorage.getItem('usuario');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            usuarioIdFromStorage = u?.id || null;
          }
        } catch (e) {
          console.warn('Erro ao ler usuario do localStorage:', e);
        }

        // determine dataRetirada: use parsed.orderDetails.date/time (encomenda) when available, else use now
        let retiradaDate = now;
        try {
          const od = parsed.orderDetails;
          if (od && od.date) {
            // od.date expected format: YYYY-MM-DD; od.time expected: HH:MM
            const dateParts = String(od.date).split('-').map(n => Number(n)); // [yyyy, mm, dd]
            const timeParts = String(od.time || '00:00').split(':').map(n => Number(n)); // [hh, mm]
            if (dateParts.length === 3) {
              const [y, m, d] = dateParts;
              const hh = timeParts[0] || 0;
              const mm = timeParts[1] || 0;
              retiradaDate = new Date(y, (m || 1) - 1, d, hh, mm, 0);
            }
          }
        } catch (e) {
          console.warn('Erro ao parsear data de retirada da encomenda, usando data atual', e);
          retiradaDate = now;
        }

        const pedidoPayload = {
          dataPedido: formatDateTime(now),
          dataRetirada: formatDateTime(retiradaDate),
          dataPagamento: formatDateTime(now),
          // prioriza valor salvo em parsed (quando houver), senão usa o select do componente
          formaPagamento: parsed.formaPagamento || formaPagamentoSelect || 'VOUCHER',
          status: parsed.status || statusPedidoSelect || 'CONFIRMADO',
          observacao: parsed.observacao || 'Sem observação',
          usuarioId: usuarioIdFromStorage || parsed.usuarioId || 1,
          clienteId: clienteId || 1
        };

        let respPedido;
        try {
          respPedido = await api.post('/pedidos', pedidoPayload);
        } catch (errPost) {
          console.error('Erro ao criar pedido:', errPost);
          alert('Erro ao criar pedido. Veja o console para mais detalhes.');
          return;
        }

        let pedidoId = respPedido?.data?.id || null;

        // se o POST não retornou id, buscar o pedido mais recente via GET /pedidos
        if (!pedidoId) {
          try {
            let listaResp;
            listaResp = await api.get('/pedidos');

            const lista = Array.isArray(listaResp.data)
              ? listaResp.data
              : (listaResp.data && listaResp.data.content) ? listaResp.data.content : [];

              console.log('Lista de pedidos obtida para busca do mais recente:', lista);
            if (lista.length > 0) {
              // escolher o pedido mais recente: prefere maior id numérico, senão pela data mais recente
              const hasNumericId = lista.every(p => p && p.id !== undefined && !isNaN(Number(p.id)));
              let maisRecente = null;
              if (hasNumericId) {
                maisRecente = lista.reduce((a, b) => (Number(a.id) > Number(b.id) ? a : b));
              } else {
                maisRecente = lista.reduce((a, b) => {
                  const da = new Date(a.dataPedido || a.dataPedidoString || a.dataPedidoAt || 0);
                  const db = new Date(b.dataPedido || b.dataPedidoString || b.dataPedidoAt || 0);
                  return da > db ? a : b;
                });
              }

              pedidoId = maisRecente.id || maisRecente.pedidoId || maisRecente.idPedido;
            }
          } catch (errBusca) {
            console.error('Erro ao buscar pedidos para obter id mais recente:', errBusca);
          }
        }

        if (!pedidoId) {
          console.error('Não foi possível determinar o id do pedido (nem pelo POST, nem pelo GET).', respPedido);
          alert('Pedido criado, mas não foi possível obter o id do pedido. Confira o console.');
          return;
        }

        // obter receitas para mapear nomes -> ids (usado para detalhamentos de bolos de festa)
        let receitasList = [];
        try {
          const respReceitas = await api.get('/receitas');
          receitasList = Array.isArray(respReceitas.data) ? respReceitas.data : (respReceitas.data && respReceitas.data.content) ? respReceitas.data.content : [];
        } catch (errReceitas) {
          console.warn('Não foi possível carregar receitas para detalhamentos:', errReceitas);
          receitasList = [];
        }

        const receitaMap = new Map();
        receitasList.forEach(r => {
          if (r && r.nome) receitaMap.set(String(r.nome).toLowerCase(), r.id);
        });

        // postar itens do pedido
        // tentativa de mapear produtoId quando disponível em cada venda
        for (const v of vendasPayload) {
          const isBolo = v.nome && String(v.nome).toLowerCase().includes('festa');
          const itemPayload = {
            pedidoId: pedidoId,
            // para bolos de festa, o fkProduto deve ser 1 conforme solicitado
            produtoId: isBolo ? 1 : (v.produtoId || v.produto?.id || null),
            quantidade: Number(v.quantidade || 1),
            peso: isBolo ? (Number(v.peso) || 0) : (Number(v.peso) || 1000.0)
          };

          // para bolo de festa, passar o preço informado pelo usuário como precoUnitario
          if (isBolo) {
            itemPayload.precoUnitario = Number(v.valorFinal || 0);
          }

          // enviar item (usa /api/itens-pedido) e capturar id retornado para detalhamentos
          let itemId = null;
          try {
            const itemResp = await api.post('/itens-pedido', itemPayload);
            // tentar extrair id conforme diferentes formatos de API
            itemId = itemResp?.data?.id || itemResp?.data?.itemId || itemResp?.data?.idItem || null;
          } catch (err) {
            console.error('Erro ao criar item do pedido:', err, 'payload:', itemPayload);
            // continuar com os próximos itens mesmo se um falhar
            itemId = null;
          }

          // se for bolo de festa, inserir detalhamentos (massa, recheio, cobertura)
          if (isBolo && itemId) {
            // assumimos que os campos v.massa, v.recheio e v.cobertura podem vir como strings separadas por ' | '
            const pickFirst = (s) => {
              if (!s) return null;
              if (Array.isArray(s)) return String(s[0] || '').trim();
              return String(s).split('|')[0].trim();
            };

            const massaName = pickFirst(v.massa);
            const recheioName = pickFirst(v.recheio);
            const coberturaName = pickFirst(v.cobertura);

            const findReceitaId = (name) => {
              if (!name) return null;
              const key = name.toLowerCase();
              if (receitaMap.has(key)) return receitaMap.get(key);
              // tentativa mais flexível: procurar por inclusão
              const found = receitasList.find(r => String(r.nome || '').toLowerCase().includes(key) || key.includes(String(r.nome || '').toLowerCase()));
              return found?.id || null;
            };

            const detalhar = async (fkReceita, observacao) => {
              if (!fkReceita) return;
              const detalhePayload = {
                fkItemPedido: itemId,
                fkReceita: fkReceita,
                observacao: observacao
              };
              try {
                await api.post('/detalhamentos-pedidos', detalhePayload);
              } catch (errDetal) {
                console.error('Erro ao criar detalhamento do pedido:', errDetal, 'payload:', detalhePayload);
                // não interrompe o fluxo
              }
            };

            const massaId = findReceitaId(massaName);
            const recheioId = findReceitaId(recheioName);
            const coberturaId = findReceitaId(coberturaName);

            // Criar um detalhamento para cada categoria (quando disponível)
            if (massaId) await detalhar(massaId, 'Massa');
            if (recheioId) await detalhar(recheioId, 'Recheio');
            if (coberturaId) await detalhar(coberturaId, 'Cobertura');
          }
        }

        // sucesso
        localStorage.removeItem('resumoVendas');
        setVendas([]);
        
        // Mostrar pop-up de sucesso
        setShowSuccessPopup(true);
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
          window.location.href = '/registro-vendas';
        }, 1000);
      } catch (err) {
        console.error('Erro ao registrar pedido:', err);
        alert('Ocorreu um erro ao registrar o pedido. Veja o console para detalhes.');
      }
    })();
  };

  return (
    <div className={styles.containerResumoVendas}>
      <Navbar logado={true} />
      
      <SuccessPopup 
        show={showSuccessPopup}
        message="Pedido e itens registrados com sucesso!"
        onClose={() => setShowSuccessPopup(false)}
      />
      
      <div className={styles.headerContainer}>
        <button 
          className={styles.voltarButton}
          onClick={handleVoltar}
        >
          <FaArrowLeft size={12} style={{ marginRight: 6 }} />
          Voltar
        </button>

        <h1 className={styles.pageTitle}>Resumo da Venda</h1>
      </div>
      

      <div className={styles.contentResumoVendas}>

        <div className={styles.leftContent}>
              <div className={styles.tabelaContainer}>
                    <table className={styles.tabela}>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Massa</th>
                          <th>Peso</th>
                          <th>Recheio</th>
                          <th>Cobertura</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendas.map((v, idx) => (
                          <tr key={idx}>
                            <td>{v.nome}</td>
                            <td>{v.massa || "Padrão"}</td>
                            <td>{v.peso || "Padrão"}</td>
                            <td>{(v.recheio || "Padrão").replace(/\|/g, "\n")}</td>
                            <td>{v.cobertura || "Padrão"}</td>
                            <td>R$ {v.valorFinal || "Padrão"},00</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </div>
                   {/* <button className={styles.btnDownload} onClick={handleDownload}>
                            Fazer Download
                            </button>  */}
          </div>
          <div className={styles.rightContent}>
            <div className={styles.filtros}>
                        <h1>Resumo</h1>
                        <div className={styles.filtroItem}>
                          <div className={styles.qtdVendas}>
                            <label>Itens: </label> <label> {vendas.length} </label> <br />
                          </div>
                          <div className={styles.tipoVenda}>
                            <label>Tipo Venda: </label> <label> {vendas.length > 0 ? vendas[vendas.length - 1].categoriaEntrega : "N/A"}</label> <br />
                          </div>
                          <div className={styles.nomeCliente}>
                            <label>CPF do cliente (Opcional):</label>
                            <input
                              type="text"
                              placeholder="000.000.000-00"
                              value={clienteCpfInput}
                              onChange={e => {
                                const val = e.target.value;
                                const masked = formatCpf(val);
                                setClienteCpfInput(masked);
                                if (!masked || normalizeDigits(masked).length < 11) setClienteIdLocal(null);
                              }}
                              onBlur={e => {
                                const val = e.target.value;
                                // se for Pronta-Entrega e foi informado CPF, buscar cliente para preencher clienteId
                                const tipo = resumoParsed?.tipoVenda || (vendas.length > 0 ? vendas[vendas.length - 1].categoriaEntrega : null);
                                if (tipo === 'Pronta-Entrega' && val && normalizeDigits(val).length >= 11) {
                                  fetchClientByCpfResumo(val);
                                }
                              }}
                            />
                          </div>
                          <div className={styles.formaPagamento} style={{ marginTop: 8 }}>
                            <label>Forma de Pagamento:</label>
                            <select
                              value={formaPagamentoSelect}
                              onChange={e => setFormaPagamentoSelect(e.target.value)}
                              style={{ width: '100%', padding: 8, marginTop: 6 }}
                            >
                              <option value="DINHEIRO">Dinheiro</option>
                              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                              <option value="CARTAO_DEBITO">Cartão de Débito</option>
                              <option value="VOUCHER">Voucher</option>
                              <option value="PIX">Pix</option>
                            </select>
                          </div>
                          <div className={styles.statusPedido} style={{ marginTop: 8 }}>
                            <label>Status do Pedido:</label>
                            <select
                              value={statusPedidoSelect}
                              onChange={e => setStatusPedidoSelect(e.target.value)}
                              style={{ width: '100%', padding: 8, marginTop: 6 }}
                            >
                              <option value="CONFIRMADO">Confirmado</option>
                              <option value="PENDENTE_PAGAMENTO">Pagamento Pendente</option>
                              <option value="FINALIZADO">Finalizado</option>
                            </select>
                          </div>
                          <div className={styles.valorTotal}>
                            <label>R$ {vendas.reduce((total, v) => total + (v.valorFinal || 0), 0).toFixed(2).replace('.', ',')}</label>
                          </div>
                          {/* <label>Nome Cliente (opcional):</label>
                          <input type="text" /> */}
                        </div>
                <button className={styles.btnPesquisar} onClick={handleConfirmRegister}>
                  Registrar
                </button>
              </div>
        </div>
      </div>
    </div>
  );

  function formatDateBR(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
}
