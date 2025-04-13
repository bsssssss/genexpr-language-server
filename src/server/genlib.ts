/*
 * There are some special types of objects in genxpr: 
 *    - Param, Buffer, Data, History, Delay - 
 *
 * These don't have the same syntax and must be defined before 
 * everything else (BUT after require and function definitions)
 *
 * The syntax is 'Object name(args?, attr?);'
 *
 * Some of them have associated methods 
 *    eg: Delay with 'delname.write(arg)' or 'delname.read(arg)'
 * */

// The gen constants as documented by Cycling 74
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

export const genObjectsRef = [
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

export interface GenObject {
  name: string;
  aliases?: string[];
  inlets?: InletInfo[];
  returns?: OutletInfo[];
  arguments?: ArgumentInfo[];
  attributes?: AttributeInfo[];
  description?: string;
  examples?: string;
}

interface OutletInfo {
  name: string;
  desc?: string;
}

interface InletInfo {
  name: string;
  desc?: string;
}

interface ArgumentInfo {
  name: string;
  desc?: string;
  //optional: boolean;
}

interface AttributeInfo {
  name: string;
  desc?: string;
  defaultValue?: any;
  possibleValues?: any[];
}

export const genObjects: Map<string, GenObject> = new Map();

//genObjects.set('buffer', {
//  name: 'buffer',
//  arguments: [
//    {
//      name: "buffer name",
//      desc: "Name by which to refer to this data in other objects in the gen patcher (such as peek and poke)",
//      optional: false
//    },
//    {
//      name: "external buffer name",
//      desc: "Name of the external buffer~ object to reference (if ommitted, the first argument name is used)",
//      optional: true
//    }
//  ],
//  outlets: [
//    {
//      name: "length",
//      desc: "Length of the buffer in samples"
//    },
//    {
//      name: "channels",
//      desc: "Number of channels of the buffer"
//    }
//  ]
//})

genObjects.set('channels', {
  name: 'channels',
  arguments: [
    {
      name: "reference",
      desc: "Name of a data or buffer object in the gen patcher",
    }
  ],
  returns: [
    {
      name: "channels",
      desc: "Number of channels of a data/buffer object"
    }
  ]
})

genObjects.set('cycle', {
  name: 'cycle',
  arguments: [
    { name: 'frequency' },
    { name: 'phase' }
  ],
  returns: [
    { name: 'waveform' }
  ],
  attributes: [
    {
      name: 'index',
      possibleValues: [0, 1, 'phase', 'freq'],
      defaultValue: 'freq',
      desc: 
`Specify the index mode: 
    - 'phase' maps the input signal range 0..1 to the span of the buffer. 
    - 'freq' cycles through the buffer at a frequency given by the input signal. Possible values`
    },
    {
      name: 'name',
      desc: 
`Specify the data or buffer object to use for playback. 
If not specified, cycle will use a built-in sine wavetable.`
    }
  ]
})
