/**
 * Permanent Naming Conventions
 * Enforces official naming patterns across the MediaFactory architecture.
 */

export const NamingRules = Object.freeze({
    classes: {
        pattern: /^[A-Z][a-zA-Z0-9]*$/,
        description: 'PascalCase'
    },
    files: {
        pattern: /^[A-Z][a-zA-Z0-9]*\.js(x)?$/,
        description: 'PascalCase.js'
    },
    privateMethods: {
        pattern: /^_[a-z][a-zA-Z0-9]*$/,
        description: '_method()'
    },
    constants: {
        pattern: /^[A-Z][A-Z0-9_]*$/,
        description: 'UPPER_SNAKE_CASE'
    },
    suffixes: Object.freeze({
        Descriptor: {
            appliesTo: 'descriptors/',
            description: 'SomethingDescriptor'
        },
        Runtime: {
            appliesTo: 'runtime/',
            description: 'SomethingRuntime'
        },
        Compiler: {
            appliesTo: 'compiler/',
            description: 'SomethingCompiler'
        }
    }),
    
    validateFilename: (filename) => {
        return NamingRules.files.pattern.test(filename) || filename.toLowerCase().endsWith('.css');
    }
});
