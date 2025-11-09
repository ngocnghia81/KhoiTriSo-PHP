declare module 'react-katex' {
  import { Component } from 'react';

  interface MathProps {
    math: string;
    renderError?: (error: Error) => React.ReactNode;
    errorColor?: string;
    throwOnError?: boolean;
    displayMode?: boolean;
    leqno?: boolean;
    fleqn?: boolean;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
    strict?: boolean | 'warn' | 'ignore' | Function;
    trust?: boolean | Function;
    macros?: any;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    allowedProtocols?: string[];
    [key: string]: any;
  }

  export class BlockMath extends Component<MathProps> {}
  export class InlineMath extends Component<MathProps> {}
}

