import React, { useState, useRef, useEffect } from 'react';
import { FaFilter, FaSortAmountDown, FaSortAmountUp, FaSortAlphaDown, FaSortAlphaUp, FaDollarSign } from 'react-icons/fa';
import styles from '../styles/AdvancedFilter.module.css';

export function AdvancedFilter({ onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('alfabetica-asc');
    const filterRef = useRef(null);

    const filterOptions = [
        { 
            value: 'alfabetica-asc', 
            label: 'Ordem Alfabética (A-Z)', 
            icon: <FaSortAlphaDown />
        },
        { 
            value: 'alfabetica-desc', 
            label: 'Ordem Alfabética (Z-A)', 
            icon: <FaSortAlphaUp />
        },
        { 
            value: 'preco-baixo', 
            label: 'Menor Preço', 
            icon: <FaSortAmountDown />
        },
        { 
            value: 'preco-alto', 
            label: 'Maior Preço', 
            icon: <FaSortAmountUp />
        },
        { 
            value: 'lucro-baixo', 
            label: 'Menor Lucro', 
            icon: <FaDollarSign />
        },
        { 
            value: 'lucro-alto', 
            label: 'Maior Lucro', 
            icon: <FaDollarSign />
        }
    ];

    const handleFilterSelect = (filterValue) => {
        setSelectedFilter(filterValue);
        setIsOpen(false);
        if (onFilterChange) {
            onFilterChange(filterValue);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getCurrentFilterLabel = () => {
        const current = filterOptions.find(option => option.value === selectedFilter);
        return current ? current.label : 'Filtrar';
    };

    return (
        <div className={styles.advancedFilterContainer} ref={filterRef}>
            <div className={styles.filterTrigger} onClick={toggleDropdown}>
                <FaFilter className={styles.filterIcon} />
            </div>

            {isOpen && (
                <div className={styles.filterDropdown}>
                    <div className={styles.filterHeader}>
                        <h4>Ordenar por:</h4>
                    </div>
                    <div className={styles.filterOptions}>
                        {filterOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`${styles.filterOption} ${
                                    selectedFilter === option.value ? styles.active : ''
                                }`}
                                onClick={() => handleFilterSelect(option.value)}
                            >
                                <span className={styles.optionIcon}>{option.icon}</span>
                                <span className={styles.optionLabel}>{option.label}</span>
                                {selectedFilter === option.value && (
                                    <span className={styles.checkmark}>✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}