import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStepForward, faStop, faRedo } from '@fortawesome/free-solid-svg-icons';
import {
  CPUComponentType,
  ExecutionStage,
  DataFlowDirection,
  Instruction,
  CPUState,
  initialCPUState,
  PREDEFINED_INSTRUCTIONS,
  InstructionType
} from '../../models/CPUModel';
import './CPUVisualizer.css';

// CPU组件位置配置
const componentPositions: Record<CPUComponentType, { x: number, y: number, width: number, height: number }> = {
  [CPUComponentType.PC]: { x: 50, y: 150, width: 80, height: 60 },
  [CPUComponentType.IR]: { x: 200, y: 150, width: 100, height: 60 },
  [CPUComponentType.DECODER]: { x: 350, y: 150, width: 120, height: 60 },
  [CPUComponentType.ALU]: { x: 350, y: 250, width: 120, height: 80 },
  [CPUComponentType.REGISTER]: { x: 200, y: 300, width: 100, height: 120 },
  [CPUComponentType.MEMORY]: { x: 50, y: 250, width: 100, height: 120 },
  [CPUComponentType.BUS]: { x: 0, y: 0, width: 0, height: 0 } // 总线通过线条表示
};

// 数据流动路径配置
const dataFlowPaths: Record<DataFlowDirection, { from: CPUComponentType, to: CPUComponentType, path: string }> = {
  [DataFlowDirection.PC_TO_MEMORY]: {
    from: CPUComponentType.PC,
    to: CPUComponentType.MEMORY,
    path: 'M90,210 L90,250'
  },
  [DataFlowDirection.MEMORY_TO_IR]: {
    from: CPUComponentType.MEMORY,
    to: CPUComponentType.IR,
    path: 'M150,280 L200,180'
  },
  [DataFlowDirection.IR_TO_DECODER]: {
    from: CPUComponentType.IR,
    to: CPUComponentType.DECODER,
    path: 'M300,180 L350,180'
  },
  [DataFlowDirection.DECODER_TO_ALU]: {
    from: CPUComponentType.DECODER,
    to: CPUComponentType.ALU,
    path: 'M410,210 L410,250'
  },
  [DataFlowDirection.ALU_TO_REGISTER]: {
    from: CPUComponentType.ALU,
    to: CPUComponentType.REGISTER,
    path: 'M350,290 L300,330'
  }
};

interface CPUVisualizerProps {
  // 可以添加自定义属性
}

