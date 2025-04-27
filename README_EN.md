# CompOrg Core Explorer

English | [简体中文](./README.md)

## Project Overview

CompOrg Core Explorer is a CPU instruction execution flow visualization tool developed with React, designed to help learn the core concepts of computer organization. Through interactive animations, it displays the working status and data flow of various CPU components during instruction execution, making abstract computer architecture concepts intuitive and easy to understand.

## Key Features

- **CPU Component Visualization**: Intuitively displays core components such as PC, IR, Decoder, ALU, Registers, and Memory
- **Instruction Execution Flow Animation**: Shows the four stages of instruction execution through animation: Fetch, Decode, Execute, and Write-back
- **Data Flow Visualization**: Displays data flow paths between CPU components
- **Multiple Instruction Support**: Supports basic instructions such as ADD, SUB, LOAD, STORE, JUMP
- **Interactive Operations**: Supports automatic execution, step-by-step execution, stop, and reset operations
- **Status Monitoring**: Real-time display of register and memory value changes

## How to Use

1. Select an instruction from the predefined instruction list
2. Use control buttons to execute instructions:
   - **Auto Execute**: Automatically complete all execution stages
   - **Step Execute**: Execute stages step by step
   - **Stop**: Pause automatic execution
   - **Reset**: Reset CPU state
3. Observe CPU component state changes and data flow
4. You can modify register and memory values, or add new memory addresses

## Technical Implementation

- Developed with **React** and **TypeScript**
- Uses **Vite** as the build tool
- Uses **CSS** for component styling and animation effects
- Uses **SVG** to draw data flow paths
- Uses **FontAwesome** for icon support

## Installation and Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build production version
npm run build

# Preview production version
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── CPUComponents/
│       ├── CPUVisualizer.tsx  # CPU visualization main component
│       └── CPUVisualizer.css  # Style file
├── models/
│   └── CPUModel.ts            # CPU model definition
├── App.tsx                    # Application main component
├── main.tsx                   # Entry file
└── ...
```

## Future Plans

- Add support for more instruction types
- Implement instruction sequence execution functionality
- Add more detailed execution process explanations
- Support custom instruction creation
- Add multi-language support
