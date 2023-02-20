import * as ast from "./ast.js";
import {Lexer} from "./Lexer.js";
import * as tokens from "./tokens.js";

export class SyntaxError extends Error {
	name = "SyntaxError";
}

export class Parser extends ast.Message {
	input: string;
	tokens: Iterator<tokens.Token>;

	constructor(input: string) {
		super();
		this.input = input;
		this.tokens = new Lexer(input)[Symbol.iterator]();
	}

	parse() {
		let current: tokens.Token | undefined = this.#next_token();
		while (current instanceof tokens.Keyword && current.value === "let") {
			let local = this.#parse_local();
			this.locals.push(local);
			current = this.#next_token();
		}

		if (current instanceof tokens.Punctuator && current.value === "{") {
			let pattern = this.#parse_pattern();
			let variant = new ast.Variant([], pattern);
			this.variants.push(variant);
			return this;
		}

		if (current instanceof tokens.Keyword && current.value === "match") {
			current = this.#next_token();
			while (current instanceof tokens.Punctuator && current.value === "{") {
				let selector = this.#parse_expression();
				this.selectors.push(selector);
				current = this.#next_token();
			}
			while (current instanceof tokens.Keyword && current.value === "when") {
				let variant = this.#parse_variant();
				this.variants.push(variant);
				current = this.#next_token_or_end();
			}
			return this;
		}

		current = this.#next_token_or_end();
		if (current !== undefined) {
			throw new SyntaxError("Expected end of input");
		}
	}

	#parse_local(): ast.Local {
		// Get variable name.
		let name = this.#next_token();
		// Skip '='.
		this.#next_token();
		// Skip '{'.
		this.#next_token();
		let expr = this.#parse_expression();
		return new ast.Local(name.value, expr);
	}

	#parse_variant(): ast.Variant {
		let keys: Array<ast.Literal | ast.Star> = [];
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator && current.value === "{") {
				break;
			} else if (current instanceof tokens.Star) {
				let star = new ast.Star();
				keys.push(star);
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
		let elements: Array<ast.Text | ast.Expression> = [];
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator) {
				if (current.value === "}") {
					break;
				} else if (current.value === "{") {
					let placeholder = this.#parse_expression();
					elements.push(placeholder);
				}
			} else if (current instanceof tokens.Text) {
				let text = new ast.Text(current.value);
				elements.push(text);
			} else {
				throw new SyntaxError("Unknown element type");
			}
		}
		return new ast.Pattern(elements);
	}

	#parse_expression(): ast.Expression {
		let current = this.#next_token();

		if (current instanceof tokens.FunctionName) {
			return this.#parse_function_expression(current);
		}

		let arg: ast.VariableReference | ast.Literal;
		if (current instanceof tokens.VariableName) {
			arg = new ast.VariableReference(current.value);
		} else {
			arg = new ast.Literal(current.value);
		}

		let func: ast.FunctionExpression | null;
		let next = this.#next_token();
		if (next instanceof tokens.FunctionName) {
			func = this.#parse_function_expression(next);
		} else {
			func = null;
		}

		return new ast.OperandExpression(arg, func);
	}

	#parse_function_expression(name: tokens.Token): ast.FunctionExpression {
		let opts: Record<string, ast.Literal | ast.VariableReference> = {};
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator && current.value === "}") {
				break;
			}
			this.#next_token(); // Skip =.
			let optval = this.#next_token();
			if (optval instanceof tokens.VariableName) {
				opts[current.value] = new ast.VariableReference(optval.value);
			} else {
				// tokens.Literal or tokens.Nmtoken.
				opts[current.value] = new ast.Literal(optval.value);
			}
		}
		return new ast.FunctionExpression(name.value, opts);
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
