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
		yield new Keyword(atom.value);
		// require whitespace
		let current = this.#next_include_whitespace();
		if (current.kind !== "whitespace") {
			throw new LexingError("Expected whitespace.");
		} else {
			// Skip the whitespace.
		}

		yield this.#expect_variable_name();
		yield this.#expect_punctuator("=");
		yield this.#expect_punctuator("{");
		yield* this.#emit_expression();
	}

	*#emit_match(atom: Atom) {
		yield new Keyword(atom.value);
		yield this.#expect_punctuator("{");
		yield* this.#emit_expression();

		let current = this.#next_ignore_whitespace();
		while (current.value === "{") {
			yield new Punctuator(current.value);
			yield* this.#emit_expression();
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
		yield new Keyword(atom.value);

		// Require at least one key.
		let key_seen = false;

		let current = this.#next_include_whitespace();
		while (true) {
			if (current.kind === "whitespace") {
				current = this.#next_include_whitespace();
				if (current.value === "{") {
					break;
				} else {
					key_seen = true;
					// TODO validate
					yield new Nmtoken(current.value);
					current = this.#next_include_whitespace();
				}
			} else if (current.value === "{") {
				break;
			} else {
				throw new LexingError("Expected whitespace between variant keys.");
			}
		}

		if (key_seen) {
			yield* this.#emit_pattern(current);
		} else {
			throw new LexingError("Expected at least one key.");
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
				yield new Punctuator(current.value);
				yield* this.#emit_expression();
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

	*#emit_expression() {
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

	#expect_punctuator(value: string): Token {
		let current = this.#next_ignore_whitespace();
		if (current.kind === "punctuator" && current.value === value) {
			return new Punctuator(current.value);
		} else {
			throw new LexingError("Expected " + value + ".");
		}
	}

	#expect_variable_name(): Token {
		let current = this.#next_ignore_whitespace();
		// TODO: regex.
		if (current.value.startsWith("$")) {
			return new VariableName(current.value.slice(1));
		} else {
			throw new LexingError("Expected variable name.");
		}
	}

	#expect_function_name() {
		let current = this.#next_ignore_whitespace();
		// TODO: regex.
		if (current.value.startsWith(":")) {
			return new FunctionName(current.value.slice(1));
		} else {
			throw new LexingError("Expected variable name.");
		}
	}

	#expect_name() {
		let current = this.#next_ignore_whitespace();
		// TODO: regex.
		if (current) {
			return new Name(current.value);
		} else {
			throw new LexingError("Expected name.");
		}
	}

	#expect_nmtoken() {
		let current = this.#next_ignore_whitespace();
		// TODO: regex.
		if (current) {
			return new Nmtoken(current.value);
		} else {
			throw new LexingError("Expected nmtoken.");
		}
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
