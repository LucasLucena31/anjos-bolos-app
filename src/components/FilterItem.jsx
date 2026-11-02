import styles from "../styles/CatalogoProdutos.module.css";

export function FilterItem({ id, label, isChecked, onChange, colorClass }) {
    return (
        <div className={`${styles.filterItem} ${styles[colorClass]}`}>
            <input 
                type="checkbox"
                id={id}
                className={styles.filterCheckbox}
                checked={isChecked}
                onChange={() => onChange(id)}
            />
            <label htmlFor={id} className={styles.filterLabel}>
                {label}
            </label>
        </div>
    );
}
