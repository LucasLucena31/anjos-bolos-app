import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { CatalogHeader } from "../components/CatalogHeader";
import { SearchBar } from "../components/SearchBar";
import { FilterSection } from "../components/FilterSection";
import { DataTable } from "../components/DataTable";
import { AdvancedFilter } from "../components/AdvancedFilter";
import styles from "../styles/CatalogoProdutos.module.css";
import { useEffect } from "react";
import api from "../provider/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useSearchParams } from "react-router-dom";


export function CatalogoProdutos(props) {
    useDocumentTitle(props.titulo);
    const [searchParams] = useSearchParams();
    const [produtos, setProdutos] = useState([]);
    const [produtosOriginais, setProdutosOriginais] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
    const [filtroOrdenacao, setFiltroOrdenacao] = useState('');
    const pageSize = 10;

    const fetchProdutos = async (ordenacao = filtroOrdenacao) => {
        setLoading(true);
        try {
            
            let url = `/produtos`;
            
            // Adicionar ordenação
            if (ordenacao) {
                url += `?sort=${ordenacao}`;
            } else {
                url += `?sort=nome,asc`;
            }
            
            const response = await api.get(url);
            
            // Verificar se é um array ou objeto com propriedade content
            let dadosRecebidos;
            if (Array.isArray(response.data)) {
                dadosRecebidos = response.data;
            } else if (response.data.content && Array.isArray(response.data.content)) {
                dadosRecebidos = response.data.content;
            } else {
                dadosRecebidos = [];
            }
            
            setProdutosOriginais(dadosRecebidos);
            setProdutos(dadosRecebidos);
            setTotalPages(Math.ceil(dadosRecebidos.length / pageSize));
            setCurrentPage(0);
            console.log('Produtos carregados:', dadosRecebidos);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            setProdutos([]);
            setProdutosOriginais([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProdutos();
    }, []);

    // useEffect para ler o parâmetro 'nome' da URL e setar no searchTerm
    useEffect(() => {
        const nomeProduto = searchParams.get('nome');
        if (nomeProduto && produtosOriginais.length > 0) {
            setSearchTerm(nomeProduto);
            filtrarProdutosLocalmente(nomeProduto, categoriasSelecionadas);
        }
    }, [searchParams, produtosOriginais]);

    // Função para filtrar produtos localmente
    const filtrarProdutosLocalmente = (termo, categorias) => {
        let produtosFiltrados = produtosOriginais;

        // Filtrar por termo de busca
        if (termo && termo.trim() !== '') {
            const termoLower = termo.toLowerCase().trim();
            produtosFiltrados = produtosFiltrados.filter(produto =>
                produto.nome.toLowerCase().includes(termoLower)
            );
        }

        // Filtrar por categorias selecionadas
        if (categorias && categorias.length > 0) {
            produtosFiltrados = produtosFiltrados.filter(produto => {
                const categoriaProduto = produto.categoriaProduto || produto.categoria || '';
                return categorias.some(categoria => {
                    // Mapear IDs dos filtros para nomes das categorias
                    const mapeamento = {
                        'bolosTradicionais': 'Bolo Tradicional',
                        'bebidas': 'Bebida',
                        'salgados': 'Salgados',
                        'bolosPote': 'Bolo de pote',
                        'bolosFesta': 'Bolo de Festa'
                    };
                    return categoriaProduto === mapeamento[categoria];
                });
            });
        }
        
        setProdutos(produtosFiltrados);
        const novoTotalPages = Math.ceil(produtosFiltrados.length / pageSize);
        setTotalPages(novoTotalPages);
        
        // Se a página atual for maior que o total de páginas, voltar para a primeira
        if (currentPage >= novoTotalPages && novoTotalPages > 0) {
            setCurrentPage(0);
        } else if (novoTotalPages === 0) {
            setCurrentPage(0);
        }
    };

    // Função para obter produtos da página atual
    const getProdutosPaginados = () => {
        if (!produtos || produtos.length === 0) {
            return [];
        }
        
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return produtos.slice(startIndex, endIndex);
    };

    // useEffect para busca e filtros locais em tempo real
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            filtrarProdutosLocalmente(searchTerm, categoriasSelecionadas);
        }, 150); // 150ms de delay para evitar muitas execuções

        return () => clearTimeout(timeoutId);
    }, [searchTerm, categoriasSelecionadas, produtosOriginais]);

    // useEffect para reaplicar ordenação após filtros
    useEffect(() => {
        if (filtroOrdenacao && produtos.length > 0) {
            const timeoutId = setTimeout(() => {
                aplicarOrdenacaoLocal(filtroOrdenacao);
            }, 200); // Pequeno delay para dar tempo do filtro terminar

            return () => clearTimeout(timeoutId);
        }
    }, [filtroOrdenacao]); // Removida dependência produtos.length para evitar loop

    // Dados mockados da tabela para produtos
    // const produtos = [
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" },
    //     { produto: "Bolo de Cenoura", categoria: "Bolo da Vovó", custoProducao: "R$ 10,00", valorVenda: "R$ 10,00", lucro: "R$ 10,00" }
    // ];

    // Opções do seletor
    const selectOptions = [
        { value: "produtos", label: "Produtos" },
        { value: "ingredientes", label: "Ingredientes" }
    ];

    // Filtros disponíveis
    const filters = [
        { id: 'bolosTradicionais', label: 'Bolos Tradicionais', colorClass: 'bolosTradicionais' },
        { id: 'bebidas', label: 'Bebidas', colorClass: 'bebidas' },
        { id: 'salgados', label: 'Salgados', colorClass: 'salgados' },
        { id: 'bolosPote', label: 'Bolos de pote', colorClass: 'bolosPote' },
        { id: 'bolosFesta', label: 'Bolos de Festa', colorClass: 'bolosFesta' }
    ];

    // Headers da tabela
    const tableHeaders = ["Produto", "Categoria", "Custo de Produção", "Preço Final", "Lucro"];

    const handleCategoriaChange = (categoria) => {
        setCategoriasSelecionadas(prev => {
            const novasCategorias = prev.includes(categoria)
                ? prev.filter(c => c !== categoria)
                : [...prev, categoria];
            
            // O filtro será aplicado pelo useEffect
            return novasCategorias;
        });
    };
   
    const handleSelectChange = (value) => {
        if (value === 'produtos') {
            window.location.href = '/catalogo-produtos';
        } else if (value === 'ingredientes') {
            window.location.href = '/catalogo-ingredientes';
        }
    };

    const handleButtonClick = () => {
        window.location.href = '/registro-produto';
    };

    const handleFilterChange = (filtro) => {
        setFiltroOrdenacao(filtro);
        console.log('Filtro selecionado:', filtro);
        
        // Aplicar ordenação localmente primeiro
        aplicarOrdenacaoLocal(filtro);
    };

    // Função para aplicar ordenação localmente
    const aplicarOrdenacaoLocal = (filtro) => {
        setProdutos(produtosAtuais => {
            let produtosOrdenados = [...produtosAtuais];
            
            switch(filtro) {
                case 'alfabetica-asc':
                    produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
                    break;
                case 'alfabetica-desc':
                    produtosOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
                    break;
                case 'preco-baixo':
                    produtosOrdenados.sort((a, b) => (a.precoFinal || 0) - (b.precoFinal || 0));
                    break;
                case 'preco-alto':
                    produtosOrdenados.sort((a, b) => (b.precoFinal || 0) - (a.precoFinal || 0));
                    break;
                case 'lucro-baixo':
                    produtosOrdenados.sort((a, b) => {
                        const lucroA = (a.precoFinal || 0) - (a.custoProducao || 0);
                        const lucroB = (b.precoFinal || 0) - (b.custoProducao || 0);
                        return lucroA - lucroB;
                    });
                    break;
                case 'lucro-alto':
                    produtosOrdenados.sort((a, b) => {
                        const lucroA = (a.precoFinal || 0) - (a.custoProducao || 0);
                        const lucroB = (b.precoFinal || 0) - (b.custoProducao || 0);
                        return lucroB - lucroA;
                    });
                    break;
                default:
                    produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
            }
            
            // Recalcular paginação após ordenação
            const novoTotalPages = Math.ceil(produtosOrdenados.length / pageSize);
            setTotalPages(novoTotalPages);
            
            return produtosOrdenados;
        });
        
        setCurrentPage(0); // Voltar para primeira página após ordenação
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (termo) => {
        setSearchTerm(termo);
        // O filtro será aplicado pelo useEffect
    };

    const renderTableRow = (produto) => {
        // Calculando o lucro baseado nos dados do banco (precoFinal - custoProducao)
        const lucro = produto.precoFinal && produto.custoProducao 
            ? produto.precoFinal - produto.custoProducao 
            : 0;

        return (
            <>
                <div className={styles.tableCell}>{produto.nome}</div>
                <div className={styles.tableCell}>
                    {produto.categoriaProduto || produto.categoria || "-"}
                </div>
                <div className={styles.tableCell}>
                    {produto.custoProducao !== undefined
                        ? `R$ ${Number(produto.custoProducao).toFixed(2).replace('.', ',')}`
                        : "-"}
                </div>
                <div className={styles.tableCell}>
                    {produto.precoFinal !== undefined
                        ? `R$ ${Number(produto.precoFinal).toFixed(2).replace('.', ',')}`
                        : "-"}
                </div>
                <div className={styles.tableCell}>
                    {lucro !== undefined
                        ? `R$ ${Number(lucro).toFixed(2).replace('.', ',')}`
                        : "-"}
                </div>
            </>
        );
    };

    return (
        <div className={styles.container}>
            <Navbar logado={true} />
            
            <CatalogHeader
                options={selectOptions}
                defaultValue="produtos"
                onSelectChange={handleSelectChange}
                buttonText="Registrar Produto"
                onButtonClick={handleButtonClick}
            />

            <SearchBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                placeholder="Pesquise um produto"
            />

            <FilterSection
                filters={filters}
                selectedCategories={categoriasSelecionadas}
                onCategoryChange={handleCategoriaChange}
                onAdvancedFilterChange={handleFilterChange}
            />

            <DataTable
                headers={tableHeaders}
                data={getProdutosPaginados()}
                renderRow={renderTableRow}
                currentPage={currentPage}
                totalPages={totalPages}
                loading={loading}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                onPageClick={handlePageClick}
            />

            {loading && (
                <div className={styles.loadingContainer}>
                    <p>Carregando produtos...</p>
                </div>
            )}
        </div>
    )
}