import re

# 1. Patch M5NewsCreator.jsx
with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update reader event handler
old_reader = """      if (module === 'reader') {
         setSource(new URL(data.url).hostname.replace('www.', ''));
      }"""
new_reader = """      if (module === 'reader') {
         try { setSource(new URL(data.url).hostname.replace('www.', '')); } catch(e) {}
         if (data.title) setHeadline(data.title);
         if (data.body) setSummary(data.body.substring(0, 150) + '...');
      }"""
content = content.replace(old_reader, new_reader)

# Update complete handler to check success flag
old_complete = """    sse.addEventListener('news_pipeline_complete', (e) => {
      setIsProcessing(false);
      setPipelineProgress('Draft Ready');
    });"""
new_complete = """    sse.addEventListener('news_pipeline_complete', (e) => {
      setIsProcessing(false);
      try {
          const result = JSON.parse(e.data);
          if (result && result.success === false) {
              setPipelineProgress('Pipeline Error: ' + (result.error || ''));
              return;
          }
      } catch(err) {}
      setPipelineProgress('Draft Ready');
    });"""
content = content.replace(old_complete, new_complete)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Patch backend/api/m5.js
with open('backend/api/m5.js', 'r', encoding='utf-8') as f:
    m5_content = f.read()

old_m5_complete = """    pipeline.startWorkflow(url, mockDependencies).then(result => {
        broadcastProgress();
        broadcastSseEvent('news_pipeline_complete', result);
    }).catch(err => {"""
new_m5_complete = """    pipeline.startWorkflow(url, mockDependencies).then(result => {
        broadcastProgress();
        if (!result.success) {
            broadcastSseEvent('news_pipeline_error', { error: result.error });
            // also send complete event with success: false for frontend logic
            broadcastSseEvent('news_pipeline_complete', result);
        } else {
            broadcastSseEvent('news_pipeline_complete', result);
        }
    }).catch(err => {"""
m5_content = m5_content.replace(old_m5_complete, new_m5_complete)

with open('backend/api/m5.js', 'w', encoding='utf-8') as f:
    f.write(m5_content)

print("Patched M5NewsCreator and m5.js")
