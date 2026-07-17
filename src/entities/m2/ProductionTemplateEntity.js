export function createProductionTemplate(name, type, workspaceState, schedulerState) {
  const compilationSettings = {
    durationTarget: workspaceState.durationTarget || 15,
    outputCount: workspaceState.outputCount || 3,
    randomize: workspaceState.randomize !== undefined ? workspaceState.randomize : true
  };
  
  const audioProfile = workspaceState.audioProfile || null;
  const masteringSettings = workspaceState.masteringSettings || null;
  const namingPattern = workspaceState.namingPattern || '';
  const customPattern = workspaceState.customPattern || '';

  let fixedSources = [];
  if (type === 'FIXED' && workspaceState.sourcePool) {
    fixedSources = workspaceState.sourcePool.map(src => ({
      sourceId: src.id || src.sourceId,
      title: src.title || src.name || 'Unknown Source',
      sourceType: src.type || src.sourceType || 'FILE',
      youtubeUrl: src.url || src.youtubeUrl || null
    }));
  }

  return {
    schemaVersion: 1,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name || 'Untitled Template',
    type: type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    compilationSettings,
    audioProfile,
    masteringSettings,
    namingPattern: namingPattern === 'Custom' ? customPattern : namingPattern,
    schedulerSettings: schedulerState || null,
    fixedSources: type === 'FIXED' ? fixedSources : []
  };
}
