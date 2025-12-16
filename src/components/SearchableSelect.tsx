import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export type Option = { value: string | number; label: string };

type SearchableSelectProps = {
    name: string;
    options: Option[];
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    style?: React.CSSProperties;
    darkMode?: boolean;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    name,
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    required,
    disabled,
    placeholder = "Seleccionar...",
    style,
    darkMode = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Estado interno para uso no controlado o por defecto
    const [internalValue, setInternalValue] = useState<string | number>(
        controlledValue !== undefined ? controlledValue : (defaultValue || '')
    );

    const containerRef = useRef<HTMLDivElement>(null);

    // Sincronizar con la prop value controlada si se proporciona
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(opt => opt.value === internalValue);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val: string | number) => {
        setInternalValue(val);
        setIsOpen(false);
        setSearchTerm(''); // Opcional: limpiar búsqueda al seleccionar
        if (onChange) {
            onChange(val);
        }
    };

    const colors = {
        bg: 'var(--admin-input-bg, rgba(255,255,255,0.06))',
        border: 'var(--admin-border, rgba(255,255,255,0.12))',
        text: 'var(--admin-text-primary, #fff)',
        placeholder: 'var(--admin-text-secondary, rgba(255,255,255,0.6))',
        dropdownBg: darkMode ? '#1e293b' : '#ffffff', // Fondo sólido para el menú desplegable
        dropdownBorder: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        hoverBg: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
        selectedBg: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
        selectedText: darkMode ? '#60a5fa' : '#3b82f6'
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                ...style
            }}
        >
            {/* Input oculto para compatibilidad con FormData */}
            <input
                type="hidden"
                name={name}
                value={internalValue || ''}
                required={required}
            />

            {/* Botón activador */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '7px 10px',
                    background: colors.bg,
                    border: isOpen ? `1px solid ${colors.selectedText}` : `1px solid ${colors.border}`,
                    borderRadius: 6,
                    color: selectedOption ? colors.text : colors.placeholder,
                    fontSize: '0.8rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? `0 0 0 2px ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` : 'none'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} style={{ opacity: 0.7 }} />
            </div>

            {/* Menú desplegable */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: colors.dropdownBg,
                    border: `1px solid ${colors.dropdownBorder}`,
                    borderRadius: '8px',
                    zIndex: 1000,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '250px'
                }}>
                    {/* Input de búsqueda */}
                    <div style={{ padding: '8px', borderBottom: `1px solid ${colors.dropdownBorder}` }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: colors.text }} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px 6px 30px',
                                    background: darkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: colors.text,
                                    fontSize: '0.8rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Lista de opciones */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === internalValue;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            color: isSelected ? colors.selectedText : colors.text,
                                            background: isSelected ? colors.selectedBg : 'transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = colors.hoverBg;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: colors.placeholder, fontSize: '0.8rem' }}>
                                No se encontraron resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
