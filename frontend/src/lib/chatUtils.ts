/**
 * Chat utility functions shared between document and project chat hooks.
 */

/**
 * Tool event parsed from SSE data
 */
export interface ToolEvent {
    type: string;
    payload?: unknown;
}

/**
 * Chunk preview for search results
 */
export interface ChunkPreview {
    source: string;
    preview: string;
}

/**
 * Search status for RAG visibility
 */
export interface SearchStatus {
    isSearching: boolean;
    query?: string;
    chunks?: ChunkPreview[];
}

/**
 * Parse tool events and extract clean content from SSE data.
 * Returns: { events: parsed tool events, cleanContent: text without tool markers }
 */
export function parseAndCleanData(data: string): { events: ToolEvent[]; cleanContent: string } {
    const events: ToolEvent[] = [];
    let cleanContent = data;

    // Find all [EVENT:...] patterns with proper bracket matching
    let i = 0;
    while (i < cleanContent.length) {
        const startIdx = cleanContent.indexOf('[EVENT:', i);
        if (startIdx === -1) break;

        // Find the matching closing bracket (handle nested brackets in JSON)
        let bracketCount = 1;
        let endIdx = startIdx + 7; // Start after '[EVENT:'
        while (endIdx < cleanContent.length && bracketCount > 0) {
            if (cleanContent[endIdx] === '[') bracketCount++;
            else if (cleanContent[endIdx] === ']') bracketCount--;
            endIdx++;
        }

        if (bracketCount !== 0) {
            // Malformed, skip
            i = startIdx + 1;
            continue;
        }

        const fullMatch = cleanContent.slice(startIdx, endIdx);
        const inner = fullMatch.slice(7, -1); // Remove [EVENT: and ]

        // Parse type and payload
        const colonIdx = inner.indexOf(':');
        let type: string;
        let payload: unknown = undefined;

        if (colonIdx === -1) {
            type = inner;
        } else {
            type = inner.slice(0, colonIdx);
            const jsonPayload = inner.slice(colonIdx + 1);
            if (jsonPayload) {
                try {
                    payload = JSON.parse(jsonPayload);
                } catch {
                    payload = jsonPayload;
                }
            }
        }

        events.push({ type, payload });
        cleanContent = cleanContent.slice(0, startIdx) + cleanContent.slice(endIdx);
        // Don't increment i, since we removed content
    }

    return { events, cleanContent };
}
