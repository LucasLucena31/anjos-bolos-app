import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { CatalogHeader } from "../components/CatalogHeader";
import { SearchBar } from "../components/SearchBar";
import { DataTable } from "../components/DataTable";
import styles from "../styles/CatalogoProdutos.module.css";
import api from "../provider/api";
import { AdvancedFilterIngredientes } from "../components/AdvancedFilterIngredientes";
import { useEffect } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function CatalogoIngredientes(props) {
    useDocumentTitle(props.titulo);
    const [ingredientes, setIngredientes] = useState([]);
    const [ingredientesOriginais, setIngredientesOriginais] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filtroOrdenacao, setFiltroOrdenacao] = useState('');
    const pageSize = 10;

    const fetchIngredientes = async (ordenacao = filtroOrdenacao) => {
        setLoading(true);
        try {
            // Buscar TODOS os ingredientes para permitir filtros locais
            let url = `/ingredientes`;
            
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
            
            setIngredientesOriginais(dadosRecebidos);
            setIngredientes(dadosRecebidos);
            setTotalPages(Math.ceil(dadosRecebidos.length / pageSize));
            setCurrentPage(0);
            console.log('Ingredientes carregados:', dadosRecebidos);
        } catch (error) {
            console.error("Erro ao buscar ingredientes:", error);
            setIngredientes([]);
            setIngredientesOriginais([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngredientes();
    }, []);

    // Função para filtrar ingredientes localmente
    const filtrarIngredientesLocalmente = (termo) => {
        let ingredientesFiltrados = ingredientesOriginais;

        // Filtrar por termo de busca se houver
        if (termo && termo.trim() !== '') {
            const termoLower = termo.toLowerCase().trim();
            ingredientesFiltrados = ingredientesOriginais.filter(ingrediente =>
                ingrediente.nome.toLowerCase().includes(termoLower)
            );
        }
        
        setIngredientes(ingredientesFiltrados);
        const novoTotalPages = Math.ceil(ingredientesFiltrados.length / pageSize);
        setTotalPages(novoTotalPages);
        
        // Resetar para primeira página sempre que aplicar filtro
        setCurrentPage(0);
    };

    // Função para obter ingredientes da página atual
    const getIngredientesPaginados = () => {
        if (!ingredientes || ingredientes.length === 0) {
            return [];
        }
        
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return ingredientes.slice(startIndex, endIndex);
    };

    // useEffect para busca local em tempo real com pequeno debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            filtrarIngredientesLocalmente(searchTerm);
        }, 150); // 150ms de delay para evitar muitas execuções

        return () => clearTimeout(timeoutId);
    }, [searchTerm, ingredientesOriginais]);

    // useEffect para reaplicar ordenação após filtros
    useEffect(() => {
        if (filtroOrdenacao && ingredientes.length > 0) {
            const timeoutId = setTimeout(() => {
                aplicarOrdenacaoLocal(filtroOrdenacao);
            }, 200); // Pequeno delay para dar tempo do filtro terminar

            return () => clearTimeout(timeoutId);
        }
    }, [ingredientes.length, filtroOrdenacao]);

    // Opções do seletor
    const selectOptions = [
        { value: "produtos", label: "Produtos" },
        { value: "ingredientes", label: "Ingredientes" }
    ];

    // Headers da tabela
    const tableHeaders = ["Ingrediente", "Custo por Medida"];

    const handleSelectChange = (value) => {
        if (value === 'produtos') {
            window.location.href = '/catalogo-produtos';
        } else if (value === 'ingredientes') {
            window.location.href = '/catalogo-ingredientes';
        }
    };

    const handleButtonClick = () => {
        window.location.href = '/registro-ingredientes';
    };

    const handleFilterChange = (filtro) => {
        setFiltroOrdenacao(filtro);
        console.log('Filtro selecionado:', filtro);
        
        // Aplicar ordenação localmente aos dados atuais (filtrados)
        aplicarOrdenacaoLocal(filtro);
    };

    // Função para aplicar ordenação localmente
    const aplicarOrdenacaoLocal = (filtro) => {
        setIngredientes(ingredientesAtuais => {
            let ingredientesOrdenados = [...ingredientesAtuais];
            
            switch(filtro) {
                case 'alfabetica-asc':
                    ingredientesOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
                    break;
                case 'alfabetica-desc':
                    ingredientesOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
                    break;
                case 'preco-baixo':
                    ingredientesOrdenados.sort((a, b) => (a.custoMedida || 0) - (b.custoMedida || 0));
                    break;
                case 'preco-alto':
                    ingredientesOrdenados.sort((a, b) => (b.custoMedida || 0) - (a.custoMedida || 0));
                    break;
                default:
                    ingredientesOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
            }
            
            return ingredientesOrdenados;
        });
        
        setCurrentPage(0); // Voltar para primeira página após ordenação
    };

    const handleSearchChange = (termo) => {
        setSearchTerm(termo);
        // A busca será executada pelo useEffect com debounce
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

    const renderTableRow = (ingrediente) => {
        return (
            <>
                <div className={styles.tableCell}>{ingrediente.nome}</div>
                <div className={styles.tableCell}>{
                    ingrediente.custoMedida !== undefined
                        ? `R$ ${Number(ingrediente.custoMedida).toFixed(2).replace('.', ',')}`
                        : "-"
                }</div>
            </>
        );
    };

    return (
        <div className={styles.container}>
            <Navbar logado={true} />

            <CatalogHeader
                options={selectOptions}
                defaultValue="ingredientes"
                onSelectChange={handleSelectChange}
                buttonText="Registrar Ingrediente"
                onButtonClick={handleButtonClick}
            />

            <SearchBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                placeholder="Pesquise um ingrediente"
            />

            <div className={styles.filterAdvancedContainerLeft}>
                <AdvancedFilterIngredientes onFilterChange={handleFilterChange} />
            </div>

            <DataTable
                headers={tableHeaders}
                data={getIngredientesPaginados()}
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
                    <p>Carregando ingredientes...</p>
                </div>
            )}
        </div>
    )
}
