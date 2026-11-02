import styles from "../styles/CatalogoProdutos.module.css";

export function DataTable({ 
    headers, 
    data, 
    renderRow, 
    // Props de paginação
    currentPage,
    totalPages,
    loading,
    onPreviousPage,
    onNextPage,
    onPageClick
}) {
    return (
        <div className={styles.tableSection}>
            <div className={styles.table}>
                <div className={styles.tableHeader}>
                    {headers.map((header, index) => (
                        <div key={index} className={styles.tableHeaderCell}>{header}</div>
                    ))}
                </div>
                <div className={styles.tableBody}>
                    {data.map((item, index) => (
                        <div key={index} className={styles.tableRow}>
                            {renderRow(item)}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Paginação dentro do mesmo container */}
            {totalPages > 1 && (
                <div className={styles.paginationWrapper}>
                    <div className={styles.paginationContainer}>
                        <button 
                            className={styles.paginationButton}
                            onClick={onPreviousPage}
                            disabled={currentPage === 0 || loading}
                        >
                            ◀
                        </button>
                        
                        <div className={styles.paginationInfo}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                    pageNumber = index;
                                } else if (currentPage < 3) {
                                    pageNumber = index;
                                } else if (currentPage > totalPages - 3) {
                                    pageNumber = totalPages - 5 + index;
                                } else {
                                    pageNumber = currentPage - 2 + index;
                                }
                                
                                return (
                                    <button
                                        key={pageNumber}
                                        className={`${styles.paginationNumber} ${currentPage === pageNumber ? styles.active : ''}`}
                                        onClick={() => onPageClick(pageNumber)}
                                        disabled={loading}
                                    >
                                        {pageNumber + 1}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button 
                            className={styles.paginationButton}
                            onClick={onNextPage}
                            disabled={currentPage >= totalPages - 1 || loading}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
