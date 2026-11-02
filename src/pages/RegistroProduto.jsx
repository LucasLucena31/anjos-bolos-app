import imagemPadrao from '../assets/bolinho15.png';
import { useEffect, useRef, useState } from 'react';
import api from '../provider/api';
import { FaTrashCan } from "react-icons/fa6";
import { Navbar } from '../components/Navbar';
import { FaArrowLeft } from "react-icons/fa";
import { Modal } from '../components/Modal';
import { ModernToast } from '../components/ModernToast';
import styles from '../styles/RegistroProduto.module.css';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

async function uploadImagemProduto(id, file) {
  if (!id || !file) throw new Error("ID e arquivo são obrigatórios");
  const formData = new FormData();
  formData.append('imagem', file);
  return api.patch(`/produtos/${id}/imagem`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function RegistroProduto(props) {
  useDocumentTitle(props.titulo);
  const imagemInputRef = useRef(null);
  const [toastSucesso, setToastSucesso] = useState(false);
  const [toastErro, setToastErro] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [receita, setreceita] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidadeMedida, setUnidade] = useState('g');
  const [listareceitas, setListareceitas] = useState([]);
  // Banco de receitas existentes
  const [receitasBanco, setReceitasBanco] = useState([]);
  const [carregandoReceitas, setCarregandoReceitas] = useState(false);
  const [erroReceitas, setErroReceitas] = useState('');
  const [receitaSelecionadaId, setReceitaSelecionadaId] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState('');
  // Lista de categorias vindo do backend
  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);
  const [erroCategorias, setErroCategorias] = useState('');
  const [valor, setValor] = useState('');
  const [custo, setCusto] = useState(0.00);
  const [imagem, setImagem] = useState(imagemPadrao);
  const [imagemFile, setImagemFile] = useState(null);
  const imagemObjectUrlRef = useRef(null);

  // Estado do modal de criação de receita
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeReceita, setNomeReceita] = useState('');
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredienteSelecionado, setIngredienteSelecionado] = useState('');
  const [quantidadeIngrediente, setQuantidadeIngrediente] = useState('');
  const [tipoReceita, setTipoReceita] = useState('');
  const [carregandoIngredientes, setCarregandoIngredientes] = useState(false);
  const [erroIngredientes, setErroIngredientes] = useState('');
  const [ingredientesReceita, setIngredientesReceita] = useState([]);
  // Detalhes da receita
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [receitaDetalhe, setReceitaDetalhe] = useState(null);
  const [errors, setErrors] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Restaura o formulário para o estado inicial
  function resetForm() {
    setNomeProduto('');
    setCategoria('');
    setValor('');
    setCusto(0.00);
    setListareceitas([]);
    setReceitaSelecionadaId('');
    setQuantidade('');
    setErrors({});

    // Limpa imagem e file input
    if (imagemObjectUrlRef.current) {
      URL.revokeObjectURL(imagemObjectUrlRef.current);
      imagemObjectUrlRef.current = null;
    }
    setImagem(imagemPadrao);
    setImagemFile(null);
    if (imagemInputRef.current) {
      imagemInputRef.current.value = '';
    }
  }

  // Mapeia a medida da API para uma unidadeMedida curta para exibição
  function getUnidadeFromMedida(medidaApi) {
    const s = String(medidaApi || '').toLowerCase();
    if (s.startsWith('gram')) return 'g'; // grama, gramas
    if (s.startsWith('quilo')) return 'kg'; // quilograma
    if (s.startsWith('mili')) return 'ml'; // mililitro, mililitros
    if (s.startsWith('litro')) return 'l'; // litro, litros
    if (s.startsWith('un')) return 'un'; // unidadeMedida, unidades
    return '';
  }

  function mapUnidadeFromApi(unidadeApi) {
    console.log('Mapeando unidade da API:', unidadeApi);
    const u = String(unidadeApi || '').toUpperCase();
    if (u === 'GRAMAS' || u === 'GRAMA') return 'g';
    if (u === 'QUILOGRAMAS' || u === 'QUILOGRAMA') return 'kg';
    if (u === 'MILILITROS' || u === 'MILILITRO') return 'ml';
    if (u === 'LITROS' || u === 'LITRO') return 'l';
    if (u === 'UNIDADES' || u === 'UNIDADE') return 'un';
    return '';
  }

  function mapUnidadeToApi(unidadeCurta) {
    const u = String(unidadeCurta || '').toLowerCase();
    if (u === 'g') return 'GRAMA';
    if (u === 'kg') return 'QUILOGRAMA';
    if (u === 'ml') return 'MILILITRO';
    if (u === 'l') return 'LITRO';
    if (u === 'un') return 'UNIDADE';
    return 'UNIDADE';
  }

  // Mapeia categoria do UI para enum esperado pelo backend
  function mapCategoriaProdutoToApi(cat) {
    const c = String(cat || '').toLowerCase();
    if (c === 'massa') return 'MASSA';
    if (c === 'recheio') return 'RECHEIO';
    if (c === 'cobertura') return 'COBERTURA';
    if (c === 'decoração' || c === 'decoracao') return 'DECORACAO';
    return undefined;
  }

  const salvarReceita = async (e) => {
    e.preventDefault();
    try {
      setErrors({});
      // Preparar e validar campos
      const precoFinal = typeof valor === 'string' ? Number(String(valor).replace(/\./g, '').replace(',', '.')) : Number(valor);
      const custoProducao = typeof custo === 'string' ? Number(String(custo).replace(/\./g, '').replace(',', '.')) : Number(custo);

      // Se `categoria` contém um id (quando populado a partir do backend), buscamos o objeto.
      // Caso o usuário já tenha o id como string no state, também aceitamos.
      const categoriaSelecionada = categorias.find(c => String(c.id) === String(categoria));
      const categoriaIdValue = categoriaSelecionada ? categoriaSelecionada.id : (categoria || null);

      const newErrors = {};
      if (!nomeProduto || !String(nomeProduto).trim()) newErrors.nomeProduto = 'Informe o nome do produto.';
      if (!categoriaIdValue) newErrors.categoria = 'Selecione a categoria do produto.';
      if (!Number.isFinite(precoFinal) || precoFinal <= 0) newErrors.valor = 'Informe um valor válido (maior que 0).';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.warning('Corrija os campos destacados.');
        return;
      }

      setSalvando(true);
      // Sanitiza e mapeia campos conforme o modelo Produto do backend
      // Backend espera: { nome, precoFinal, custoProducao, categoriaProdutoId }
      const payload = {
        nome: nomeProduto || '',
        precoFinal: Number.isFinite(precoFinal) ? precoFinal : 0,
        custoProducao: Number.isFinite(custoProducao) ? custoProducao : 0,
        categoriaProdutoId: Number(categoriaIdValue)
      };

      const resp = await api.post('/produtos', payload);
      const produtoId = resp?.data?.id || resp?.data?.produtoId || resp?.data?.idProduto;

      // Se houver imagem selecionada e tivermos o ID, faz o upload
      if (imagemFile && produtoId) {
        const uploadResp = await uploadImagemProduto(produtoId, imagemFile);
        if (uploadResp.status === 201 || uploadResp.status === 200) {
          setToastMessage('Produto e imagem enviados com sucesso.');
          setToastSucesso(true);
          resetForm();
        } else {
          setToastMessage('Produto criado, mas houve um problema ao enviar a imagem.');
          setToastErro(true);
          resetForm();
        }
      } else if (imagemFile && !produtoId) {
        setToastMessage('Produto criado, mas não foi possível obter o ID para enviar a imagem.');
        setToastErro(true);
        resetForm();
      } else {
        setToastMessage('Produto cadastrado com sucesso.');
        setToastSucesso(true);
        resetForm();
      }
    } catch (err) {
      console.error('Erro ao cadastrar produto ou enviar imagem:', err);
      setToastMessage('Não foi possível cadastrar o produto.');
      setToastErro(true);
    }
    finally {
      setSalvando(false);
    }
  };

  // Buscar categorias do backend para popular o select de categoria
  useEffect(() => {
    const fetchCategorias = async () => {
      setCarregandoCategorias(true);
      setErroCategorias('');
      try {
        // Ajuste a rota abaixo conforme seu backend: /categorias é um exemplo
        const resp = await api.get('/categorias-produtos');
        const dados = Array.isArray(resp.data) ? resp.data : [];
        setCategorias(dados);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        setErroCategorias('Não foi possível carregar as categorias.');
        setCategorias([]);
      } finally {
        setCarregandoCategorias(false);
      }
    };
    fetchCategorias();
  }, []);

  // Abrir modal de criação de receita
  function criarreceita() {
    setModalAberto(true);
  }

  // Buscar ingredientes quando o modal abrir
  useEffect(() => {
    if (!modalAberto) return;
    const fetchIngredientes = async () => {
      setCarregandoIngredientes(true);
      setErroIngredientes('');
      try {
        const resp = await api.get('/ingredientes');
        const dados = Array.isArray(resp.data) ? resp.data : [];
        setIngredientes(dados);

      } catch (err) {
        console.error('Erro ao buscar ingredientes:', err);
        setErroIngredientes('Não foi possível carregar os ingredientes.');
        setIngredientes([]);
      } finally {
        setCarregandoIngredientes(false);
      }
    };
    fetchIngredientes();
  }, [modalAberto]);

  // Carregar receitas existentes (banco) ao montar a página
  useEffect(() => {
    const fetchReceitas = async () => {
      setCarregandoReceitas(true);
      setErroReceitas('');
      try {
        const resp = await api.get('/receitas');
        const dados = Array.isArray(resp.data) ? resp.data : [];
        setReceitasBanco(dados);
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
        setErroReceitas('Não foi possível carregar as receitas.');
        setReceitasBanco([]);
      } finally {
        setCarregandoReceitas(false);
      }
    };
    fetchReceitas();
  }, []);

  // Salvar dados do modal (apenas adiciona na lista por enquanto)
  function confirmarCriacaoReceita(e) {
    e.preventDefault();
    if (!nomeReceita || !tipoReceita) {
      toast.warning('Preencha o nome e o tipo da receita.');
      return;
    }
    if (ingredientesReceita.length === 0) {
      toast.warning('Adicione pelo menos um ingrediente à receita.');
      return;
    }
    const novaReceita = {
      nome: nomeReceita,
      tipo: tipoReceita,
      ingredientes: ingredientesReceita.map(ing => ({
        ingredienteId: ing.ingredienteId,
        nome: ing.nome,
        quantidade: ing.quantidade,
        unidadeMedida: ing.unidadeMedida || ''
      })),
      custoProducao: 0
    };

    const payloadApi = {
      nome: nomeReceita,
      tipo: tipoReceita,
      ingredientes: ingredientesReceita.map(ing => ({
        ingredienteId: isNaN(Number(ing.ingredienteId)) ? ing.ingredienteId : Number(ing.ingredienteId),
        quantidade: Number(ing.quantidade),
        unidadeMedida: mapUnidadeToApi(ing.unidadeMedida)
      }))
    };

    // Enviar para API e usar retorno (se fornecer custoProducao)
    (async () => {
      try {
        const resp = await api.post('/receitas', payloadApi);
        const criado = resp?.data || {};
        if (criado && (typeof criado.custoProducao !== 'undefined')) {
          novaReceita.custoProducao = Number(criado.custoProducao) || 0;
        }
        setToastMessage('Receita registrada com sucesso!');
        setToastSucesso(true);
      } catch (err) {
        console.error('Erro ao registrar receita:', err);
        setToastMessage('Não foi possível registrar a receita. Tente novamente.');
        setToastErro(true);
      } finally {
        setListareceitas(prev => [...prev, novaReceita]);
      }
    })();
    // Resetar e fechar modal
    setNomeReceita('');
    setIngredienteSelecionado('');
    setQuantidadeIngrediente('');
    setTipoReceita('');
    setIngredientesReceita([]);
    setModalAberto(false);
  }

  // Adicionar ingrediente na lista temporária do modal
  function adicionarIngredienteModal() {
    if (!ingredienteSelecionado || !quantidadeIngrediente) {
      toast.warning('Selecione um ingrediente e informe a quantidade.');
      return;
    }
    const ingrediente = ingredientes.find(i => String(i.id) === String(ingredienteSelecionado)) ||
                        ingredientes.find(i => String(i._id) === String(ingredienteSelecionado));
    const novo = {
      ingredienteId: ingrediente?.id || ingrediente?._id || ingredienteSelecionado,
      nome: ingrediente?.nome || '',
      quantidade: Number(quantidadeIngrediente),
      unidadeMedida: getUnidadeFromMedida(ingrediente?.medida)
    };
    setIngredientesReceita(prev => [...prev, novo]);
    setIngredienteSelecionado('');
    setQuantidadeIngrediente('');
  }

  function removerIngredienteModal(index) {
    setIngredientesReceita(prev => prev.filter((_, i) => i !== index));
  }

  // Confirmação ao cancelar o modal de criação de receita
  function handleCancelarModal() {
    const hasDados =
      (nomeReceita && nomeReceita.trim() !== '') ||
      (tipoReceita && tipoReceita.trim() !== '') ||
      ingredientesReceita.length > 0 ||
      (ingredienteSelecionado && String(ingredienteSelecionado).trim() !== '') ||
      (quantidadeIngrediente && String(quantidadeIngrediente).trim() !== '');

    if (!hasDados) {
      setModalAberto(false);
      return;
    }

    const confirmar = window.confirm('Deseja cancelar a criação desta receita? As informações preenchidas serão perdidas.');
    if (confirmar) {
      setNomeReceita('');
      setIngredienteSelecionado('');
      setQuantidadeIngrediente('');
      setTipoReceita('');
      setIngredientesReceita([]);
      setModalAberto(false);
    }
  }

  function adicionarreceita() {
    if (!receitaSelecionadaId) {
      toast.warning('Selecione uma receita.');
      return;
    }
    const qtd = quantidade === '' ? 1 : Number(quantidade);
    if (!Number.isFinite(qtd) || qtd < 1) {
      toast.warning('Informe a quantidade de receitas (mínimo 1).');
      return;
    }
    const selecionada = receitasBanco.find(r => String(r.id) === String(receitaSelecionadaId));
    if (!selecionada) {
      toast.error('Receita não encontrada.');
      return;
    }

    // Normaliza para o formato usado na lista local
    const entrada = {
      nome: selecionada.nome,
      ingredientes: Array.isArray(selecionada.ingredientes)
        ? selecionada.ingredientes.map((ing) => ({
            ingredienteId: ing.ingredienteId,
            nome: ing.nome || '',
            quantidade: ing.quantidade,
            unidadeMedida: mapUnidadeFromApi(ing.unidadeMedida)
          }))
        : [],
      custoProducao: Number(selecionada.custoProducao) || 0,
      tipo: selecionada.tipoReceita || selecionada.tipo || ''
    };


    // Adiciona a quantidade solicitada de receitas (cada unidade carrega seu custoProducao)
    const entradas = Array.from({ length: qtd }, () => ({ ...entrada }));

    setListareceitas(prev => [...prev, ...entradas]);
    setReceitaSelecionadaId('');
    setQuantidade('');
  }

  function removerreceita(index) {
    setListareceitas(listareceitas.filter((_, i) => i !== index));
  }

  function abrirDetalhes(item) {
    setReceitaDetalhe(item);
    setDetalheAberto(true);
    console.log(item.ingredientes)
  }

  // Recalcula automaticamente o custo de produção total baseado nas receitas adicionadas
  useEffect(() => {
    try {
      const total = (listareceitas || []).reduce((s, r) => {
        const c = Number(r.custoProducao || r.custo || 0);
        return s + (Number.isFinite(c) ? c : 0);
      }, 0);
      setCusto(total);
    } catch (err) {
      console.error('Erro ao recalcular custo de produção:', err);
    }
  }, [listareceitas]);

  function handleImagem(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImagemFile(file);
      // Libera URL anterior se existir
      if (imagemObjectUrlRef.current) {
        URL.revokeObjectURL(imagemObjectUrlRef.current);
        imagemObjectUrlRef.current = null;
      }
      const url = URL.createObjectURL(file);
      imagemObjectUrlRef.current = url;
      setImagem(url);
    }
  }

  // Cleanup do ObjectURL ao desmontar
  useEffect(() => {
    return () => {
      if (imagemObjectUrlRef.current) {
        URL.revokeObjectURL(imagemObjectUrlRef.current);
      }
    };
  }, []);

  function incrementarQuantidade() {
    setQuantidade(q => {
      const current = q === '' ? 0 : Number(q);
      return current + 1;
    });
  }

  function decrementarQuantidade() {
    setQuantidade(q => {
      const current = q === '' ? 1 : Number(q);
      return Math.max(1, current - 1);
    });
  }

  function handleVoltar() {
    window.location.href = '/catalogo-produtos';
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar logado={true} activePage="produtos" />
      
      <div className={styles.headerContainer}>
        <button 
          className={styles.voltarButton}
          onClick={handleVoltar}
        >
          <FaArrowLeft size={12} style={{ marginRight: 6 }} />
          Voltar
        </button>
      </div>
      
      <h1 className={styles.pageTitle}>Registro de Produto</h1>
      
      <div className={styles.mainContainer}>
        <div className={styles.formContainer}>
          {/* Seção de Adição de receita */}
          <div className={styles.receitaSection}>
            <h2 className={styles.sectionTitle}>Adição de Receita</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Receita:</label>
              <select
                className={styles.select}
                value={receitaSelecionadaId}
                onChange={(e) => setReceitaSelecionadaId(e.target.value)}
              >
                <option value="" disabled>{carregandoReceitas ? 'Carregando...' : 'Selecione uma receita'}</option>
                {erroReceitas && <option value="" disabled>{erroReceitas}</option>}
                {!carregandoReceitas && !erroReceitas && receitasBanco.map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Quantidade:</label>
              <div className={styles.quantidadeContainer}>
                  <input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        setQuantidade('');
                      } else {
                        setQuantidade(Number(value));
                      }
                    }}
                    className={styles.input}
                    style={{ width: '100px' }}
                    placeholder="Valor"
                  />
              </div>
            </div>
            
            <button 
              onClick={adicionarreceita}
              className={styles.adicionarButton}
              type="button"
            >
              Adicionar
            </button>
            <button 
              onClick={criarreceita}
              className={styles.adicionarButton}
              type="button"
            >
              Criar receita
            </button>
          </div>
          
          {/* Seção de Dados do Produto */}
          <div className={styles.produtoSection}>
            <div className={styles.produtoTop}>
              <div className={styles.produtoInputs}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nome do Produto:</label>
                  <input
                    type="text"
                    value={nomeProduto}
                    onChange={e => setNomeProduto(e.target.value)}
                    className={`${styles.input} ${errors.nomeProduto ? styles.inputError : ''}`}
                  />
                  {errors.nomeProduto && <div className={styles.errorMessage}>{errors.nomeProduto}</div>}
                </div>
                
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Valor:</label>
                    <input
                      type="text"
                      value={valor}
                      onChange={e => setValor(e.target.value)}
                      className={`${styles.input} ${errors.valor ? styles.inputError : ''}`}
                    />
                    {errors.valor && <div className={styles.errorMessage}>{errors.valor}</div>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Custo de Produção:</label>
                    <input
                      type="text"
                      value={typeof custo === 'number' ? custo.toFixed(2) : (custo || '0.00')}
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '' || raw === null) {
                          setCusto(0.00);
                          return;
                        }
                        // aceitar vírgula ou ponto; remover outros caracteres
                        const normalized = String(raw).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
                        const num = parseFloat(normalized);
                        setCusto(Number.isNaN(num) ? 0.00 : num);
                      }}
                      className={`${styles.input} ${errors.custo ? styles.inputError : ''}`}
                    />
                    {errors.custo && <div className={styles.errorMessage}>{errors.custo}</div>}
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Categoria:</label>
                    <select
                      value={categoria}
                      onChange={e => setCategoria(e.target.value)}
                      className={`${styles.select} ${errors.categoria ? styles.inputError : ''}`}
                    >
                      <option value="" disabled>{carregandoCategorias ? 'Carregando...' : 'Selecione a categoria'}</option>
                      {erroCategorias && <option value="" disabled>{erroCategorias}</option>}
                      {!carregandoCategorias && !erroCategorias && categorias.map((c) => (
                        // Espera { id, nome }
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    {errors.categoria && <div className={styles.errorMessage}>{errors.categoria}</div>}
                  </div>
                </div>
              </div>
              
              <div className={styles.imagemSection}>
                <label className={styles.label}>Imagem (opcional):</label>
                <div className={styles.imagemContainer}>
                  <div className={styles.imagemPreview}>
                    {imagem ? (
                      <img src={imagem} alt="Produto" className={styles.imagemDisplay} />
                    ) : (
                      <div className={styles.imagemPlaceholder}></div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagem}
                    id="imagem-produto"
                    className={styles.imagemInput}
                    ref={imagemInputRef}
                  />
                  <label htmlFor="imagem-produto" className={styles.escolherButton}>
                    Escolher
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.receitasLista}>
              <label className={styles.label}>Lista de receitas:</label>
              <div className={styles.receitasTable}>
                {listareceitas.map((item, idx) => {
                  const isRecipe = Array.isArray(item.ingredientes);
                  return (
                    <div key={idx} className={styles.receitaItem} onClick={() => abrirDetalhes(item)} style={{ cursor: 'pointer' }}>
                      <span className={styles.receitaNome}>
                        • {item.nome} {isRecipe && item.tipo ? `(${String(item.tipo).charAt(0).toUpperCase() + String(item.tipo).slice(1)})` : ''}
                      </span>
                      <span className={styles.receitaQuantidade}>
                        {isRecipe ? `${item.ingredientes?.length || 0} ${((item.ingredientes?.length || 0) === 1) ? 'item' : 'itens'}` : `${item.quantidade} ${item.unidadeMedida}`}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removerreceita(idx); }}
                        className={styles.removerButton}
                        type="button"
                      >
                        <FaTrashCan />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className={styles.buttonContainer}>
              <button className={styles.cadastrarButton} onClick={salvarReceita} type="button" disabled={salvando}>
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de criação de receita */}
  <Modal isOpen={modalAberto} onClose={handleCancelarModal}>
        <div style={{ padding: '28px', width: '480px', maxWidth: '92vw', background: '#f5f1ed', borderRadius: '15px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.35rem', fontWeight: 'bold', color: '#663b2b', marginBottom: '20px', textAlign: 'center' }}>Criar Receita</h2>
          <form onSubmit={confirmarCriacaoReceita}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nome da receita</label>
              <input
                type="text"
                value={nomeReceita}
                onChange={(e) => setNomeReceita(e.target.value)}
                className={styles.input}
                placeholder="Ex: Massa de chocolate"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Adicionar ingrediente à receita</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className={styles.select}
                  value={ingredienteSelecionado}
                  onChange={(e) => setIngredienteSelecionado(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="" disabled>{carregandoIngredientes ? 'Carregando...' : 'Selecione um ingrediente'}</option>
                  {erroIngredientes && <option value="" disabled>{erroIngredientes}</option>}
                  {!carregandoIngredientes && !erroIngredientes && ingredientes.map((ing) => (
                    <option key={ing.id || ing._id} value={ing.id || ing._id}>{ing.nome}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className={styles.input}
                  value={quantidadeIngrediente}
                  onChange={(e) => setQuantidadeIngrediente(e.target.value)}
                  placeholder="Qtd"
                  style={{ width: '140px' }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <button type="button" className={styles.adicionarButton} onClick={adicionarIngredienteModal}>
                  Adicionar ingrediente
                </button>
              </div>
            </div>

            {/* Tabela dos ingredientes adicionados */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Ingredientes adicionados</label>
              <div style={{
                background: '#fff',
                border: '2px solid #6b3200',
                borderRadius: 8,
                maxHeight: 180,
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9f7f4' }}>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5ded8', color: '#6b3200' }}>Ingrediente</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5ded8', color: '#6b3200', width: 160 }}>Quantidade</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientesReceita.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '10px', textAlign: 'center', color: '#6b3200' }}>Nenhum ingrediente adicionado</td>
                      </tr>
                    ) : (
                      ingredientesReceita.map((ing, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0ece8', color: '#6b3200' }}>{ing.nome}</td>
                          <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f0ece8', color: '#6b3200' }}>
                            {ing.quantidade}{ing.unidadeMedida || ''}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f0ece8' }}>
                            <button type="button" className={styles.removerButton} onClick={() => removerIngredienteModal(idx)}>
                              <FaTrashCan />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Tipo da receita</label>
              <select
                className={styles.select}
                value={tipoReceita}
                onChange={(e) => setTipoReceita(e.target.value)}
              >
                <option value="" disabled>Selecione o tipo</option>
                <option value="massa">Massa</option>
                <option value="recheio">Recheio</option>
                <option value="cobertura">Cobertura</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className={styles.adicionarButton} onClick={handleCancelarModal} style={{ flex: 1 }}>Cancelar</button>
              <button type="submit" className={styles.adicionarButton} style={{ flex: 1 }}>Salvar</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de detalhes da receita */}
      <Modal isOpen={detalheAberto} onClose={() => setDetalheAberto(false)}>
        <div style={{ padding: '28px', width: '480px', maxWidth: '92vw', background: '#f5f1ed', borderRadius: '15px' }}>
          {receitaDetalhe && (
            <>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.35rem', fontWeight: 'bold', color: '#663b2b', marginBottom: '20px', textAlign: 'center' }}>
                Detalhes: {receitaDetalhe.nome} {Array.isArray(receitaDetalhe.ingredientes) && receitaDetalhe.tipo ? `(${String(receitaDetalhe.tipo).charAt(0).toUpperCase() + String(receitaDetalhe.tipo).slice(1)})` : ''}
              </h2>

              {Array.isArray(receitaDetalhe.ingredientes) ? (
                <div>
                  <div style={{
                    background: '#fff',
                    border: '2px solid #6b3200',
                    borderRadius: 8,
                    maxHeight: 260,
                    overflowY: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9f7f4' }}>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5ded8', color: '#6b3200' }}>Ingrediente</th>
                          <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5ded8', color: '#6b3200', width: 180 }}>Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receitaDetalhe.ingredientes.map((ing, i) => (
                          <tr key={i}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f0ece8', color: '#6b3200' }}>{ing.nome || `${ing.nome}`}</td>
                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f0ece8', color: '#6b3200' }}>{ing.quantidade}{ing.unidadeMedida || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fff',
                  border: '2px solid #6b3200',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', color: '#6b3200' }}>
                    <span>Ingrediente</span>
                    <span>Quantidade</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', color: '#6b3200', borderTop: '1px solid #f0ece8' }}>
                    <span>{receitaDetalhe.nome}</span>
                    <span>{receitaDetalhe.quantidade}{receitaDetalhe.unidadeMedida}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" className={styles.adicionarButton} onClick={() => setDetalheAberto(false)} style={{ flex: 1 }}>Fechar</button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ModernToast 
        isOpen={toastSucesso}
        message={toastMessage}
        type="success"
        duration={1500}
      />

      <ModernToast 
        isOpen={toastErro}
        message={toastMessage}
        type="error"
        duration={1500}
      />
    </div>
  );
}