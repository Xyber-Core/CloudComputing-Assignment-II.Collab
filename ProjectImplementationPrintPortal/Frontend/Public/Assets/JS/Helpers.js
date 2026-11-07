export function nextStatus(statuses, current) {
    const index = statuses.indexOf(current);
    return index === -1 || index === statuses.length - 1
        ? null
        : statuses[index + 1];
}

export function buildQuery(filters) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `?${query}` : '';
}

export function escapeHtml(value) {
    if (value == null) return '';

    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

export function tourCardPosition(highlight, card, viewport) {
    const margin = 12;
    const gap = 12;

    let top = highlight.bottom + gap;

    if (top + card.height > viewport.height - margin) {
        top = highlight.top - card.height - gap;
    }

    top = Math.max(
        margin,
        Math.min(top, viewport.height - card.height - margin)
    );

    const left = Math.max(
        margin,
        Math.min(highlight.left, viewport.width - card.width - margin)
    );

    return { top, left };
}