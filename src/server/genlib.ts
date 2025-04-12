// The gen objects as documented by Cycling 74

export const genObjects = [
  // comparison
  'neqp', 'gt', 'eq', 'eqp', 'gte', 'gtep', 'gtp', 'lt', 'lte', 'ltep', 'ltp', 'max', 'maximum', 'min', 'minimum', 'neq', 'step',
  // constant
  'int', 'float',
  // Ignore
  'pass',
  // Logic
  'not', 'and', 'bool', 'or', 'xor',
  // Math
  'rmod', 'rsub', 'mod', 'add', 'sub', 'div', 'absdiff', 'cartopol', 'mul', 'neg', 'poltocar', 'rdiv',
  // Numeric
  'abs', 'ceil', 'floor', 'trunc', 'fract', 'sign',
  // Powers
  'exp', 'exp2', 'fastexp', 'fastpow', 'ln', 'log', 'log10', 'log2', 'pow', 'sqrt',
  // Range
  'clamp', 'clip', 'fold', 'scale', 'wrap',
  // Route
  'switch', 'gate', 'mix', 'r', 'receive', 's', 'send', 'selector', 'smoothstep',
  // Trigonometry
  'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cos', 'cosh', 'degrees', 'fastcos', 'fastsin', 'fasttan', 'hypot', 'radians', 'sin', 'sinh', 'tan', 'tanh',
  // Waveform
  'noise', 'cycle', 'phasor', 'tri'
]

export const genConstants = [
  'degtorad', 'DEGTORAD',
  'e', 'E',
  'halfpi', 'HALFPI',
  'invpi', 'INVPI',
  'ln10', 'LN10',
  'ln2', 'LN2',
  'log10e', 'LOG10E',
  'log2e', 'LOG2E',
  'phi', 'PHI',
  'pi', 'PI',
  'radtodeg', 'RADTODEG',
  'sqrt1_2', 'SQRT1_2',
  'sqrt2', 'SQRT2',
  'twopi', 'TWOPI',
  'samplerate'
]
