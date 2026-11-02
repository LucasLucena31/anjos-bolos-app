import styles from "../styles/Formulario.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../provider/api";
import { TextBox } from "../components/TextBox";
import { Button } from "../components/Button";
import { ModernToast } from "../components/ModernToast";
import { Navbar } from "../components/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Login(props) {
    useDocumentTitle(props.titulo);
    const navigate = useNavigate();
    
    const [form, setForm] = useState({
        email:"",
        senha:""
    })

    const [toastSucesso, setToastSucesso] = useState(false);
    const [toastErro, setToastErro] = useState(false);

    const alterarForm = e => {
        setForm({...form, [e.target.name]:e.target.value})
    }

    const fecharToastSucesso = () => {
        setToastSucesso(false);
        navigate('/menu'); // Redireciona para o menu após login bem-sucedido
    }

    const acessar = async e => {
        e.preventDefault();

        try{
            const response = await api.get("/auth", {
                params: {
                    email: form.email,
                    senha: form.senha
                }
            })
            
            // Salvar dados do usuário logado no localStorage
            if (response.data) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('usuario', JSON.stringify(response.data));
                console.log("Dados do usuário salvos:", response.data);
            }
            
            setToastSucesso(true)
        }
        catch(error) {
            console.error(error);
            setToastErro(true)
        }
    }
    return(
        <div className={styles.pageContainer}>
            <Navbar hideMenuButton={true} />
            <div className={styles.login}>
                <div className={styles.container} style={{ width: "580px" }}>
            <h1>{props.titulo}</h1>

            <div className={styles["input-grid"]}>
                <div className={styles["input-group"]}>
                    <TextBox name="email" label="E-mail" type="text" value={form.email} onChange={alterarForm} />
                </div>

                <div className={styles["input-group"]}>
                    <TextBox name="senha" label="Senha" type="password" value={form.senha} onChange={alterarForm} />
                </div>
            </div>

            <Button function="Entrar" onClick={acessar} />

            <ModernToast 
                isVisible={toastSucesso} 
                message="Login realizado com sucesso! Redirecionando..." 
                type="success" 
                onClose={fecharToastSucesso}
                duration={1500}
            />
            
            <ModernToast 
                isVisible={toastErro} 
                message="Erro ao fazer login. Verifique suas credenciais!" 
                type="error" 
                onClose={() => setToastErro(false)}
                duration={1500}
            />
                </div>
            </div>
        </div>
    )
}