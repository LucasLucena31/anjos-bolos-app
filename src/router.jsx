
import { createBrowserRouter } from "react-router-dom";
import { Cadastro } from "./pages/Cadastro";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { RegistroVendas } from "./pages/RegistroVendas";
import { RegistroIngredientes } from "./pages/RegistroIngredientes";
import { Menu } from "./pages/Menu";
import { DashVendas } from "./pages/DashVendas";
import { DashProdutos } from "./pages/DashProdutos";
import { RegistroProduto } from "./pages/RegistroProduto";
import { HistoricoVendas } from "./pages/HistoricoVendas";
import { DashFinancas } from "./pages/DashFinancas";
import { CatalogoProdutos } from "./pages/CatalogoProdutos";
import { CatalogoIngredientes } from "./pages/CatalogoIngredientes";
import { PaginaNaoEncontrada } from "./pages/PaginaNaoEncontrada";
import { ResumoVenda } from "./pages/ResumoVenda";
import { Encomendas } from "./pages/Encomendas";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home titulo="Home" />
    },
    {
        path: "/cadastro",
        element: <Cadastro titulo="Cadastro de Funcionário" />
    },
    {
        path: "/registro-vendas",
        element: <RegistroVendas titulo="Registro de vendas" />
    },
    {
        path: "/login",
        element: <Login titulo="Login" />
    },
    {
        path: "/registro-ingredientes",
        element: <RegistroIngredientes titulo="Registro de Ingredientes" />
    },
    {
        path: "/menu",
        element: <Menu titulo="Menu" />
    },
    {
        path: "/dash-vendas",
        element: <DashVendas titulo="Dashboard de Vendas" />
    },
    {
        path: "/dash-produtos",
        element: <DashProdutos titulo="Dashboard de Produtos" />
    },
    {
        path: "/registro-produto",
        element: <RegistroProduto titulo="Dashboard de Produtos" />
    },
    {
        path: "/historico-vendas",
        element: <HistoricoVendas titulo="Historico de Vendas" />
    },
    {
        path: "/dash-financas",
        element: <DashFinancas titulo="Dashboard de Finanças" />
    },
    {
      path: "/catalogo-produtos",
      element: <CatalogoProdutos titulo="Catalogo de Produtos" />
    },
    {
      path: "/resumo-venda",
      element: <ResumoVenda titulo="Resumo de Vendas" />
    },
    {
      path: "/catalogo-ingredientes",
      element: <CatalogoIngredientes titulo="Catalogo de Ingredientes" />
    },
    {
        path: "/encomendas",
        element: <Encomendas titulo="Encomendas" />
    },
    {
        path: "*",
        element: <PaginaNaoEncontrada titulo="Página Não Encontrada" />
    }
])