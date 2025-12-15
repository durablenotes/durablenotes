import React, { createContext, useContext, useEffect, useState } from 'react';

interface BrandSettings {
    site_title: string;
    logo_url: string;
    favicon_url: string;
}

interface BrandContextType {
    settings: BrandSettings;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: BrandSettings = {
    site_title: "Durable Notes",
    logo_url: "/logo.png",
    favicon_url: "/favicon.ico"
};

const BrandContext = createContext<BrandContextType>({
    settings: defaultSettings,
    isLoading: true,
    refreshSettings: async () => { }
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json() as Partial<BrandSettings>;
                setSettings(prev => ({ ...prev, ...data }));

                // Apply immediately to document
                if (data.site_title) document.title = data.site_title;
                if (data.favicon_url) {
                    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = data.favicon_url;
                }
            }
        } catch (e) {
            console.error("Failed to load branding", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <BrandContext.Provider value={{ settings, isLoading, refreshSettings }}>
            {children}
        </BrandContext.Provider>
    );
}

export const useBrand = () => useContext(BrandContext);