const CPUVisualizer: React.FC<CPUVisualizerProps> = () => {
  // CPU状态
  const [cpuState, setCpuState] = useState<CPUState>(initialCPUState);
  // 选中的指令
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  // 动画速度 (毫秒)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
  // 是否正在执行
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  // 动画计时器
  const animationTimerRef = useRef<number | null>(null);

  // 清除动画计时器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // 选择指令
  const handleInstructionSelect = (instruction: Instruction) => {
    setSelectedInstruction(instruction);
    // 重置CPU状态，但保留当前寄存器值
    setCpuState(prevState => ({
      ...initialCPUState,
      registers: { ...prevState.registers },
      currentInstruction: instruction
    }));
  };

  // 开始执行指令
  const startExecution = () => {
    if (!selectedInstruction || isExecuting) return;

    setIsExecuting(true);
    executeNextStage();
  };

  // 单步执行
  const executeStep = () => {
    if (!selectedInstruction || isExecuting) return;

    executeNextStage();
  };

  // 停止执行
  const stopExecution = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsExecuting(false);
  };

  // 重置执行
  const resetExecution = () => {
    stopExecution();
    if (selectedInstruction) {
      setCpuState(prevState => ({
        ...initialCPUState,
        registers: { ...prevState.registers },
        currentInstruction: selectedInstruction
      }));
    } else {
      setCpuState(prevState => ({
        ...initialCPUState,
        registers: { ...prevState.registers }
      }));
    }
  };

  // 执行下一个阶段
  const executeNextStage = () => {
    setCpuState(prevState => {
      let nextState = { ...prevState };

      // 根据当前阶段确定下一个阶段
      switch (prevState.currentStage) {
        case ExecutionStage.IDLE:
          nextState = executeFetchStage(prevState);
          break;
        case ExecutionStage.FETCH:
          nextState = executeDecodeStage(prevState);
          break;
        case ExecutionStage.DECODE:
          nextState = executeExecuteStage(prevState);
          break;
        case ExecutionStage.EXECUTE:
          nextState = executeWritebackStage(prevState);
          break;
        case ExecutionStage.WRITEBACK:
          // 执行完成，回到空闲状态
          nextState = {
            ...prevState,
            currentStage: ExecutionStage.IDLE,
            activeComponents: [],
            activeDataFlows: []
          };
          setIsExecuting(false);
          return nextState;
      }

      // 如果正在执行，设置下一阶段的计时器
      if (isExecuting && nextState.currentStage !== ExecutionStage.IDLE) {
        animationTimerRef.current = setTimeout(() => {
          executeNextStage();
        }, animationSpeed);
      }

      return nextState;
    });
  };

  // 取指阶段
  const executeFetchStage = (state: CPUState): CPUState => {
    return {
      ...state,
      currentStage: ExecutionStage.FETCH,
      activeComponents: [CPUComponentType.PC, CPUComponentType.MEMORY, CPUComponentType.IR],
      activeDataFlows: [DataFlowDirection.PC_TO_MEMORY, DataFlowDirection.MEMORY_TO_IR],
      pc: state.pc + 1 // 更新PC
    };
  };

  // 译码阶段
  const executeDecodeStage = (state: CPUState): CPUState => {
    return {
      ...state,
      currentStage: ExecutionStage.DECODE,
      activeComponents: [CPUComponentType.IR, CPUComponentType.DECODER],
      activeDataFlows: [DataFlowDirection.IR_TO_DECODER]
    };
  };

  // 执行阶段
  const executeExecuteStage = (state: CPUState): CPUState => {
    const newState = {
      ...state,
      currentStage: ExecutionStage.EXECUTE,
      activeComponents: [CPUComponentType.DECODER, CPUComponentType.ALU],
      activeDataFlows: [DataFlowDirection.DECODER_TO_ALU]
    };

    // 根据指令类型执行不同操作
    if (state.currentInstruction) {
      const instruction = state.currentInstruction;

      switch (instruction.type) {
        case InstructionType.ADD:
          if (instruction.operands.length >= 3) {
            const [dest, src1, src2] = instruction.operands;
            const val1 = state.registers[src1] || 0;
            const val2 = state.registers[src2] || 0;
            newState.registers = {
              ...state.registers,
              [dest]: val1 + val2
            };
          }
          break;

        case InstructionType.SUB:
          if (instruction.operands.length >= 3) {
            const [dest, src1, src2] = instruction.operands;
            const val1 = state.registers[src1] || 0;
            const val2 = state.registers[src2] || 0;
            newState.registers = {
              ...state.registers,
              [dest]: val1 - val2
            };
          }
          break;

        case InstructionType.LOAD:
          if (instruction.operands.length >= 2) {
            const [dest, src] = instruction.operands;
            // 从内存地址加载，格式如 M[100]
            const memMatch = src.match(/M\[(\d+)\]/);
            if (memMatch) {
              const memAddr = memMatch[1];
              newState.registers = {
                ...state.registers,
                [dest]: state.memory[memAddr] || 0
              };
            }
          }
          break;

        case InstructionType.STORE:
          if (instruction.operands.length >= 2) {
            const [dest, src] = instruction.operands;
            // 存储到内存地址，格式如 M[100]
            const memMatch = dest.match(/M\[(\d+)\]/);
            if (memMatch) {
              const memAddr = memMatch[1];
              newState.memory = {
                ...state.memory,
                [memAddr]: state.registers[src] || 0
              };
            }
          }
          break;

        case InstructionType.JUMP:
          if (instruction.operands.length >= 1) {
            const target = parseInt(instruction.operands[0]);
            if (!isNaN(target)) {
              newState.pc = target;
            }
          }
          break;
      }
    }

    return newState;
  };

  // 写回阶段
  const executeWritebackStage = (state: CPUState): CPUState => {
    return {
      ...state,
      currentStage: ExecutionStage.WRITEBACK,
      activeComponents: [CPUComponentType.ALU, CPUComponentType.REGISTER],
      activeDataFlows: [DataFlowDirection.ALU_TO_REGISTER]
    };
  };

  // 渲染CPU组件
  const renderCPUComponent = (type: CPUComponentType) => {
    const position = componentPositions[type];
    const isActive = cpuState.activeComponents.includes(type);

    return (
      <div
        key={type}
        className={`cpu-component ${type.toLowerCase()} ${isActive ? 'active' : ''}`}
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

  // 渲染组件内容
  const renderComponentContent = (type: CPUComponentType) => {
    switch (type) {
      case CPUComponentType.PC:
        return <div className="component-value">PC: {cpuState.pc}</div>;
      case CPUComponentType.IR:
        return <div className="component-value">
          {cpuState.currentInstruction ?
            `${cpuState.currentInstruction.type} ${cpuState.currentInstruction.operands.join(', ')}` :
            'No Instruction'}
        </div>;
      case CPUComponentType.REGISTER:
        return (
          <div className="register-values">
            {Object.entries(cpuState.registers).map(([reg, value]) => (
              <div key={reg} className="register-entry">
                {reg}: {value}
              </div>
            ))}
          </div>
        );
      case CPUComponentType.MEMORY:
        return (
          <div className="memory-values">
            {Object.keys(cpuState.memory).length > 0 ?
              Object.entries(cpuState.memory).slice(0, 3).map(([addr, value]) => (
                <div key={addr} className="memory-entry">
                  M[{addr}]: {value}
                </div>
              )) :
              <div className="memory-entry">Empty</div>
            }
            {Object.keys(cpuState.memory).length > 3 &&
              <div className="memory-entry">...</div>
            }
          </div>
        );
      default:
        return null;
    }
  };

  // 渲染数据流动路径
  const renderDataFlows = () => {
    return (
      <svg className="data-flow-svg" width="500" height="400">
        {Object.entries(dataFlowPaths).map(([direction, pathInfo]) => {
          const isActive = cpuState.activeDataFlows.includes(direction as DataFlowDirection);
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

  // 处理寄存器值变化
  const handleRegisterChange = (register: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setCpuState(prevState => ({
        ...prevState,
        registers: {
          ...prevState.registers,
          [register]: numValue
        }
      }));
    }
  };

  // 处理内存值变化
  const handleMemoryChange = (address: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setCpuState(prevState => ({
        ...prevState,
        memory: {
          ...prevState.memory,
          [address]: numValue
        }
      }));
    }
  };

  // 添加新的内存地址
  const [newMemoryAddress, setNewMemoryAddress] = useState<string>('');
  const [newMemoryValue, setNewMemoryValue] = useState<string>('0');

  const handleAddMemory = () => {
    const address = parseInt(newMemoryAddress);
    const value = parseInt(newMemoryValue);

    if (!isNaN(address) && !isNaN(value)) {
      setCpuState(prevState => ({
        ...prevState,
        memory: {
          ...prevState.memory,
          [address]: value
        }
      }));
      setNewMemoryAddress('');
      setNewMemoryValue('0');
    }
  };

  return (
    <div className="cpu-visualizer">
      <div className="cpu-diagram">
        {renderDataFlows()}
        {Object.values(CPUComponentType).map(type => renderCPUComponent(type))}
        <div className="execution-stage">
          当前阶段: {cpuState.currentStage}
        </div>
      </div>

      <div className="control-panel">
        <div className="instruction-selector">
          <h3>选择指令</h3>
          <div className="instruction-list">
            {PREDEFINED_INSTRUCTIONS.map((instruction, index) => (
              <div
                key={index}
                className={`instruction-item ${selectedInstruction === instruction ? 'selected' : ''}`}
                onClick={() => handleInstructionSelect(instruction)}
              >
                <div className="instruction-type">{instruction.type}</div>
                <div className="instruction-desc">{instruction.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="register-controls">
          <h3>寄存器初始值</h3>
          <div className="register-inputs">
            {Object.entries(cpuState.registers).map(([register, value]) => (
              <div key={register} className="register-input-group">
                <label htmlFor={`register-${register}`}>{register}:</label>
                <input
                  id={`register-${register}`}
                  type="number"
                  value={value}
                  onChange={(e) => handleRegisterChange(register, e.target.value)}
                  disabled={isExecuting}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="memory-controls">
          <h3>内存值</h3>
          <div className="memory-inputs">
            {Object.entries(cpuState.memory).map(([address, value]) => (
              <div key={address} className="memory-input-group">
                <label htmlFor={`memory-${address}`}>M[{address}]:</label>
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
                <label htmlFor="new-memory-address">地址:</label>
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
              onClick={startExecution}
              disabled={!selectedInstruction || isExecuting}
            >
              <FontAwesomeIcon icon={faPlay} /> 自动执行
            </button>
            <button
              onClick={executeStep}
              disabled={!selectedInstruction || isExecuting}
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

export default CPUVisualizer;