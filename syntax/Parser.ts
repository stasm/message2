import * as ast from "./ast.js";
import {Lexer} from "./Lexer.js";
import * as tokens from "./tokens.js";

export class SyntaxError extends Error {
	name = "SyntaxError";
}

export class Parser extends ast.Message {
	source: string;
	tokens: Iterator<tokens.Token>;

	constructor(source: string) {
		super();
		this.source = source;
		this.tokens = new Lexer(source)[Symbol.iterator]();
	}

	parse(): ast.Message {
		let current: tokens.Token | undefined = this.#next_token();
		while (current instanceof tokens.Keyword && current.value === "let") {
			let declaration = this.#parse_declaration();
			this.declarations.push(declaration);
			current = this.#next_token();
		}

		if (current instanceof tokens.Punctuator && current.value === "{") {
			let pattern = this.#parse_pattern();
			let variant = new ast.Variant([], pattern);
			this.variants.push(variant);
		} else if (current instanceof tokens.Keyword && current.value === "match") {
			current = this.#next_token();
			while (current instanceof tokens.Punctuator && current.value === "{") {
				current = this.#next_token();
				let selector = this.#parse_expression(current);
				this.selectors.push(selector);
				current = this.#next_token();
			}
			while (current instanceof tokens.Keyword && current.value === "when") {
				let variant = this.#parse_variant();
				this.variants.push(variant);
				current = this.#next_token_or_end();
			}
		}

		current = this.#next_token_or_end();
		if (current === undefined) {
			return this;
		} else {
			throw new SyntaxError("Expected end of input");
		}
	}

	#parse_declaration(): ast.Declaration {
		// Get variable name.
		let name = this.#next_token();
		// Skip '='.
		this.#next_token();
		// Skip '{'.
		this.#next_token();
		// The first token of the expression.
		let current = this.#next_token();
		let expr = this.#parse_expression(current);
		return new ast.Declaration(name.value, expr);
	}

	#parse_variant(): ast.Variant {
		let keys: Array<ast.Literal | ast.Asterisk> = [];
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator && current.value === "{") {
				break;
			} else if (current instanceof tokens.Asterisk) {
				let asterisk = new ast.Asterisk();
				keys.push(asterisk);
			} else {
				// tokens.Literal or tokens.Nmtoken.
				let literal = new ast.Literal(current.value);
				keys.push(literal);
			}
		}
		let pattern = this.#parse_pattern();
		return new ast.Variant(keys, pattern);
	}

	#parse_pattern(): ast.Pattern {
		let pattern: ast.Pattern = [];
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator) {
				if (current.value === "}") {
					break;
				} else if (current.value === "{") {
					let placeholder = this.#parse_placeholder();
					pattern.push(placeholder);
				}
			} else if (current instanceof tokens.Text) {
				let text = new ast.Text(current.value);
				pattern.push(text);
			} else {
				throw new SyntaxError("Unknown element type");
			}
		}
		return pattern;
	}

	#parse_placeholder(): ast.Placeholder {
		let current = this.#next_token();

		if (current instanceof tokens.MarkupStart) {
			let opts = this.#parse_options();
			return new ast.MarkupOpen(current.value, opts);
		}

		if (current instanceof tokens.MarkupEnd) {
			// Consume '}'.
			this.#next_token();
			return new ast.MarkupClose(current.value);
		}

		return this.#parse_expression(current);
	}

	#parse_expression(current: tokens.Token): ast.Expression {
		if (current instanceof tokens.FunctionName) {
			let opts = this.#parse_options();
			return new ast.FunctionExpression(current.value, opts);
		}

		let arg: ast.VariableReference | ast.Literal;
		if (current instanceof tokens.VariableName) {
			arg = new ast.VariableReference(current.value);
		} else {
			arg = new ast.Literal(current.value);
		}

		let func: ast.FunctionExpression | null;
		current = this.#next_token();
		if (current instanceof tokens.FunctionName) {
			let opts = this.#parse_options();
			func = new ast.FunctionExpression(current.value, opts);
		} else {
			func = null;
		}

		return new ast.OperandExpression(arg, func);
	}

	#parse_options(): ast.Options {
		let opts: ast.Options = new Map();
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator && current.value === "}") {
				break;
			}
			this.#next_token(); // Skip =.
			let optval = this.#next_token();
			if (optval instanceof tokens.VariableName) {
				opts.set(current.value, new ast.VariableReference(optval.value));
			} else {
				// tokens.Literal or tokens.Nmtoken.
				opts.set(current.value, new ast.Literal(optval.value));
			}
		}
		return opts;
	}

	#next_token(): tokens.Token {
		let {value, done} = this.tokens.next();
		if (done) {
			throw new SyntaxError("Unexpected end of input");
		}
		return value;
	}

	#next_token_or_end(): tokens.Token | undefined {
		let {value} = this.tokens.next();
		return value;
	}
}
