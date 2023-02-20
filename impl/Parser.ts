import * as ast from "./ast.js";
import {Lexer} from "./Lexer.js";
import * as tokens from "./tokens.js";

export class SyntaxError extends Error {
	name = "SyntaxError";
}

export class Parser {
	input: string;
	tokens: Iterator<tokens.Token>;

	constructor(input: string) {
		this.input = input;
		this.tokens = new Lexer(input)[Symbol.iterator]();
	}

	to_ast() {
		let message: ast.Message = {
			locals: [],
			selectors: [],
			variants: [],
		};

		let current: tokens.Token | undefined = this.#next_token();
		while (current instanceof tokens.Keyword && current.value === "let") {
			let local = this.#parse_local();
			message.locals.push(local);
			current = this.#next_token();
		}

		if (current instanceof tokens.Punctuator && current.value === "{") {
			let variant: ast.Variant = {
				type: "Variant",
				keys: [],
				value: this.#parse_pattern(),
			};
			message.variants.push(variant);
			return message;
		}

		if (current instanceof tokens.Keyword && current.value === "match") {
			current = this.#next_token();
			while (current instanceof tokens.Punctuator && current.value === "{") {
				let selector = this.#parse_expression();
				message.selectors.push(selector);
				current = this.#next_token();
			}
			while (current instanceof tokens.Keyword && current.value === "when") {
				let variant = this.#parse_variant();
				message.variants.push(variant);
				current = this.#next_token_or_end();
			}
			return message;
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
		return {
			type: "Local",
			name: name.value,
			expr: this.#parse_expression(),
		};
	}

	#parse_variant(): ast.Variant {
		let keys: Array<ast.Literal | ast.Star> = [];
		while (true) {
			let current = this.#next_token();
			if (current instanceof tokens.Punctuator && current.value === "{") {
				break;
			} else if (current instanceof tokens.Star) {
				let star: ast.Star = {type: "Star"};
				keys.push(star);
			} else {
				// tokens.Literal or tokens.Nmtoken.
				let literal: ast.Literal = {type: "Literal", value: current.value};
				keys.push(literal);
			}
		}
		return {
			type: "Variant",
			keys,
			value: this.#parse_pattern(),
		};
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
				let text: ast.Text = {type: "Text", value: current.value};
				elements.push(text);
			} else {
				throw new SyntaxError("Unknown element type");
			}
		}
		return {
			elements,
		};
	}

	#parse_expression(): ast.Expression {
		let current = this.#next_token();

		if (current instanceof tokens.FunctionName) {
			return this.#parse_function_expression(current);
		}

		let arg: ast.VariableReference | ast.Literal;
		if (current instanceof tokens.VariableName) {
			arg = {type: "VariableReference", name: current.value};
		} else {
			arg = {type: "Literal", value: current.value};
		}

		let func: ast.FunctionExpression | null;
		let next = this.#next_token();
		if (next instanceof tokens.FunctionName) {
			func = this.#parse_function_expression(next);
		} else {
			func = null;
		}

		return {
			type: "OperandExpression",
			arg,
			func,
		};
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
				opts[current.value] = {type: "VariableReference", name: optval.value};
			} else {
				// tokens.Literal or tokens.Nmtoken.
				opts[current.value] = {type: "Literal", value: optval.value};
			}
		}
		return {
			type: "FunctionExpression",
			name: name.value,
			opts,
		};
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
