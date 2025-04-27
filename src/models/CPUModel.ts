// CPU模型定义

// CPU组件类型
export enum CPUComponentType {
  PC = 'PC',            // 程序计数器
  IR = 'IR',            // 指令寄存器
  DECODER = 'DECODER',  // 指令译码器
  ALU = 'ALU',          // 算术逻辑单元
  REGISTER = 'REGISTER',// 寄存器
  MEMORY = 'MEMORY',    // 内存
  BUS = 'BUS'           // 总线
}

// 指令执行阶段
export enum ExecutionStage {
  IDLE = 'IDLE',        // 空闲状态
  FETCH = 'FETCH',      // 取指令
  DECODE = 'DECODE',    // 译码
  EXECUTE = 'EXECUTE',  // 执行
  WRITEBACK = 'WRITEBACK' // 写回
}

// 数据流动方向
export enum DataFlowDirection {
  PC_TO_MEMORY = 'PC_TO_MEMORY',
  MEMORY_TO_IR = 'MEMORY_TO_IR',
  IR_TO_DECODER = 'IR_TO_DECODER',
  DECODER_TO_ALU = 'DECODER_TO_ALU',
  ALU_TO_REGISTER = 'ALU_TO_REGISTER'
}

// 指令类型
export enum InstructionType {
  ADD = 'ADD',          // 加法
  SUB = 'SUB',          // 减法
  LOAD = 'LOAD',        // 加载
  STORE = 'STORE',      // 存储
  JUMP = 'JUMP'         // 跳转
}

// 指令格式
export interface Instruction {
  type: InstructionType;
  operands: string[];
  description: string;
}

// 预定义的指令集
export const PREDEFINED_INSTRUCTIONS: Instruction[] = [
  {
    type: InstructionType.ADD,
    operands: ['R1', 'R2', 'R3'],
    description: 'R1 = R2 + R3'
  },
  {
    type: InstructionType.SUB,
    operands: ['R1', 'R2', 'R3'],
    description: 'R1 = R2 - R3'
  },
  {
    type: InstructionType.LOAD,
    operands: ['R1', 'M[100]'],
    description: 'R1 = Memory[100]'
  },
  {
    type: InstructionType.STORE,
    operands: ['M[100]', 'R1'],
    description: 'Memory[100] = R1'
  },
  {
    type: InstructionType.JUMP,
    operands: ['200'],
    description: 'PC = 200'
  }
];

// CPU执行状态
export interface CPUState {
  currentStage: ExecutionStage;
  activeComponents: CPUComponentType[];
  activeDataFlows: DataFlowDirection[];
  currentInstruction: Instruction | null;
  registers: Record<string, number>;
  memory: Record<string, number>;
  pc: number;
}

// 初始CPU状态
export const initialCPUState: CPUState = {
  currentStage: ExecutionStage.IDLE,
  activeComponents: [],
  activeDataFlows: [],
  currentInstruction: null,
  registers: {
    'R1': 0,
    'R2': 5,
    'R3': 10,
    'R4': 15
  },
  memory: {
    '100': 42  // 为LOAD指令预设一个内存值
  },
  pc: 0
};