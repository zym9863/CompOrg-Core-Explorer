import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStepForward, faStop, faRedo } from '@fortawesome/free-solid-svg-icons';
import {
  MemoryComponentType,
  MemoryOperationType,
  MemoryAccessStage,
  MemoryAccessResult,
  MemoryDataFlowDirection,
  MemoryAccessOperation,
  MemoryHierarchyState,
  initialMemoryHierarchyState,
  getCacheIndex,
  getCacheTag
} from '../../models/MemoryHierarchyModel';
import './MemoryHierarchyVisualizer.css';

// Component positions for visualization
const componentPositions: Record<MemoryComponentType, { x: number, y: number, width: number, height: number }> = {
  [MemoryComponentType.CPU]: { x: 50, y: 100, width: 100, height: 80 },
  [MemoryComponentType.CACHE]: { x: 250, y: 100, width: 150, height: 200 },
  [MemoryComponentType.MAIN_MEMORY]: { x: 500, y: 100, width: 150, height: 300 }
};

// Data flow paths
const dataFlowPaths: Record<MemoryDataFlowDirection, { from: MemoryComponentType, to: MemoryComponentType, path: string }> = {
  [MemoryDataFlowDirection.CPU_TO_CACHE]: {
    from: MemoryComponentType.CPU,
    to: MemoryComponentType.CACHE,
    path: 'M150,140 L250,140'
  },
  [MemoryDataFlowDirection.CACHE_TO_CPU]: {
    from: MemoryComponentType.CACHE,
    to: MemoryComponentType.CPU,
    path: 'M250,160 L150,160'
  },
  [MemoryDataFlowDirection.CACHE_TO_MAIN_MEMORY]: {
    from: MemoryComponentType.CACHE,
    to: MemoryComponentType.MAIN_MEMORY,
    path: 'M400,180 L500,180'
  },
  [MemoryDataFlowDirection.MAIN_MEMORY_TO_CACHE]: {
    from: MemoryComponentType.MAIN_MEMORY,
    to: MemoryComponentType.CACHE,
    path: 'M500,220 L400,220'
  }
};

interface MemoryHierarchyVisualizerProps {
  // Custom props if needed
}

