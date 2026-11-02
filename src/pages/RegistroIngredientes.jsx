import styles from "../styles/RegistroIngredientes.module.css";
import { useState } from "react";
import api from "../provider/api";
import { TextBox } from "../components/TextBox";
import { Button } from "../components/Button";
import { ModernToast } from "../components/ModernToast";
import { Navbar } from "../components/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { FaArrowLeft } from "react-icons/fa";

export function RegistroIngredientes(props) {
    useDocumentTitle(props.titulo);
    
    const [nome, setNome] = useState("");
    const [medida, setMedida] = useState("");
    const [valor, setValor] = useState("");
    const [quantidade, setQuantidade] = useState("");
    const [toastSucesso, setToastSucesso] = useState(false);
    const [toastErro, setToastErro] = useState(false);

    const handleVoltar = () => {
        window.location.href = '/catalogo-ingredientes';
    };

    const salvar = async e => {
        e.preventDefault();

        let quantidadeConvertida = quantidade;

        if (medida === "quilograma" || medida === "mililitro") {
            quantidadeConvertida = quantidade * 1000;
        }
        
        try {
            const response = await api.post(`/ingredientes`, {
                nome: nome,
                valorEmbalagem: valor,
                quantidadeEmbalagem: quantidadeConvertida
            });
            console.log(response.data);
            setNome("");
            setMedida("");
            setValor("");
            setQuantidade("");
            setToastSucesso(true);
        } catch (error) {
            console.error(error);
            setToastErro(true);
        }
    }

   
    return(
        <div className={styles.pageContainer}>
            <Navbar logado={true} />
            
            <div className={styles.headerContainer}>
                <button 
                    className={styles.voltarButton}
                    onClick={handleVoltar}
                >
                    <FaArrowLeft size={12} style={{ marginRight: 6 }} />
                    Voltar
                </button>
            </div>
            
            <div className={styles.registroIngredientes}>
                <h1>{props.titulo}</h1>
        
        <div className={styles.container} style={{ width: "550px" }}>

            <div className={styles["input-grid"]}>
                <div className={styles["input-group"]}>
                    <TextBox name="Nome" label="Nome do Ingrediente" type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>

                <div>
                    <div className={styles["input-group"]}>
                        <select
                            value={medida}
                            onChange={(e) => setMedida(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Selecione a medida</option>
                            {/* <option value="unidade">Unidade</option> */}
                            <option value="grama">Grama</option>
                            <option value="quilograma">Quilograma</option>
                            <option value="litro">Litro</option>
                            <option value="mililitro">Mililitro</option>
                        </select>
                    </div>

                    <div className={styles["input-group"]}>
                        <TextBox name="Quantidade" label="Quantidade" type="text" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                    </div>

                    <div className={styles["input-group"]}>
                        <TextBox name="Valor" label="Valor" type="text" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>


                </div>
            </div>

            <Button function="Cadastrar" onClick={salvar} />

            <ModernToast 
                isOpen={toastSucesso}
                message="Ingrediente cadastrado com sucesso!"
                type="success"
                duration={1500}
            />

            <ModernToast 
                isOpen={toastErro}
                message="Erro ao cadastrar ingrediente. Verifique as informações e tente novamente."
                type="error"
                duration={1500}
            />
            </div>
            </div>
        </div>
    )
}