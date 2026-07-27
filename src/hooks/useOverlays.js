import { useState, useEffect } from 'react';

export function useOverlays(genre = null) {
    const [overlays, setOverlays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        // Fetch overlays, optionally filtered by genre
        const url = genre 
            ? `/api/overlays?genre=${encodeURIComponent(genre)}` 
            : `/api/overlays`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch overlays');
                return res.json();
            })
            .then(data => {
                if (isMounted) {
                    setOverlays(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error('[useOverlays] Error fetching:', err);
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [genre]);

    return { overlays, loading, error };
}
