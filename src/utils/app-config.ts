// Central access point for the same-origin Vercel API.
class AppConfig {
    public readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
}

export const appConfig = new AppConfig();

