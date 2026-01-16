import React, { useState, useEffect } from 'react';
import { Play, LayoutDashboard, Settings, Sun, Moon, LogOut, FileText, Cpu, Layers } from 'lucide-react';
import Terminal from './components/Terminal';
import Reports from './components/Reports';
import { LogEntry, RunConfig } from './types';
import { ARCHITECTURE_OPTIONS, CONTEXT_OPTIONS } from './constants';

const App: React.FC = () => {
  // Theme Management
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'run' | 'reports'>('run');
  
  // Form State
  const [config, setConfig] = useState<RunConfig>({
    appIds: '',
    version: '',
    architecture: 'x64',
    context: 'system'
  });

  // Execution State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Initial Welcome Log
  useEffect(() => {
    addLog('System initialized. Ready for input.', 'info');
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' }),
      message,
      type
    }]);
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.appIds.trim()) {
      addLog('Error: Application IDs are required.', 'error');
      return;
    }

    setIsRunning(true);
    setLogs([]); // Clear logs on new run
    addLog('Initiating Automattuner Protocol...', 'info');
    addLog(`Configuration: ${config.architecture} | ${config.context}`, 'info');

    // Simulate API Call - Replace this with real fetch in production
    // const response = await fetch('/api/run', { method: 'POST', body: JSON.stringify(config) });
    
    try {
      // Simulation steps
      await new Promise(r => setTimeout(r, 800));
      addLog(`Analyzing package manifests for: ${config.appIds}`, 'info');
      
      await new Promise(r => setTimeout(r, 1500));
      const apps = config.appIds.split(',');
      for (const app of apps) {
        addLog(`> Processing ${app.trim()}...`, 'info');
        await new Promise(r => setTimeout(r, 600));
        addLog(`> Validating architecture compatibility (${config.architecture})`, 'success');
      }

      await new Promise(r => setTimeout(r, 1000));
      addLog('Generating optimization profile...', 'warning');
      
      await new Promise(r => setTimeout(r, 800));
      addLog('Process completed successfully. Report generated.', 'success');

    } catch (err) {
      addLog('Critical Failure during execution.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg transition-colors duration-300 font-sans">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b border-slate-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="bg-primary-600 p-1.5 rounded-lg shadow-lg shadow-primary-500/30">
                  <Settings className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Automattuner <span className="text-amber-500 text-sm font-medium px-1.5 py-0.5 bg-amber-500/10 rounded-md">BETA</span>
                </span>
              </div>
              
              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => setActiveTab('run')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'run' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Run Engine
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'reports' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Tenant Reports
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-slate-500">Global Admin</p>
                </div>
                <button className="text-slate-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'run' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            
            {/* Configuration Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-dark-border p-6 flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Configuration
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Define execution parameters for the tuning engine.
                  </p>
                </div>

                <form onSubmit={handleRun} className="flex flex-col gap-6 flex-1">
                  <div>
                    <label htmlFor="appIds" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Application IDs
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 text-slate-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <textarea
                        id="appIds"
                        value={config.appIds}
                        onChange={(e) => setConfig({ ...config, appIds: e.target.value })}
                        placeholder="e.g. Mozilla.Firefox, Zoom.Zoom"
                        rows={4}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 resize-none transition-all"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">Comma-separated list of application identifiers.</p>
                  </div>

                  <div>
                    <label htmlFor="version" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Target Version <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="version"
                        value={config.version}
                        onChange={(e) => setConfig({ ...config, version: e.target.value })}
                        placeholder="Latest"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Architecture
                      </label>
                      <div className="relative">
                        <Cpu className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-400" />
                        <select
                          value={config.architecture}
                          onChange={(e) => setConfig({ ...config, architecture: e.target.value as any })}
                          className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm text-slate-900 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          {ARCHITECTURE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Install Context
                      </label>
                      <div className="relative">
                        <Settings className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-400" />
                        <select
                          value={config.context}
                          onChange={(e) => setConfig({ ...config, context: e.target.value as any })}
                          className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm text-slate-900 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          {CONTEXT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      type="submit"
                      disabled={isRunning}
                      className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${isRunning ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-primary-500/20'}`}
                    >
                      {isRunning ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Initiate Sequence
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="lg:col-span-7 h-full min-h-[400px]">
              <Terminal logs={logs} isRunning={isRunning} />
            </div>

          </div>
        ) : (
          <Reports />
        )}
      </main>
    </div>
  );
};

export default App;
