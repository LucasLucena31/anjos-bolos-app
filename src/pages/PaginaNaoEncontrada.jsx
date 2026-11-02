import '../styles/PaginaNaoEncontrada.css';
import '../styles/fonts/fonts.css';
import { useNavigate } from 'react-router-dom';
import errorImage from '../assets/error.svg';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function PaginaNaoEncontrada(props) {
    useDocumentTitle(props.titulo);
    const navigate = useNavigate();
    return (
        <div className="error-container">
            <h1 className="error-title">Ops! Página não encontrada</h1>
            <img src={errorImage} alt="Erro 404" className="error-image" />
            <p className="error-message">
                Desculpe, mas a página que você procura não existe ou foi movida.
            </p>
            <button onClick={() => navigate('/')} className="back-button">
                Voltar para a página inicial
            </button>
        </div>
    );
}
