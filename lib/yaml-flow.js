/**
 * Low-level scalar and flow-collection parsing for the supported YAML subset.
 *
 * Kept separate from the block-structure parser so both stay small. Every
 * construct outside the supported subset raises YamlSubsetError rather than
 * being silently coerced, because a misparsed config is worse than no config.
 */
/**
 * Error raised when input falls outside the supported YAML subset.
 * Carries the 1-based source line so callers can point the user at it.
 */
export class YamlSubsetError extends Error {
    /** 1-based line number in the source document that triggered the failure. */
    line;
    constructor(message, line) {
        super(`${message} (line ${line})`);
        this.name = 'YamlSubsetError';
        this.line = line;
    }
}
function stripWrappingQuotes(token) {
    if (token.length < 2)
        return token;
    const first = token[0];
    const last = token[token.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        const body = token.slice(1, -1);
        return first === '"' ? body.replace(/\\(["\\n])/g, '$1') : body.replace(/''/g, "'");
    }
    return token;
}
function rejectUnsupportedToken(token, line) {
    if (/^[&*]/.test(token)) {
        throw new YamlSubsetError('anchors and aliases are not supported', line);
    }
    if (/^!/.test(token)) {
        throw new YamlSubsetError('explicit tags are not supported', line);
    }
    if (/^[|>]/.test(token)) {
        throw new YamlSubsetError('block scalars are not supported', line);
    }
}
/**
 * Converts a plain scalar token into its typed value.
 *
 * Recognises quoted strings, booleans, nulls and numbers; everything else is
 * returned verbatim as a string.
 */
export function coerceScalar(token, line) {
    const text = token.trim();
    if (text === '')
        return null;
    if (text.startsWith('"') || text.startsWith("'")) {
        return stripWrappingQuotes(text);
    }
    rejectUnsupportedToken(text, line);
    if (text === '~' || /^null$/i.test(text))
        return null;
    if (/^true$/i.test(text))
        return true;
    if (/^false$/i.test(text))
        return false;
    if (/^-?\d+$/.test(text))
        return Number.parseInt(text, 10);
    if (/^-?(?:\d+\.\d*|\.\d+)$/.test(text))
        return Number.parseFloat(text);
    return text;
}
/**
 * Parses an inline flow collection (`[a, b]`, `{x: 1}`, or a bare scalar).
 *
 * @param input - Text beginning at the value to parse.
 * @param line - Source line number reported on failure.
 * @returns The parsed value and any unconsumed trailing text.
 */
class FlowParser {
    input;
    line;
    i = 0;
    constructor(input, line) {
        this.input = input;
        this.line = line;
    }
    skipSpace() {
        while (this.i < this.input.length && /\s/.test(this.input[this.i]))
            this.i += 1;
    }
    readBare(stops) {
        const start = this.i;
        while (this.i < this.input.length && !stops.includes(this.input[this.i]))
            this.i += 1;
        return this.input.slice(start, this.i).trim();
    }
    readQuoted(quote) {
        this.i += 1;
        let out = '';
        while (this.i < this.input.length) {
            const ch = this.input[this.i];
            if (ch === '\\' && quote === '"') {
                out += this.input.slice(this.i, this.i + 2);
                this.i += 2;
                continue;
            }
            this.i += 1;
            if (ch === quote)
                return quote === '"' ? out.replace(/\\(["\\n])/g, (_m, c) => (c === 'n' ? '\n' : c)) : out;
            out += ch;
        }
        throw new YamlSubsetError('unterminated quoted string', this.line);
    }
    readKey() {
        this.skipSpace();
        if (this.input[this.i] === '"' || this.input[this.i] === "'") {
            return this.readQuoted(this.input[this.i]);
        }
        return stripWrappingQuotes(this.readBare(':,}]'));
    }
    readPlainValue() {
        this.skipSpace();
        const ch = this.input[this.i];
        if (ch === '[')
            return this.readSeq();
        if (ch === '{')
            return this.readMap();
        if (ch === '"' || ch === "'")
            return this.readQuoted(ch);
        return coerceScalar(this.readBare(',]}'), this.line);
    }
    readSeq() {
        this.i += 1;
        const out = [];
        for (;;) {
            this.skipSpace();
            if (this.i >= this.input.length)
                throw new YamlSubsetError('unterminated flow sequence', this.line);
            if (this.input[this.i] === ']') {
                this.i += 1;
                return out;
            }
            out.push(this.readPlainValue());
            this.skipSpace();
            if (this.input[this.i] === ',') {
                this.i += 1;
                continue;
            }
            if (this.input[this.i] === ']') {
                this.i += 1;
                return out;
            }
            throw new YamlSubsetError('expected "," or "]" in flow sequence', this.line);
        }
    }
    readMap() {
        this.i += 1;
        const out = {};
        for (;;) {
            this.skipSpace();
            if (this.i >= this.input.length)
                throw new YamlSubsetError('unterminated flow mapping', this.line);
            if (this.input[this.i] === '}') {
                this.i += 1;
                return out;
            }
            const key = this.readKey();
            this.skipSpace();
            if (this.input[this.i] !== ':')
                throw new YamlSubsetError('expected ":" in flow mapping', this.line);
            this.i += 1;
            out[key] = this.readPlainValue();
            this.skipSpace();
            if (this.input[this.i] === ',') {
                this.i += 1;
                continue;
            }
            if (this.input[this.i] === '}') {
                this.i += 1;
                return out;
            }
            throw new YamlSubsetError('expected "," or "}" in flow mapping', this.line);
        }
    }
    remainder() {
        return this.input.slice(this.i);
    }
}
/**
 * Parses an inline flow collection (`[a, b]`, `{x: 1}`, or a bare scalar).
 *
 * @param input - Text beginning at the value to parse.
 * @param line - Source line number reported on failure.
 * @returns The parsed value and any unconsumed trailing text.
 */
export function parseFlow(input, line) {
    const parser = new FlowParser(input, line);
    const value = parser.readPlainValue();
    return { value, rest: parser.remainder() };
}
//# sourceMappingURL=yaml-flow.js.map