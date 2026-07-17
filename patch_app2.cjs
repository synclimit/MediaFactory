const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const additionalHook = `
  // Auto Save when Scheduler changes
  useEffect(() => {
    const unsubscribe = m2SchedulerService.registerStateChange((state) => {
      m2WorkspacePersistence.saveWorkspace({
        sources: m2AudioPool,
        renderPlans: m2Plans,
        queue: m2Queue,
        scheduler: state,
        cacheSnapshot: { fileCount: 0, sizeMb: 0 }
      });
    });
    return unsubscribe;
  }, [m2AudioPool, m2Plans, m2Queue]);
`;

content = content.replace("// Handlers for Workspace Panel", additionalHook + "\n  // Handlers for Workspace Panel");
fs.writeFileSync('src/App.jsx', content, 'utf8');
