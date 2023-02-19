interface Atom {
	kind: "word" | "punctuator" | "whitespace" | "escape";
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

export class MarkupStart extends Token {
	kind = "markup_start";
}

export class MarkupEnd extends Token {
	kind = "markup_end";
}

export class Name extends Token {
	kind = "name";
}

export class Nmtoken extends Token {
	kind = "nmtoken";
}

export class Literal extends Token {
	kind = "literal";
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

export class LexingError extends Error {
	message: string;
	start: number;
	end: number;

	constructor(message: string, start: number, end = start) {
		super(message);
		this.message = message;
		this.start = start;
		this.end = end;
	}
}

const re_name =
	/^[A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}][A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}0-9\-\.\u{B7}\u{300}\u{36F}\u{203F}-\u{2040}]*$/u;
const re_nmtoken =
	/^[A-Za-z_\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}0-9\-\.\u{B7}\u{300}\u{36F}\u{203F}-\u{2040}]+$/u;

export class Lexer {
	input: string;
	atoms: Iterator<Atom>;

	constructor(input: string) {
		this.input = input;
		this.atoms = this.#scan();
	}

	*[Symbol.iterator]() {
		let current = this.#next_ignore_whitespace();

		// let definitions
		while (current.value === "let") {
			yield* this.#emit_let(current);
			current = this.#next_ignore_whitespace();
		}

		// body
		if (current.value === "match") {
			yield* this.#emit_match(current);
		} else if (current.value === "{") {
			yield* this.#emit_pattern(current);
		} else {
			throw this.#error("Unexpected token", current);
		}

		let trailing = this.#next_ignore_whitespace_or_end();
		if (trailing) {
			throw this.#error("Expected end of input", trailing);
		}
	}

	// ------------------------------------------------------------------------
	// emit_* methods yield instances of Token classes, classified according to
	// the lexical analysis of the input.

	*#emit_let(current: Atom) {
		yield this.#expect_keyword("let", current);

		// require whitespace
		current = this.#next_include_whitespace();
		if (current.kind !== "whitespace") {
			throw this.#error("Expected whitespace", current);
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

	*#emit_match(current: Atom) {
		yield this.#expect_keyword("match", current);

		current = this.#next_ignore_whitespace();
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

	*#emit_variants(current: Atom) {
		yield* this.#emit_when(current);

		while (true) {
			let current = this.#next_ignore_whitespace_or_end();
			if (current === null) {
				break;
			} else if (current.value === "when") {
				yield* this.#emit_when(current);
			} else {
				throw this.#error("Expected 'when' or end of input", current);
			}
		}
	}

	*#emit_when(current: Atom) {
		yield this.#expect_keyword("when", current);

		// Require whitespace after "when".
		current = this.#next_include_whitespace();
		if (current.kind !== "whitespace") {
			throw this.#error("Expected whitespace after 'when'", current);
		}

		// Require at least one key.
		current = this.#next_include_whitespace();
		yield this.#expect_key(current);

		while (true) {
			current = this.#next_include_whitespace();
			if (current.value === "{") {
				break;
			} else if (current.kind === "whitespace") {
				current = this.#next_include_whitespace();
				if (current.value === "{") {
					break;
				}
				yield this.#expect_key(current);
			} else {
				throw this.#error("Expected whitespace between variant keys", current);
			}
		}

