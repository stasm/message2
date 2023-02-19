interface Atom {
	kind: "word" | "punctuator" | "whitespace";
	value: string;
	start: number;
	end: number;
}

export abstract class Token {
	abstract kind: string;
	value: string;

	constructor(value: string) {
		this.value = value;
	}
}

export class Keyword extends Token {
	kind = "keyword";
}

export class VariableName extends Token {
	kind = "variable_name";
}

export class FunctionName extends Token {
	kind = "function_name";
}

export class Name extends Token {
	kind = "name";
}

export class Nmtoken extends Token {
	kind = "nmtoken";
}

export class Star extends Token {
	kind = "star";
}

export class Text extends Token {
	kind = "text";
}

export class Punctuator extends Token {
	kind = "punctuator";
}

export class Whitespace extends Token {
	kind = "whitespace";
}

export class LexingError extends Error {}

const re_name =
	/[A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}][A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}0-9-\.\u{B7}\u{300}\u{36F}\u{203F}-\u{2040}]*/u;
const re_nmtoken =
	/[A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}0-9-\.\u{B7}\u{300}\u{36F}\u{203F}-\u{2040}]+/u;

export class Lexer {
	input: string;
	atoms: Iterator<Atom>;

	constructor(input: string) {
		this.input = input;
		this.atoms = this.#scan();
	}

	*[Symbol.iterator]() {
		let atom = this.#next_ignore_whitespace();
		while (atom.value === "let") {
			yield* this.#emit_let(atom);
			atom = this.#next_ignore_whitespace();
		}

		// body
		if (atom.value === "match") {
			yield* this.#emit_match(atom);
		} else if (atom.value === "{") {
			yield* this.#emit_pattern(atom);
		} else {
			throw new LexingError(`Unexpected token: "${atom.value}"`);
		}

		let trailing = this.#next_or_end();
		if (trailing) {
			throw new LexingError(`Expected end of input, got "${trailing.value}".`);
		}
	}

	*#emit_let(atom: Atom) {
		yield this.#expect_keyword("let", atom);

		// require whitespace
		let current = this.#next_include_whitespace();
		if (current.kind !== "whitespace") {
			throw new LexingError("Expected whitespace.");
		} else {
			// Skip the whitespace.
		}

