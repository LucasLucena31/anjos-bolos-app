import styles from "../styles/Cadastro.module.css";
import { useState } from "react";
import api from "../provider/api";
import { TextBox } from "../components/TextBox";
import { Button } from "../components/Button";
import { ModernToast } from "../components/ModernToast";
import { Navbar } from "../components/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { FaArrowLeft } from "react-icons/fa";

export function Cadastro(props) {
    useDocumentTitle(props.titulo);
    const [form, setForm] = useState({
        nome: "",
        email: "",
        senha: "",
        funcao: "",
        cpf: "",
        telefone: ""
    })

    const [toastSucesso, setToastSucesso] = useState(false);
    const [toastErro, setToastErro] = useState(false);
    const [toastErroMensagem, setToastErroMensagem] = useState('');


    // Máscara para CPF: 000.000.000-00 com correções pós-seleção
    function maskCPF(value) {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        let masked = digits;
        masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
        masked = masked.replace(/(\d{3})(\d)/, '$1.$2');
        masked = masked.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return masked;
    }

    // Máscara para telefone: (00) 9XXXX-XXXX
    function maskTelefone(value) {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (!digits) return '';

        if (digits.length <= 2) {
            return digits.length === 2 ? `(${digits}) ` : `(${digits}`;
        }

        if (digits.length <= 7) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    function isValidCPF(value) {
        const cpf = value.replace(/\D/g, '');
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

    const alterarForm = e => {
        let value = e.target.value;
        if (e.target.name === "cpf") {
            value = maskCPF(value);
        }
        if (e.target.name === "telefone") {
            value = maskTelefone(value);
        }
        setForm({ ...form, [e.target.name]: value });
    }

    const validarFormulario = () => {
        if (!form.nome.trim() || form.nome.trim().length < 3) {
            setToastErroMensagem('Nome deve ter pelo menos 3 caracteres.');
            setToastErro(true);
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
            setToastErroMensagem('Informe um e-mail válido.');
            setToastErro(true);
            return false;
        }

        if (!isValidCPF(form.cpf)) {
            setToastErroMensagem('CPF inválido. Confira os dígitos informados.');
            setToastErro(true);
            return false;
        }

        const telefoneRegex = /^\(\d{2}\) 9\d{4}-\d{4}$/;
        if (!telefoneRegex.test(form.telefone)) {
            setToastErroMensagem("Telefone deve estar no formato '(XX) 9XXXX-XXXX'.");
            setToastErro(true);
            return false;
        }

        if (!form.funcao) {
            setToastErroMensagem('Selecione a função do funcionário.');
            setToastErro(true);
            return false;
        }

        if (!form.senha || form.senha.length < 6) {
            setToastErroMensagem('Senha deve ter pelo menos 6 caracteres.');
            setToastErro(true);
            return false;
        }

        return true;
    };

    const cadastrar = async e => {
        e.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        try{
            await api.post(`/usuarios`, {
                ...form,
                cpf: form.cpf.replace(/\D/g, ''),
                telefone: form.telefone.replace(/\D/g, '')
            })
            setToastSucesso(true)
        }
        catch(error) {
            console.error(error);
            setToastErroMensagem('Erro ao realizar cadastro. Verifique as informações e tente novamente.');
            setToastErro(true)
        }
    }

    const handleVoltar = () => {
        window.location.href = '/menu';
    };

    return(
        <div className={styles.pageContainer}>
            <Navbar />
            <div className={styles.headerContainer}>
                <button 
                    type="button"
                    className={styles.voltarButton}
                    onClick={handleVoltar}
                >
                    <FaArrowLeft className={styles.voltarIcon} />
                    Voltar
                </button>
            </div>
            
            <div className={styles.cadastro}>
        <div className={styles.container}>
            <h1>{props.titulo}</h1>


            <div className={styles["input-grid"]}>
                <div className={styles["input-group"]}>
                    <TextBox name="nome" label="Nome" type="text" value={form.nome} onChange={alterarForm} />
                    <TextBox name="email" label="E-mail" type="text" value={form.email} onChange={alterarForm} />
                </div>
                <div className={styles["input-group"]}>
                    <TextBox name="cpf" label="CPF" type="text" value={form.cpf} onChange={alterarForm} maxLength={14} />
                    <TextBox name="telefone" label="Telefone" type="text" value={form.telefone} onChange={alterarForm} maxLength={15} />
                </div>
                <div className={styles["input-group"]}>
                    <TextBox name="senha" label="Senha" type="password" value={form.senha} onChange={alterarForm} />
                    <select name="funcao" onChange={alterarForm} value={form.funcao}>
                        <option value="" disabled>Selecione uma opção</option>
                        <option value="ADMINISTRADOR">Administrador</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="ATENDENTE">Atendente</option>
                    </select>
                </div>
            </div>

            <Button function="Cadastrar" onClick={cadastrar} />

            <ModernToast 
                isOpen={toastSucesso}
                message={`Funcionário ${form.nome} cadastrado com sucesso!`}
                type="success"
                duration={1800}
                onClose={() => setToastSucesso(false)}
            />

            <ModernToast 
                isOpen={toastErro}
                message={toastErroMensagem || "Erro ao validar cadastro."}
                type="error"
                duration={2000}
                onClose={() => setToastErro(false)}
            />
            </div>
            </div>
        </div>
    )
}