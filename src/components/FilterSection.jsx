import styles from "../styles/CatalogoProdutos.module.css";
import { FilterItem } from "./FilterItem";
import { AdvancedFilter } from "./AdvancedFilter";

export function FilterSection({ filters, selectedCategories, onCategoryChange, onAdvancedFilterChange }) {
    return (
        <div className={styles.filterSection}>
            <span className={styles.filterTitle}>Filtrar por categorias:</span>
            <div className={styles.filterContainer}>
                {filters.map(filter => (
                    <FilterItem
                        key={filter.id}
                        id={filter.id}
                        label={filter.label}
                        colorClass={filter.colorClass}
                        isChecked={selectedCategories.includes(filter.id)}
                        onChange={onCategoryChange}
                    />
                ))}
                <AdvancedFilter onFilterChange={onAdvancedFilterChange} />
            </div>
        </div>
    );
}
