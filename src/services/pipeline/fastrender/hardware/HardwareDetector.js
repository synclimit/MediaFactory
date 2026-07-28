import { HardwareProfile } from './HardwareProfile.js';

export class HardwareDetector {
    detect() {
        // Mock hardware detection logic for Windows/Node.js environment
        return new HardwareProfile(
            'Intel Core i9 / AMD Ryzen 9',
            16,
            '32GB',
            'NVIDIA GeForce RTX 4090',
            '24GB',
            'NVMe Gen4',
            ['NVENC', 'QSV']
        );
    }
}
