class DomainResolver {
    static resolve(url) {
        try {
            const hostname = new URL(url).hostname;
            if (hostname.includes('detik.com')) return 'detik.com';
            if (hostname.includes('kompas.com')) return 'kompas.com';
            if (hostname.includes('cnnindonesia.com')) return 'cnnindonesia.com';
            if (hostname.includes('tempo.co')) return 'tempo.co';
            if (hostname.includes('tribunnews.com')) return 'tribunnews.com';
            return 'generic';
        } catch (e) {
            return 'generic';
        }
    }
}

module.exports = DomainResolver;
