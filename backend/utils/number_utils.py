def remove_trailing_zeros(value):
    """
    Convierte valores numéricos con decimales .0 a enteros como string.
    Útil para NITs y códigos de cuenta que pandas interpreta como float.
    """
    if not value or value == "":
        return ""
    
    value_str = str(value).strip()
    
    if value_str.lower() == 'nan' or value_str == 'None':
        return ""
    
    if '.' in value_str:
        try:
            value_float = float(value_str)
            if value_float == int(value_float):
                return str(int(value_float))
        except (ValueError, TypeError):
            pass
    
    return value_str


def normalize_nit(nit):
    """Normaliza NIT removiendo guiones, espacios y puntos para comparación."""
    if not nit:
        return ""
    return str(nit).strip().replace('-', '').replace(' ', '').replace('.', '')