		yield* this.#emit_pattern(current);
	}

	*#emit_pattern(current: Atom) {
		yield new Punctuator(current.value);
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
			} else if (current.kind !== "escape") {
				text_acc += current.value;
			} else if (
				current.value === "\\}" ||
				current.value === "\\{" ||
				current.value === "\\\\"
			) {
				text_acc += current.value[1];
			} else {
				throw this.#error("Unexpected escape sequence", current);
			}
		}
	}

	*#emit_expression(current: Atom) {
		yield this.#expect_punctuator("{", current);

		current = this.#next_ignore_whitespace();
		let first_char = current.value[0];

		if (first_char === ":") {
			// It's a FunctionExpression.
			yield this.#expect_function_name(current);
			yield* this.#emit_options();
		} else if (first_char === "+") {
			yield this.#expect_markup_start(current);
			yield* this.#emit_options();
		} else if (first_char === "-") {
			yield this.#expect_markup_end(current);
			current = this.#next_ignore_whitespace();
			if (current.value === "}") {
				yield new Punctuator(current.value);
			} else {
				throw this.#error("Expected }", current);
			}
		} else {
			// It's an OperandExpression.
			if (first_char === "$") {
				yield this.#expect_variable_name(current);
			} else if (current.value === "(") {
				yield this.#expect_literal(current);
			} else {
				throw this.#error("Expected variable, literal, or function", current);
			}

			current = this.#next_include_whitespace();
			if (current.value === "}") {
				yield new Punctuator(current.value);
			} else if (current.kind === "whitespace") {
				current = this.#next_include_whitespace();
				if (current.value === "}") {
					yield new Punctuator(current.value);
				} else {
					yield this.#expect_function_name(current);
					yield* this.#emit_options();
				}
			} else {
				throw this.#error("Expected } or whitespace", current);
			}
		}
	}

	*#emit_options() {
		let current: Atom;
		while (true) {
			current = this.#next_include_whitespace();
			if (current.value === "}") {
				break;
			} else if (current.kind === "whitespace") {
				current = this.#next_include_whitespace();
				if (current.value === "}") {
					break;
				}
				yield this.#expect_name(current);
				current = this.#next_ignore_whitespace();
				yield this.#expect_punctuator("=", current);
				current = this.#next_ignore_whitespace();
				let first_char = current.value[0];
				if (first_char === "$") {
					yield this.#expect_variable_name(current);
				} else if (current.value === "(") {
					yield this.#expect_literal(current);
				} else {
					yield this.#expect_nmtoken(current);
				}
			} else {
				throw this.#error("Expected whitespace between options", current);
			}
		}
		// End of the expression.
		yield new Punctuator(current.value);
	}

	// ------------------------------------------------------------------------
	// expect_* methods validate the current atom(s) and return a new instance
	// of the corresponding Token class.

	#expect_key(current: Atom) {
		if (current.kind !== "punctuator") {
			return this.#expect_nmtoken(current);
		}
		if (current.value === "*") {
			return new Star(current.value);
		}
		if (current.value === "(") {
			return this.#expect_literal(current);
		}
	}

	#expect_literal(current: Atom) {
		this.#expect_punctuator("(", current);
		let literal_acc = "";
		current = this.#next_include_whitespace();
		while (current.value !== ")") {
			if (current.kind !== "escape") {
				literal_acc += current.value;
			} else if (
				current.value === "\\)" ||
				current.value === "\\(" ||
				current.value === "\\\\"
			) {
				literal_acc += current.value[1];
			} else {
				throw this.#error("Unexpected escape sequence", current);
			}
			current = this.#next_include_whitespace();
		}
		return new Literal(literal_acc);
	}

	#expect_keyword(value: string, current: Atom): Token {
		if (current.kind === "word" && current.value === value) {
			return new Keyword(current.value);
		}
		throw this.#error("Expected keyword: " + value, current);
	}

	#expect_punctuator(value: string, current: Atom): Token {
		if (current.kind === "punctuator" && current.value === value) {
			return new Punctuator(current.value);
		}
		throw this.#error("Expected " + value, current);
	}

	#expect_variable_name(current: Atom): Token {
		if (current.kind === "word" && current.value.startsWith("$")) {
			let name = current.value.slice(1);
			if (re_name.test(name)) {
				return new VariableName(name);
			}
		}
		throw this.#error("Expected variable name", current);
	}

	#expect_function_name(current: Atom) {
		if (current.kind === "word" && current.value.startsWith(":")) {
			let name = current.value.slice(1);
			if (re_name.test(name)) {
				return new FunctionName(name);
			}
		}
		throw this.#error("Expected function name", current);
	}

	#expect_markup_start(current: Atom) {
		if (current.kind === "word" && current.value.startsWith("+")) {
			let name = current.value.slice(1);
			if (re_name.test(name)) {
				return new MarkupStart(name);
			}
		}
		throw this.#error("Expected markup start", current);
	}

	#expect_markup_end(current: Atom) {
		if (current.kind === "word" && current.value.startsWith("-")) {
			let name = current.value.slice(1);
			if (re_name.test(name)) {
				return new MarkupEnd(name);
			}
		}
		throw this.#error("Expected markup end", current);
	}

	#expect_name(current: Atom) {
		if (current.kind === "word" && re_name.test(current.value)) {
			return new Name(current.value);
		}
		throw this.#error("Expected name", current);
	}

	#expect_nmtoken(current: Atom) {
		if (current.kind === "word" && re_nmtoken.test(current.value)) {
			return new Nmtoken(current.value);
		}
		throw this.#error("Expected nmtoken", current);
	}

	// ------------------------------------------------------------------------
	// Low-level iteration.

	#next_ignore_whitespace_or_end(): Atom | null {
		let {value, done} = this.atoms.next();
		if (done) {
			// We're done!
			return null;
		} else if (value.kind === "whitespace") {
			return this.#next_ignore_whitespace_or_end();
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
			throw new LexingError("Unexpected end of input.", this.input.length);
		}
		return value;
	}

	// ------------------------------------------------------------------------
	// Split the input into atoms based on whitespace and special characters.

	*#scan(): Generator<Atom> {
		let start = 0;
		let cursor = 0;
		let kind: Atom["kind"] = "punctuator";
		let value: string = "";
		for (let char of this.input) {
			if (kind === "escape") {
				yield {kind, value: "\\" + char, start, end: cursor};
				kind = "punctuator";
				value = "";
				continue;
			}
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
				case "\\":
					if (value) {
						yield {kind, value, start, end: cursor};
					}
					kind = "escape";
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

	#error(message: string, current: Atom) {
		let end = Math.min(current.end + 20, this.input.length);
		let context = this.input.slice(current.start, end);
		return new LexingError(`${message}: ...${context}`, current.start, current.end);
	}
}
