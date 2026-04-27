
const formatGroupDate = (timestamp: number): string => {
    const GROUP_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
    };

    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Inconnue';
    }
    return parsedDate.toLocaleDateString('fr-FR', GROUP_DATE_FORMAT);
};

export default formatGroupDate;