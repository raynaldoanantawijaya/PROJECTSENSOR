"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface TurnstileProps {
    onVerify: (token: string) => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (element: string | HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

export default function TurnstileWidget({ onVerify }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [widgetId, setWidgetId] = useState<string | null>(null);

    useEffect(() => {
        // If turnstile is already loaded globally
        if (window.turnstile && containerRef.current && !widgetId) {
            const id = window.turnstile.render(containerRef.current, {
                sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                callback: (token: string) => onVerify(token),
                theme: 'dark', // Matches your aesthetic
            });
            setWidgetId(id);
        }

        // Define global callback if script loads later
        window.onTurnstileLoad = () => {
            if (containerRef.current && !widgetId) {
                const id = window.turnstile?.render(containerRef.current, {
                    sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                    callback: (token: string) => onVerify(token),
                    theme: 'dark',
                });
                if (id) setWidgetId(id);
            }
        };

        return () => {
            if (widgetId && window.turnstile) {
                try {
                    window.turnstile.reset(widgetId);
                } catch (e) { }
            }
        };
    }, [onVerify, widgetId]);

    return (
        <div className="w-full flex justify-center my-4">
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
                strategy="afterInteractive"
            />
            <div ref={containerRef} />
        </div>
    );
}
