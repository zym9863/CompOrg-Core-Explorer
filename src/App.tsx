import './App.css'
import CPUVisualizer from './components/CPUComponents/CPUVisualizer'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>CompOrg Core Explorer</h1>
        <p className="app-description">
          CPU指令执行流程可视化工具 - 探索计算机组成原理的核心概念
        </p>
      </header>
      
      <main className="app-content">
        <CPUVisualizer />
      </main>
      
      <footer className="app-footer">
        <p>基于React开发的CPU指令执行流程可视化工具</p>
      </footer>
    </div>
  )
}

export default App
