import styles from "../styles/CatalogoProdutos.module.css";

export function CatalogHeader({ title, options, defaultValue, onSelectChange, buttonText, onButtonClick }) {
    return (
        <div className={styles.containerTitulo}>
            <div className={styles.titulo}>
                <h1>Catálogo de</h1>
                <select onChange={(e) => onSelectChange(e.target.value)} defaultValue={defaultValue}>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            <button className={styles.registrarButton} onClick={onButtonClick}>
                {buttonText}
            </button>
        </div>
    );
}
