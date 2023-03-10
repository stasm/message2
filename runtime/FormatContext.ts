import * as ast from "../syntax/ast.js";
import {Registry} from "./registry.js";
import {RuntimeString} from "./RuntimeString.js";
import {RuntimeValue} from "./RuntimeValue.js";

export class FormatContext {
	locale: string;
	vars: Record<string, RuntimeValue>;
	lets: Map<string, RuntimeValue> = new Map();
	// TODO(stasm): expose cached formatters, etc.

	constructor(locale: string, vars: Record<string, RuntimeValue>, declarations: Array<ast.Declaration>) {
		this.locale = locale;
		this.vars = vars;

		for (let declaration of declarations) {
			let value = this.#resolveExpression(declaration.expr);
			this.lets.set(declaration.name, value);
		}
	}

	selectVariant(variants: Array<ast.Variant>, selectors: Array<ast.Expression>): ast.Variant {
		let resolved_selectors: Array<RuntimeValue> = [];
		for (let selector of selectors) {
			let value = this.#resolveExpression(selector);
			resolved_selectors.push(value);
		}

		to_next_variant: for (let variant of variants) {
			to_next_key: for (let i = 0; i < resolved_selectors.length; i++) {
				let key = variant.keys[i];
				if (key instanceof ast.Asterisk) {
					// The default key always matches.
					continue to_next_key;
				}
				if (resolved_selectors[i].match(this, key)) {
					continue to_next_key;
				}

				// If a key doesn't match, discard the current variant.
				continue to_next_variant;
			}

			// All keys match.
			return variant;
		}

		throw new RangeError("No variant matched the selectors.");
	}

	*resolvePattern(pattern: ast.Pattern): IterableIterator<RuntimeValue> {
		for (let element of pattern) {
			if (element instanceof ast.Text) {
				yield new RuntimeString(element.value);
			} else if (element instanceof ast.FunctionExpression || element instanceof ast.OperandExpression) {
				yield this.#resolveExpression(element);
			} else {
				// TODO(stasm): markup
			}
		}
	}

	#resolveOperand(node: ast.Operand | undefined): RuntimeValue {
		if (node instanceof ast.Literal) {
			return new RuntimeString(node.value);
		}
		if (node instanceof ast.VariableReference) {
			// Local declarations shadow message arguments.
			return this.lets.get(node.name) ?? this.vars[node.name];
		}
		throw new TypeError("Invalid node type.");
	}

	#resolveOptions(opts: ast.Options): Map<string, RuntimeValue> {
		let resolved_opts = new Map();
		for (let [key, value] of opts) {
			resolved_opts.set(key, this.#resolveOperand(value));
		}
		return resolved_opts;
	}

	#resolveExpression(expr: ast.Expression) {
		if (expr instanceof ast.FunctionExpression) {
			let func = Registry.getFunction(expr.name);
			// Eagerly resolve all options.
			let opts = this.#resolveOptions(expr.opts);
			return func(this, null, opts);
		}
		if (expr.func) {
			let func = Registry.getFunction(expr.func.name);
			// Eagerly resolve the argument and all options.
			let arg = this.#resolveOperand(expr.arg);
			let opts = this.#resolveOptions(expr.func.opts);
			return func(this, arg, opts);
		}
		return this.#resolveOperand(expr.arg);
	}
}
