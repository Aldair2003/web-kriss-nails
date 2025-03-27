/**
 * Utilidades para el manejo de duración de servicios
 */
/**
 * Convierte minutos a formato de visualización (HH:MM)
 * @param minutes - Duración en minutos
 * @returns string en formato "H:MM" o "HH:MM"
 */
export const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0
        ? `${hours}:00`
        : `${hours}:${mins.toString().padStart(2, '0')}`;
};
/**
 * Convierte un string de duración a minutos
 * @param duration - String en formato "H:MM", "HH:MM" o decimal "2.5"
 * @returns número de minutos
 */
export const parseDuration = (duration) => {
    // Si es formato HH:MM
    if (duration.includes(':')) {
        const [hours, minutes] = duration.split(':');
        return (parseInt(hours) * 60) + parseInt(minutes);
    }
    // Si es formato decimal (2.5 = 2h 30min)
    const decimal = parseFloat(duration);
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return (hours * 60) + minutes;
};
/**
 * Valida si el formato de duración es correcto
 * @param duration - String a validar
 * @returns boolean indicando si el formato es válido
 */
export const isValidDuration = (duration) => {
    // Validar formato HH:MM
    if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length !== 2)
            return false;
        const [hours, minutes] = parts;
        const hoursNum = parseInt(hours);
        const minutesNum = parseInt(minutes);
        return !isNaN(hoursNum) &&
            !isNaN(minutesNum) &&
            minutesNum >= 0 &&
            minutesNum < 60;
    }
    // Validar formato decimal
    const decimal = parseFloat(duration);
    return !isNaN(decimal) && decimal > 0;
};