const MemoryHierarchyVisualizer: React.FC<MemoryHierarchyVisualizerProps> = () => {
  // State
  const [memoryState, setMemoryState] = useState<MemoryHierarchyState>(initialMemoryHierarchyState);
  const [selectedOperation, setSelectedOperation] = useState<MemoryOperationType>(MemoryOperationType.READ);
  const [selectedAddress, setSelectedAddress] = useState<string>('100');
  const [writeData, setWriteData] = useState<string>('0');
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [newMemoryAddress, setNewMemoryAddress] = useState<string>('');
  const [newMemoryValue, setNewMemoryValue] = useState<string>('0');
  
  // Animation timer reference
  const animationTimerRef = useRef<number | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // Start memory access operation
  const startOperation = () => {
    if (isExecuting) return;

    const address = parseInt(selectedAddress);
    if (isNaN(address)) return;

    const operation: MemoryAccessOperation = {
      type: selectedOperation,
      address,
      data: selectedOperation === MemoryOperationType.WRITE ? parseInt(writeData) || 0 : undefined
    };

    setIsExecuting(true);
    setMemoryState(prevState => ({
      ...prevState,
      currentOperation: operation,
      currentStage: MemoryAccessStage.IDLE,
      activeComponents: [],
      activeDataFlows: [],
      accessResult: null
    }));

    executeNextStage();
  };

  // Execute single step
  const executeStep = () => {
    if (isExecuting) return;
    executeNextStage();
  };

  // Stop execution
  const stopExecution = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsExecuting(false);
  };

  // Reset to initial state
  const resetExecution = () => {
    stopExecution();
    setMemoryState(prevState => ({
      ...initialMemoryHierarchyState,
      mainMemory: { ...prevState.mainMemory },
      cacheHits: prevState.cacheHits,
      cacheMisses: prevState.cacheMisses
    }));
  };

  // Execute next stage of memory access
  const executeNextStage = () => {
    setMemoryState(prevState => {
      let nextState = { ...prevState };

      // Process based on current stage
      switch (prevState.currentStage) {
        case MemoryAccessStage.IDLE:
          nextState = executeCPURequestStage(prevState);
          break;
        case MemoryAccessStage.CPU_REQUEST:
          nextState = executeCheckCacheStage(prevState);
          break;
        case MemoryAccessStage.CHECK_CACHE:
          // Different flow based on cache hit/miss
          if (prevState.accessResult === MemoryAccessResult.HIT) {
            nextState = executeReturnDataStage(prevState);
          } else {
            nextState = executeAccessMainMemoryStage(prevState);
          }
          break;
        case MemoryAccessStage.ACCESS_MAIN_MEMORY:
          nextState = executeUpdateCacheStage(prevState);
          break;
        case MemoryAccessStage.UPDATE_CACHE:
          nextState = executeReturnDataStage(prevState);
          break;
        case MemoryAccessStage.RETURN_DATA:
          nextState = executeCompleteStage(prevState);
          break;
        case MemoryAccessStage.COMPLETE:
          // Execution complete, return to idle
          nextState = {
            ...prevState,
            currentStage: MemoryAccessStage.IDLE,
            activeComponents: [],
            activeDataFlows: []
          };
          setIsExecuting(false);
          return nextState;
      }

      // Schedule next stage if auto-executing
      if (isExecuting && nextState.currentStage !== MemoryAccessStage.IDLE) {
        animationTimerRef.current = setTimeout(() => {
          executeNextStage();
        }, animationSpeed);
      }

      return nextState;
    });
  };

  // CPU Request Stage
  const executeCPURequestStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    return {
      ...state,
      currentStage: MemoryAccessStage.CPU_REQUEST,
      activeComponents: [MemoryComponentType.CPU],
      activeDataFlows: [],
      cpuRegister: state.currentOperation?.type === MemoryOperationType.WRITE 
        ? (state.currentOperation.data || 0) 
        : null
    };
  };

  // Check Cache Stage
  const executeCheckCacheStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    if (!state.currentOperation) return state;

    const address = state.currentOperation.address;
    const cacheIndex = getCacheIndex(address, state.cacheSize);
    const cacheTag = getCacheTag(address, state.cacheSize);
    const cacheEntry = state.cache[cacheIndex];
    
    // Check if it's a cache hit
    const isHit = cacheEntry.valid && cacheEntry.tag === cacheTag;
    const result = isHit ? MemoryAccessResult.HIT : MemoryAccessResult.MISS;
    
    // Update hit/miss counters
    const cacheHits = isHit ? state.cacheHits + 1 : state.cacheHits;
    const cacheMisses = !isHit ? state.cacheMisses + 1 : state.cacheMisses;

    return {
      ...state,
      currentStage: MemoryAccessStage.CHECK_CACHE,
      activeComponents: [MemoryComponentType.CPU, MemoryComponentType.CACHE],
      activeDataFlows: [MemoryDataFlowDirection.CPU_TO_CACHE],
      accessResult: result,
      cacheHits,
      cacheMisses
    };
  };

  // Access Main Memory Stage (on cache miss)
  const executeAccessMainMemoryStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    return {
      ...state,
      currentStage: MemoryAccessStage.ACCESS_MAIN_MEMORY,
      activeComponents: [MemoryComponentType.CACHE, MemoryComponentType.MAIN_MEMORY],
      activeDataFlows: [MemoryDataFlowDirection.MAIN_MEMORY_TO_CACHE]
    };
  };

  // Update Cache Stage (after main memory access)
  const executeUpdateCacheStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    if (!state.currentOperation) return state;

    const address = state.currentOperation.address;
    const cacheIndex = getCacheIndex(address, state.cacheSize);
    const cacheTag = getCacheTag(address, state.cacheSize);
    
    // Get data from main memory
    const data = state.mainMemory[address] || 0;
    
    // Update cache
    const updatedCache = [...state.cache];
    updatedCache[cacheIndex] = {
      valid: true,
      tag: cacheTag,
      data: data,
      address: address
    };

    // For write operations, also update main memory
    let updatedMainMemory = { ...state.mainMemory };
    if (state.currentOperation.type === MemoryOperationType.WRITE && state.currentOperation.data !== undefined) {
      updatedMainMemory[address] = state.currentOperation.data;
      updatedCache[cacheIndex].data = state.currentOperation.data;
    }

    return {
      ...state,
      currentStage: MemoryAccessStage.UPDATE_CACHE,
      activeComponents: [MemoryComponentType.CACHE, MemoryComponentType.MAIN_MEMORY],
      activeDataFlows: [MemoryDataFlowDirection.MAIN_MEMORY_TO_CACHE],
      cache: updatedCache,
      mainMemory: updatedMainMemory
    };
  };

  // Return Data Stage
  const executeReturnDataStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    if (!state.currentOperation) return state;

    const address = state.currentOperation.address;
    const cacheIndex = getCacheIndex(address, state.cacheSize);
    
    // For read operations, get data from cache
    let cpuRegister = state.cpuRegister;
    if (state.currentOperation.type === MemoryOperationType.READ) {
      cpuRegister = state.cache[cacheIndex].data;
    }

    // For write operations with cache hit, update cache directly
    let updatedCache = [...state.cache];
    let updatedMainMemory = { ...state.mainMemory };
    if (state.accessResult === MemoryAccessResult.HIT && 
        state.currentOperation.type === MemoryOperationType.WRITE && 
        state.currentOperation.data !== undefined) {
      updatedCache[cacheIndex].data = state.currentOperation.data;
      updatedMainMemory[address] = state.currentOperation.data;
    }

    return {
      ...state,
      currentStage: MemoryAccessStage.RETURN_DATA,
      activeComponents: [MemoryComponentType.CPU, MemoryComponentType.CACHE],
      activeDataFlows: [MemoryDataFlowDirection.CACHE_TO_CPU],
      cpuRegister,
      cache: updatedCache,
      mainMemory: updatedMainMemory
    };
  };

  // Complete Stage
  const executeCompleteStage = (state: MemoryHierarchyState): MemoryHierarchyState => {
    return {
      ...state,
      currentStage: MemoryAccessStage.COMPLETE,
      activeComponents: [MemoryComponentType.CPU],
      activeDataFlows: []
    };
  };

  // Render memory component
  const renderMemoryComponent = (type: MemoryComponentType) => {
    const position = componentPositions[type];
    const isActive = memoryState.activeComponents.includes(type);

    return (
      <div
        key={type}
        className={`memory-component ${type.toLowerCase()} ${isActive ? 'active' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`
        }}
      >
        <div className="component-label">{type}</div>
        {renderComponentContent(type)}
      </div>
    );
  };

  // Render component content
  const renderComponentContent = (type: MemoryComponentType) => {
    switch (type) {
      case MemoryComponentType.CPU:
        return (
          <div className="component-content">
            <div className="cpu-register">
              <div className="register-label">Data Register:</div>
              <div className="register-value">{memoryState.cpuRegister !== null ? memoryState.cpuRegister : '-'}</div>
            </div>
            {memoryState.currentOperation && (
              <div className="cpu-operation">
                <div className="operation-type">{memoryState.currentOperation.type}</div>
                <div className="operation-address">Addr: {memoryState.currentOperation.address}</div>
                {memoryState.currentOperation.type === MemoryOperationType.WRITE && (
                  <div className="operation-data">Data: {memoryState.currentOperation.data}</div>
                )}
              </div>
            )}
          </div>
        );
      case MemoryComponentType.CACHE:
        return (
          <div className="component-content">
            <div className="cache-stats">
              <div>Hits: {memoryState.cacheHits}</div>
              <div>Misses: {memoryState.cacheMisses}</div>
              {memoryState.accessResult && (
                <div className={`cache-result ${memoryState.accessResult.toLowerCase()}`}>
                  {memoryState.accessResult}
                </div>
              )}
            </div>
            <div className="cache-entries">
              {memoryState.cache.map((entry, index) => (
                <div 
                  key={index} 
                  className={`cache-entry ${entry.valid ? 'valid' : 'invalid'} ${
                    memoryState.currentOperation && 
                    getCacheIndex(memoryState.currentOperation.address, memoryState.cacheSize) === index ? 
                    'active' : ''
                  }`}
                >
                  <div className="cache-index">Index: {index}</div>
                  <div className="cache-tag">Tag: {entry.valid ? entry.tag : '-'}</div>
                  <div className="cache-data">Data: {entry.valid ? entry.data : '-'}</div>
                  <div className="cache-address">Addr: {entry.valid ? entry.address : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case MemoryComponentType.MAIN_MEMORY:
        return (
          <div className="component-content">
            <div className="memory-entries">
              {Object.entries(memoryState.mainMemory).map(([address, value]) => (
                <div 
                  key={address} 
                  className={`memory-entry ${
                    memoryState.currentOperation && 
                    memoryState.currentOperation.address === parseInt(address) ? 
                    'active' : ''
                  }`}
                >
                  <div className="memory-address">Addr: {address}</div>
                  <div className="memory-value">Value: {value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render data flow paths
  const renderDataFlows = () => {
    return (
      <svg className="data-flow-svg" width="700" height="450">
        {Object.entries(dataFlowPaths).map(([direction, pathInfo]) => {
          const isActive = memoryState.activeDataFlows.includes(direction as MemoryDataFlowDirection);
          return (
            <g key={direction}>
              <path
                d={pathInfo.path}
                className={`data-flow-path ${isActive ? 'active' : ''}`}
                markerEnd="url(#arrowhead)"
              />
              {isActive && (
                <circle
                  className="data-flow-indicator"
                  r="5"
                >
                  <animateMotion
                    dur="1s"
                    repeatCount="indefinite"
                    path={pathInfo.path}
                  />
                </circle>
              )}
            </g>
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
      </svg>
    );
  };

  // Handle adding new memory address
  const handleAddMemory = () => {
    const address = parseInt(newMemoryAddress);
    const value = parseInt(newMemoryValue);

    if (!isNaN(address) && !isNaN(value)) {
      setMemoryState(prevState => ({
        ...prevState,
        mainMemory: {
          ...prevState.mainMemory,
          [address]: value
        }
      }));
      setNewMemoryAddress('');
      setNewMemoryValue('0');
    }
  };

  // Handle memory value change
  const handleMemoryChange = (address: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setMemoryState(prevState => ({
        ...prevState,
        mainMemory: {
          ...prevState.mainMemory,
          [address]: numValue
        }
      }));
    }
  };

  return (
    <div className="memory-hierarchy-visualizer">
      <div className="memory-diagram">
        {renderDataFlows()}
        {Object.values(MemoryComponentType).map(type => renderMemoryComponent(type))}
        <div className="access-stage">
          当前阶段: {memoryState.currentStage}
        </div>
      </div>

      <div className="control-panel">
        <div className="operation-selector">
          <h3>内存操作</h3>
          <div className="operation-type-selector">
            <label>操作类型:</label>
            <select 
              value={selectedOperation} 
              onChange={(e) => setSelectedOperation(e.target.value as MemoryOperationType)}
              disabled={isExecuting}
            >
              <option value={MemoryOperationType.READ}>读取 (Read)</option>
              <option value={MemoryOperationType.WRITE}>写入 (Write)</option>
            </select>
          </div>
          
          <div className="address-selector">
            <label>内存地址:</label>
            <input 
              type="number" 
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              disabled={isExecuting}
            />
          </div>
          
          {selectedOperation === MemoryOperationType.WRITE && (
            <div className="data-input">
              <label>写入数据:</label>
              <input 
                type="number" 
                value={writeData}
                onChange={(e) => setWriteData(e.target.value)}
                disabled={isExecuting}
              />
            </div>
          )}
          
          <button 
            className="execute-button"
            onClick={startOperation}
            disabled={isExecuting}
          >
            执行内存操作
          </button>
        </div>

        <div className="memory-controls">
          <h3>主存内容</h3>
          <div className="memory-inputs">
            {Object.entries(memoryState.mainMemory).map(([address, value]) => (
              <div key={address} className="memory-input-group">
                <label htmlFor={`memory-${address}`}>地址 {address}:</label>
                <input
                  id={`memory-${address}`}
                  type="number"
                  value={value}
                  onChange={(e) => handleMemoryChange(address, e.target.value)}
                  disabled={isExecuting}
                />
              </div>
            ))}
          </div>

          <div className="add-memory-form">
            <div className="add-memory-inputs">
              <div className="memory-input-group">
                <label htmlFor="new-memory-address">新地址:</label>
                <input
                  id="new-memory-address"
                  type="number"
                  value={newMemoryAddress}
                  onChange={(e) => setNewMemoryAddress(e.target.value)}
                  disabled={isExecuting}
                  placeholder="地址"
                />
              </div>
              <div className="memory-input-group">
                <label htmlFor="new-memory-value">值:</label>
                <input
                  id="new-memory-value"
                  type="number"
                  value={newMemoryValue}
                  onChange={(e) => setNewMemoryValue(e.target.value)}
                  disabled={isExecuting}
                  placeholder="值"
                />
              </div>
            </div>
            <button
              className="add-memory-button"
              onClick={handleAddMemory}
              disabled={isExecuting || !newMemoryAddress}
            >
              添加内存
            </button>
          </div>
        </div>

        <div className="execution-controls">
          <h3>执行控制</h3>
          <div className="speed-control">
            <label>动画速度:</label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
            />
            <span>{animationSpeed}ms</span>
          </div>

          <div className="control-buttons">
            <button
              onClick={startOperation}
              disabled={isExecuting}
            >
              <FontAwesomeIcon icon={faPlay} /> 自动执行
            </button>
            <button
              onClick={executeStep}
              disabled={isExecuting}
            >
              <FontAwesomeIcon icon={faStepForward} /> 单步执行
            </button>
            <button
              onClick={stopExecution}
              disabled={!isExecuting}
            >
              <FontAwesomeIcon icon={faStop} /> 停止
            </button>
            <button onClick={resetExecution}>
              <FontAwesomeIcon icon={faRedo} /> 重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryHierarchyVisualizer;
