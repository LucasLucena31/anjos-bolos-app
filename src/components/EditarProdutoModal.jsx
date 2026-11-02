import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import styles from "../styles/EditarItem.module.css";
import api from "../provider/api";
import imagemPadrao from "../assets/bolo.png";

const paraCampo = (v) => (v == null ? "" : Number(v).toFixed(2).replace(".", ","));
const lerNumero = (v) => {
    const t = String(v ?? "").trim().replace(/[R$\s]/g, "");
    if (!t) return NaN;
    return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
};
const reais = (n) => (Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "–");

// Edita nome, categoria, preço, custo e foto de um produto.
// As vendas já registradas continuam com o preço da época.
export function EditarProdutoModal({ produto, onClose, onSalvo }) {
    const [categorias, setCategorias] = useState([]);
    const [form, setForm] = useState({ nome: "", categoriaProdutoId: "", precoFinal: "", custoProducao: "" });
    const [arquivo, setArquivo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!produto) return;
        setForm({
            nome: produto.nome || "",
            categoriaProdutoId: produto.categoriaProdutoId ? String(produto.categoriaProdutoId) : "",
            precoFinal: paraCampo(produto.precoFinal),
            custoProducao: paraCampo(produto.custoProducao),
        });
        setArquivo(null);
        setPreview(produto.nomeImagem || null);
        setErro("");
    }, [produto]);

    useEffect(() => {
        api.get("/categorias-produtos").then((r) => setCategorias(Array.isArray(r.data) ? r.data : [])).catch(() => setCategorias([]));
    }, []);

    useEffect(() => () => { if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

    if (!produto) return null;

    const alterar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const escolherImagem = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setArquivo(f);
        setPreview(URL.createObjectURL(f));
    };

    const preco = lerNumero(form.precoFinal);
    const custo = lerNumero(form.custoProducao);
    const lucro = preco - custo;
    const margem = preco > 0 ? (lucro / preco) * 100 : NaN;

    const salvar = async (e) => {
        e.preventDefault();
        setErro("");
        if (!form.nome.trim()) { setErro("Informe o nome do produto."); return; }
        if (!(preco >= 0)) { setErro("Informe um preço de venda válido (use 0 para bolo de festa, que tem preço na hora)."); return; }
        if (!(custo >= 0)) { setErro("Informe um custo de produção válido."); return; }
        setSalvando(true);
        try {
            const r = await api.put(`/produtos/${produto.id}`, {
                nome: form.nome.trim(),
                categoriaProdutoId: form.categoriaProdutoId || null,
                precoFinal: preco,
                custoProducao: custo,
            });
            let atualizado = r.data;
            if (arquivo) {
                const fd = new FormData();
                fd.append("imagem", arquivo);
                const img = await api.patch(`/produtos/${produto.id}/imagem`, fd);
                atualizado = { ...atualizado, nomeImagem: img.data };
            }
            onSalvo?.(atualizado);
        } catch (err) {
            setErro(err?.response?.data?.message || "Não foi possível salvar. Tente de novo.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal isOpen={!!produto} onClose={salvando ? () => {} : onClose}>
            <form className={styles.card} onSubmit={salvar} noValidate>
                <h2>Editar produto</h2>
                <p className={styles.aviso}>As vendas já registradas continuam com o preço e o custo da época. O novo valor vale a partir das próximas vendas.</p>

                <div className={styles.grid}>
                    <div className={`${styles.campo} ${styles.campoInteiro}`}>
                        <label htmlFor="ep-nome">Nome</label>
                        <input id="ep-nome" name="nome" value={form.nome} onChange={alterar} />
                    </div>
                    <div className={`${styles.campo} ${styles.campoInteiro}`}>
                        <label htmlFor="ep-cat">Categoria</label>
                        <select id="ep-cat" name="categoriaProdutoId" value={form.categoriaProdutoId} onChange={alterar}>
                            <option value="">Sem categoria</option>
                            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="ep-preco">Preço de venda (R$)</label>
                        <input id="ep-preco" name="precoFinal" inputMode="decimal" value={form.precoFinal} onChange={alterar} placeholder="0,00" />
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="ep-custo">Custo de produção (R$)</label>
                        <input id="ep-custo" name="custoProducao" inputMode="decimal" value={form.custoProducao} onChange={alterar} placeholder="0,00" />
                    </div>
                </div>

                <div className={styles.resumo}>
                    <span>Lucro por unidade: <strong className={lucro < 0 ? styles.negativo : ""}>{reais(lucro)}</strong></span>
                    <span>Margem: <strong className={margem < 0 ? styles.negativo : ""}>{Number.isFinite(margem) ? `${margem.toFixed(1).replace(".", ",")}%` : "–"}</strong></span>
                </div>

                <div className={styles.campo}>
                    <label htmlFor="ep-img">Foto</label>
                    <div className={styles.imagemLinha}>
                        <img src={preview || imagemPadrao} alt="" />
                        <input id="ep-img" type="file" accept="image/jpeg,image/png,image/webp" onChange={escolherImagem} />
                    </div>
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