		current = this.#next_ignore_whitespace();
		yield this.#expect_variable_name(current);
		current = this.#next_ignore_whitespace();
		yield this.#expect_punctuator("=", current);
		current = this.#next_ignore_whitespace();
		yield* this.#emit_expression(current);
	}

	*#emit_match(atom: Atom) {
		yield this.#expect_keyword("match", atom);

		let current = this.#next_ignore_whitespace();
		yield this.#expect_punctuator("{", current);
		yield* this.#emit_expression(current);

		current = this.#next_ignore_whitespace();
		while (current.value === "{") {
			yield* this.#emit_expression(current);
			current = this.#next_ignore_whitespace();
		}

		if (current.value === "when") {
			yield* this.#emit_variants(current);
		}
	}

	*#emit_variants(atom: Atom) {
		yield* this.#emit_when(atom);

		while (true) {
			let current = this.#next_or_end();
			if (current === null) {
				break;
			} else if (current.value === "when") {
				yield* this.#emit_when(current);
			} else {
				throw new LexingError(`Expected "when" or end of input, got "${current.value}"`);
			}
		}
	}

	*#emit_when(atom: Atom) {
		yield this.#expect_keyword("when", atom);

		// Require whitespace after "when".
		let current = this.#next_include_whitespace();
		if (current.kind !== "whitespace") {
			throw new LexingError(`Expected whitespace after "when".`);
		}

		// Require at least one key.
		current = this.#next_include_whitespace();
		yield* this.#emit_key(current);

		while (true) {
			current = this.#next_include_whitespace();
			if (current.value === "{") {
				break;
			} else if (current.kind === "whitespace") {
				current = this.#next_include_whitespace();
				if (current.value === "{") {
					break;
				}
				yield* this.#emit_key(current);
			} else {
				throw new LexingError("Expected whitespace between variant keys.");
			}
		}

		yield* this.#emit_pattern(current);
	}

	*#emit_key(atom: Atom) {
		if (atom.value === "*") {
			yield new Star(atom.value);
		} else {
			yield this.#expect_nmtoken(atom);
		}
	}

	*#emit_pattern(atom: Atom) {
		yield new Punctuator(atom.value);
		let text_acc = "";
		while (true) {
			let current = this.#next_include_whitespace();
			if (current.value === "{") {
				if (text_acc) {
					yield new Text(text_acc);
					text_acc = "";
				}
				yield* this.#emit_expression(current);
			} else if (current.value === "}") {
				if (text_acc) {
					yield new Text(text_acc);
					text_acc = "";
				}
				yield new Punctuator(current.value);
				break;
			} else {
				// Text.
				text_acc += current.value;
			}
		}
	}

	*#emit_expression(atom: Atom) {
		yield this.#expect_punctuator("{", atom);
		while (true) {
			let current = this.#next_ignore_whitespace();
			if (current.value === "}") {
				yield new Punctuator(current.value);
				break;
			} else {
				// TODO: Tag them.
				yield new Nmtoken(current.value);
			}
		}
	}

	#expect_keyword(value: string, atom: Atom): Token {
		if (atom.kind === "word" && atom.value === value) {
			return new Keyword(atom.value);
		}
		throw new LexingError("Expected keyword: " + value + ".");
	}

	#expect_punctuator(value: string, atom: Atom): Token {
		if (atom.kind === "punctuator" && atom.value === value) {
			return new Punctuator(atom.value);
		}
		throw new LexingError("Expected " + value + ".");
	}

	#expect_variable_name(atom: Atom): Token {
		if (atom.kind === "word" && atom.value.startsWith("$")) {
			let name = atom.value.slice(1);
			if (re_name.test(name)) {
				return new VariableName(name);
			}
		}
		throw new LexingError("Expected variable name.");
	}

	#expect_function_name(atom: Atom) {
		if (atom.kind === "word" && atom.value.startsWith(":")) {
			let name = atom.value.slice(1);
			if (re_name.test(name)) {
				return new FunctionName(name);
			}
		}
		throw new LexingError("Expected variable name.");
	}

	#expect_name(atom: Atom) {
		if (atom.kind === "word" && re_name.test(atom.value)) {
			return new Name(atom.value);
		}
		throw new LexingError("Expected name.");
	}

	#expect_nmtoken(atom: Atom) {
		if (atom.kind === "word" && re_nmtoken.test(atom.value)) {
			return new Nmtoken(atom.value);
		}
		throw new LexingError("Expected nmtoken.");
	}

	#next_or_end(): Atom | null {
		let {value, done} = this.atoms.next();
		if (done) {
			// We're done!
			return null;
		} else if (value.kind === "whitespace") {
			return this.#next_or_end();
		}
		return value;
	}

	#next_ignore_whitespace(): Atom {
		let value = this.#next_include_whitespace();
		if (value.kind === "whitespace") {
			return this.#next_ignore_whitespace();
		}
		return value;
	}

	#next_include_whitespace(): Atom {
		let {value, done} = this.atoms.next();
		if (done) {
			throw new LexingError("Unexpected end of input.");
		}
		return value;
	}

	*#scan(): Generator<Atom> {
		let start = 0;
		let cursor = 0;
		let kind: Atom["kind"] = "punctuator";
		let value: string = "";
		for (let char of this.input) {
			switch (char) {
				case "\t":
				case "\r":
				case "\n":
				case " ":
					if (kind === "whitespace") {
						value += char;
						break;
					}
					if (value) {
						yield {kind, value, start, end: cursor};
					}
					kind = "whitespace";
					value = char;
					start = cursor;
					break;
				case "{":
				case "}":
				case "=":
				case "*":
				case "(":
				case ")":
					if (value) {
						yield {kind, value, start, end: cursor};
					}
					kind = "punctuator";
					value = char;
					start = cursor;
					break;
				default:
					if (kind === "word") {
						value += char;
						break;
					}
					if (value) {
						yield {kind, value, start, end: cursor};
					}
					kind = "word";
					value = char;
					start = cursor;
			}
			cursor++;
		}

		if (value) {
			yield {kind, value, start, end: cursor};
		}
	}
}
