import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import styles from "../styles/EditarItem.module.css";
import api from "../provider/api";

const MEDIDAS = [
    { v: "grama", n: "Grama (g)", fator: 1, base: "g" },
    { v: "quilograma", n: "Quilograma (kg)", fator: 1000, base: "g" },
    { v: "mililitro", n: "Mililitro (mL)", fator: 1, base: "mL" },
    { v: "litro", n: "Litro (L)", fator: 1000, base: "mL" },
    { v: "unidade", n: "Unidade", fator: 1, base: "unidade" },
];
const lerNumero = (v) => {
    const t = String(v ?? "").trim().replace(/[R$\s]/g, "");
    if (!t) return NaN;
    return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
};
const campo = (v, casas = 2) => (v == null ? "" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: casas, useGrouping: false }));
export const custoPorMedida = (v) =>
    Number.isFinite(v) ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "–";

// Edita o nome e o preço da embalagem de um ingrediente.
// O custo das receitas muda a partir de agora; vendas já registradas não mudam.
export function EditarIngredienteModal({ ingrediente, onClose, onSalvo }) {
    const [form, setForm] = useState({ nome: "", medida: "", quantidade: "", valor: "" });
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!ingrediente) return;
        setForm({
            nome: ingrediente.nome || "",
            medida: ingrediente.medida || "",
            quantidade: campo(ingrediente.quantidadeEmbalagem, 3),
            valor: campo(ingrediente.valorEmbalagem, 2),
        });
        setErro("");
    }, [ingrediente]);

    if (!ingrediente) return null;

    const alterar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const med = MEDIDAS.find((m) => m.v === form.medida);
    const q = lerNumero(form.quantidade), v = lerNumero(form.valor);
    const precoMudou = form.medida !== (ingrediente.medida || "") || form.quantidade !== campo(ingrediente.quantidadeEmbalagem, 3) || form.valor !== campo(ingrediente.valorEmbalagem, 2);
    const novoCusto = med && q > 0 && v > 0 ? v / (q * med.fator) : NaN;

    const salvar = async (e) => {
        e.preventDefault();
        setErro("");
        if (!form.nome.trim()) { setErro("Informe o nome do ingrediente."); return; }
        const corpo = { nome: form.nome.trim() };
        if (precoMudou) {
            if (!med) { setErro("Escolha a medida da embalagem."); return; }
            if (!(q > 0)) { setErro("Informe a quantidade da embalagem."); return; }
            if (!(v > 0)) { setErro("Informe quanto custou a embalagem."); return; }
            Object.assign(corpo, { medida: med.v, quantidadeEmbalagem: q, valorEmbalagem: v });
        }
        setSalvando(true);
        try {
            const r = await api.put(`/ingredientes/${ingrediente.id}`, corpo);
            onSalvo?.(r.data);
        } catch (err) {
            setErro(err?.response?.data?.message || "Não foi possível salvar. Tente de novo.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal isOpen={!!ingrediente} onClose={salvando ? () => {} : onClose}>
            <form className={styles.card} onSubmit={salvar} noValidate>
                <h2>Editar ingrediente</h2>
                <p className={styles.aviso}>Informe o preço da embalagem que você compra. O custo das receitas passa a usar o valor novo; as vendas já registradas não mudam.</p>

                <div className={styles.grid}>
                    <div className={`${styles.campo} ${styles.campoInteiro}`}>
                        <label htmlFor="ei-nome">Nome</label>
                        <input id="ei-nome" name="nome" value={form.nome} onChange={alterar} />
                    </div>
                    <div className={`${styles.campo} ${styles.campoInteiro}`}>
                        <label htmlFor="ei-medida">Medida da embalagem</label>
                        <select id="ei-medida" name="medida" value={form.medida} onChange={alterar}>
                            <option value="">Escolha</option>
                            {MEDIDAS.map((m) => <option key={m.v} value={m.v}>{m.n}</option>)}
                        </select>
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="ei-qtd">Quantidade na embalagem</label>
                        <input id="ei-qtd" name="quantidade" inputMode="decimal" value={form.quantidade} onChange={alterar} placeholder="Ex.: 1" />
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="ei-valor">Valor pago (R$)</label>
                        <input id="ei-valor" name="valor" inputMode="decimal" value={form.valor} onChange={alterar} placeholder="Ex.: 6,49" />
                    </div>
                </div>

                <div className={styles.resumo}>
                    <span>Custo atual: <strong>{custoPorMedida(ingrediente.custoMedida)}</strong></span>
                    <span>Novo custo: <strong>{precoMudou && Number.isFinite(novoCusto) ? `${custoPorMedida(novoCusto)} por ${med.base}` : "sem mudança"}</strong></span>
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <div className={styles.acoes}>
                    <button type="button" className={`${styles.botao} ${styles.botaoSecundario}`} onClick={onClose} disabled={salvando}>Cancelar</button>
                    <button type="submit" className={styles.botao} disabled={salvando}>{salvando ? "Salvando…" : "Salvar alterações"}</button>
                </div>
            </form>
        </Modal>
    );
}
