import { localStorageProvider } from '../../storage/LocalStorageProvider.js';
import { AudioProcessingProfile, AUDIO_PRESETS } from '../../entities/m2/AudioProcessingProfile.js';

const COLLECTION = 'm2_audio_profile';
const GLOBAL_ID = 'global_profile';

export class AudioProcessingProfileRepository {
  /**
   * Load the global profile. If it doesn't exist, create it with Neutral settings.
   * @returns {Promise<AudioProcessingProfile>}
   */
  async getGlobalProfile() {
    const record = await localStorageProvider.getById(COLLECTION, GLOBAL_ID);
    if (!record) {
      const defaultProfile = new AudioProcessingProfile({
        ...AUDIO_PRESETS['Neutral'],
        presetName: 'Neutral'
      });
      const toSave = { id: GLOBAL_ID, ...defaultProfile };
      await localStorageProvider.insert(COLLECTION, toSave);
      return new AudioProcessingProfile(toSave);
    }
    return new AudioProcessingProfile(record);
  }

  /**
   * Update the global profile.
   * @param {Object} changes - Partial profile updates
   * @returns {Promise<AudioProcessingProfile>}
   */
  async updateGlobalProfile(changes) {
    const record = await localStorageProvider.getById(COLLECTION, GLOBAL_ID);
    if (!record) {
      // If it doesn't exist somehow, initialize and then update
      await this.getGlobalProfile();
    }
    const updated = await localStorageProvider.update(COLLECTION, GLOBAL_ID, changes);
    return new AudioProcessingProfile(updated);
  }
}

export const audioProcessingProfileRepo = new AudioProcessingProfileRepository();
