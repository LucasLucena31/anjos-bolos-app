import { FaSearch } from "react-icons/fa";
import styles from "../styles/CatalogoProdutos.module.css";

export function SearchBar({ searchTerm, onSearchChange, placeholder }) {
    return (
        <div className={styles.searchSection}>
            <div className={styles.searchContainer}>
                <input 
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles.searchInput}
                />
                <FaSearch className={styles.searchIcon} />
            </div>
        </div>
    );
}
