import { useState } from 'react'
import './App.css'
import CPUVisualizer from './components/CPUComponents/CPUVisualizer'
import MemoryHierarchyVisualizer from './components/MemoryHierarchy/MemoryHierarchyVisualizer'

// Tab types
enum TabType {
  CPU_CORE = 'CPU_CORE',
  MEMORY_HIERARCHY = 'MEMORY_HIERARCHY'
}

function App() {
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>(TabType.CPU_CORE)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>CompOrg Core Explorer</h1>
        <p className="app-description">
          CPU指令执行流程可视化工具 - 探索计算机组成原理的核心概念
        </p>
      </header>

      <div className="app-tabs">
        <button
          className={`tab-button ${activeTab === TabType.CPU_CORE ? 'active' : ''}`}
          onClick={() => setActiveTab(TabType.CPU_CORE)}
        >
          <strong>CPU核心可视化</strong>
        </button>
        <button
          className={`tab-button ${activeTab === TabType.MEMORY_HIERARCHY ? 'active' : ''}`}
          onClick={() => setActiveTab(TabType.MEMORY_HIERARCHY)}
        >
          <strong>存储器层次结构</strong>
        </button>
      </div>

      <main className="app-content">
        {activeTab === TabType.CPU_CORE && <CPUVisualizer />}
        {activeTab === TabType.MEMORY_HIERARCHY && <MemoryHierarchyVisualizer />}
      </main>

      <footer className="app-footer">
        <p>基于React开发的CPU指令执行流程可视化工具</p>
      </footer>
    </div>
  )
}

export default App
