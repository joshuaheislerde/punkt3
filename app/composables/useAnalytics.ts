interface AnalyticsComposable {
    track: (event: string, data?: Record<string, string>) => void
}

declare global {
    interface Window {
        umami?: { track: (event: string, data?: Record<string, string>) => void }
    }
}

// Sends a custom event to Umami. Does nothing if the tracker isn't loaded (locally, ad blocker, Do Not Track).
// Used from click handlers instead of data-umami-event, which would swallow other click listeners.
export const useAnalytics = (): AnalyticsComposable => {
    const track = (event: string, data?: Record<string, string>): void => {
        if (import.meta.server) return
        try {
            window.umami?.track(event, data)
        } catch {
            // analytics must never break the page
        }
    }

    return { track }
}
