/* ==========================================================================
   SHARED FRONTEND HELPERS
   Pure functions used by the dashboard and its unit tests.
   ========================================================================== */

/* 01 · Request workflow helpers */
export function nextStatus(statuses, current) {
    const index = statuses.indexOf(current);
    return index === -1 || index === statuses.length - 1
        ? null
        : statuses[index + 1];
}

/* Convert active filter values into a URL query string. */
export function buildQuery(filters) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `?${query}` : '';
}

/* Escape text before placing it into an HTML string. Prefer textContent for DOM updates. */
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

/* Keep an onboarding tooltip inside the visible browser viewport. */
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