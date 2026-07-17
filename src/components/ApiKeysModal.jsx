import React, { useState, useEffect } from 'react';

const PROVIDERS = [
  { id: 'google', name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq', name: 'Groq', url: 'https://console.groq.com/keys' },
  { id: 'cerebras', name: 'Cerebras', url: 'https://cloud.cerebras.ai/platform/api-keys' },
  { id: 'sambanova', name: 'SambaNova', url: 'https://cloud.sambanova.ai/apis' },
  { id: 'nvidia', name: 'NVIDIA NIM', url: 'https://build.nvidia.com/explore/discover' },
  { id: 'mistral', name: 'Mistral', url: 'https://console.mistral.ai/api-keys/' },
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/keys' },
  { id: 'github', name: 'GitHub Models', url: 'https://github.com/settings/tokens' },
  { id: 'cohere', name: 'Cohere', url: 'https://dashboard.cohere.com/api-keys' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', url: 'https://dash.cloudflare.com/' },
  { id: 'zhipu', name: 'Zhipu AI (Z.ai)', url: 'https://open.bigmodel.cn/usercenter/apikeys' },
  { id: 'ollama', name: 'Ollama Cloud', url: 'https://ollama.com/' },
  { id: 'kilo', name: 'Kilo Gateway (no key needed)', url: '' }
];

export default function ApiKeysModal({ onClose, apiKeys, setApiKeys }) {
  const [providerPlatform, setProviderPlatform] = useState(PROVIDERS[0].id);
  const [providerKey, setProviderKey] = useState('');
  const [providerLabel, setProviderLabel] = useState('');

  const [customBaseUrl, setCustomBaseUrl] = useState('http://127.0.0.1:11434/v1');
  const [customModel, setCustomModel] = useState('qwen3:4b');
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [customKey, setCustomKey] = useState('');

  const handleAddProviderKey = () => {
    if (!providerKey.trim() && providerPlatform !== 'kilo') return;
    
    const providerInfo = PROVIDERS.find(p => p.id === providerPlatform);
    const newKey = {
      id: Date.now().toString(),
      type: 'provider',
      platform: providerPlatform,
      platformName: providerInfo.name,
      key: providerKey,
      label: providerLabel,
      status: 'untested',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setApiKeys(prev => [...prev, newKey]);
    setProviderKey('');
    setProviderLabel('');
  };

  const handleAddCustomModel = () => {
    if (!customBaseUrl.trim() || !customModel.trim()) return;
    
    const newKey = {
      id: Date.now().toString(),
      type: 'custom',
      baseUrl: customBaseUrl,
      model: customModel,
      displayName: customDisplayName,
      key: customKey,
      status: 'untested',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setApiKeys(prev => [...prev, newKey]);
    setCustomDisplayName('');
    setCustomKey('');
  };

  const handleCheck = (id) => {
    setApiKeys(prev => prev.map(k => {
      if (k.id === id) return { ...k, status: 'checking' };
      return k;
    }));
    
    setTimeout(() => {
      setApiKeys(prev => prev.map(k => {
        if (k.id === id) {
          // Simulate 80% pass rate
          const isHealthy = Math.random() > 0.2;
          return { ...k, status: isHealthy ? 'healthy' : 'invalid' };
        }
        return k;
      }));
    }, 1000);
  };

  const handleRemove = (id) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const selectedProvider = PROVIDERS.find(p => p.id === providerPlatform);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[900px] max-h-[90vh] bg-[#0A0B10] border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f1115]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              FreeLLMAPI Configuration
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 text-gray-300">
          
          {/* Section 1: Provider */}
          <section className="space-y-4">
            <h3 className="text-white font-bold">Add a provider key</h3>
            <div className="flex items-end gap-4 p-4 border border-white/10 rounded-lg bg-[#14151b]">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-500">Platform</label>
                <select 
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={providerPlatform}
                  onChange={(e) => setProviderPlatform(e.target.value)}
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProvider?.url && (
                  <a href={selectedProvider.url} target="_blank" rel="noreferrer" className="inline-block mt-1 text-[11px] text-orange-400 hover:text-orange-300">
                    Get API key ↗
                  </a>
                )}
              </div>
              
              <div className="flex-[2] space-y-1">
                <label className="text-[11px] font-bold text-gray-500">API key</label>
                <input 
                  type="password"
                  placeholder="paste key here"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={providerKey}
                  onChange={(e) => setProviderKey(e.target.value)}
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-500">Label</label>
                <input 
                  type="text"
                  placeholder="optional"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={providerLabel}
                  onChange={(e) => setProviderLabel(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAddProviderKey}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-colors border border-white/5 whitespace-nowrap font-medium"
              >
                Add key
              </button>
            </div>
          </section>

          {/* Section 2: Custom Model */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-white font-bold">Add a custom OpenAI-compatible model</h3>
              <p className="text-xs text-gray-500">
                Point at any OpenAI-compatible endpoint: llama.cpp, LM Studio, vLLM, a local Ollama, or a remote gateway.
              </p>
            </div>
            
            <div className="flex items-end gap-4 p-4 border border-white/10 rounded-lg bg-[#14151b]">
              <div className="flex-[2] space-y-1">
                <label className="text-[11px] font-bold text-gray-500">Base URL</label>
                <input 
                  type="text"
                  placeholder="http://127.0.0.1:11434/v1"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-500">Model</label>
                <input 
                  type="text"
                  placeholder="qwen3:4b"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-500">Display name</label>
                <input 
                  type="text"
                  placeholder="optional"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={customDisplayName}
                  onChange={(e) => setCustomDisplayName(e.target.value)}
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-gray-500">API key</label>
                <input 
                  type="password"
                  placeholder="optional"
                  className="w-full bg-[#0a0b10] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAddCustomModel}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-colors border border-white/5 whitespace-nowrap font-medium"
              >
                Add model
              </button>
            </div>
          </section>

          {/* Section 3: List */}
          <section className="space-y-4 pb-8">
            <h3 className="text-white font-bold flex items-center justify-between">
              Configured providers
              <span className="text-xs font-normal text-gray-500">{apiKeys.length} keys</span>
            </h3>

            {apiKeys.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-lg text-gray-600 text-sm">
                No keys configured yet
              </div>
            ) : (
              <div className="border border-white/10 rounded-lg overflow-hidden bg-[#14151b]">
                {apiKeys.map((k, idx) => (
                  <div key={k.id} className={`flex items-center justify-between p-4 ${idx !== apiKeys.length - 1 ? 'border-b border-white/5' : ''}`}>
                    
                    <div className="flex items-center gap-3 w-1/3">
                      <span className={`w-2 h-2 rounded-full ${
                        k.status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                        k.status === 'invalid' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                        k.status === 'checking' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-600'
                      }`}></span>
                      
                      <div className="font-medium text-sm text-gray-200">
                        {k.type === 'provider' ? k.platformName : k.displayName || k.model}
                      </div>
                      
                      {k.status === 'healthy' && <span className="text-[10px] text-green-500 font-medium">healthy</span>}
                      {k.status === 'invalid' && <span className="text-[10px] text-red-500 font-medium">invalid</span>}
                    </div>

                    <div className="flex-1 font-mono text-xs text-gray-500 flex items-center gap-2">
                      {k.type === 'provider' ? (
                        <>
                          <span className="opacity-50">API Key:</span>
                          <span>{k.key ? `${k.key.substring(0,6)}...` : 'no-key'}</span>
                          {k.label && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] uppercase ml-2">{k.label}</span>}
                        </>
                      ) : (
                        <>
                          <span className="opacity-50">URL:</span>
                          <span className="truncate max-w-[200px]">{k.baseUrl}</span>
                          <span className="opacity-50 ml-2">Model:</span>
                          <span>{k.model}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-600 font-mono">{k.timestamp}</span>
                      
                      <button 
                        onClick={() => handleCheck(k.id)}
                        disabled={k.status === 'checking'}
                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <svg className={`w-3.5 h-3.5 ${k.status === 'checking' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Check
                      </button>
                      
                      <button 
                        onClick={() => handleRemove(k.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
