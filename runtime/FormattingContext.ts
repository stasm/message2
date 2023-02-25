import * as ast from "../syntax/ast.js";
import {Registry} from "./registry.js";
import {RuntimeString} from "./RuntimeString.js";
import {RuntimeValue} from "./RuntimeValue.js";

// Resolution context for a single formatMessage() call.

export class FormattingContext {
	locale: string;
	vars: Record<string, RuntimeValue>;
	lets: Map<string, RuntimeValue> = new Map();
	// TODO(stasm): expose cached formatters, etc.

	constructor(locale: string, vars: Record<string, RuntimeValue>, declarations: Array<ast.Declaration>) {
		this.locale = locale;
		this.vars = vars;

		for (let declaration of declarations) {
			this.lets.set(declaration.name, this.#resolveExpression(declaration.expr));
		}
	}

	formatPattern(pattern: ast.Pattern): string {
		let output = "";
		for (let value of this.resolvePattern(pattern)) {
			output += value.formatToString(this);
		}
		return output;
	}

	*resolvePattern(pattern: ast.Pattern): IterableIterator<RuntimeValue> {
		for (let element of pattern) {
			if (element instanceof ast.Text) {
				yield new RuntimeString(element.value);
			} else if (element instanceof ast.FunctionExpression) {
				yield this.#resolveInvocation(element, null);
			} else if (element instanceof ast.OperandExpression) {
				if (element.func) {
					yield this.#resolveInvocation(element.func, element.arg);
				} else {
					yield this.resolveOperand(element.arg);
				}
			} else {
				// TODO(stasm): markup
			}
		}
	}

	selectVariant(variants: Array<ast.Variant>, selectors: Array<ast.Expression>): ast.Variant {
		let resolved_selectors: Array<RuntimeValue> = [];
		for (let selector of selectors) {
			if (selector instanceof ast.FunctionExpression) {
				let value = this.#resolveInvocation(selector, null);
				resolved_selectors.push(value);
			} else if (selector instanceof ast.OperandExpression) {
				if (selector.func) {
					let value = this.#resolveInvocation(selector.func, selector.arg);
					resolved_selectors.push(value);
				} else {
					let value = this.resolveOperand(selector.arg);
					resolved_selectors.push(value);
				}
			} else {
				throw new EvalError("Markup cannot be used as selectors.");
			}
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

	resolveOperand(node: ast.Literal): RuntimeString;
	resolveOperand(node: ast.VariableReference): RuntimeValue;
	resolveOperand(node: ast.Operand | undefined): RuntimeValue;
	resolveOperand(node: ast.Operand | undefined): RuntimeValue {
		if (node instanceof ast.Literal) {
			return new RuntimeString(node.value);
		}
		if (node instanceof ast.VariableReference) {
			// Local declarations shadow message arguments.
			return this.lets.get(node.name) ?? this.vars[node.name];
		}
		throw new TypeError("Invalid node type.");
	}

	#resolveExpression(expr: ast.Expression) {
		if (expr instanceof ast.FunctionExpression) {
			return this.#resolveInvocation(expr, null);
		}
		if (expr.func) {
			return this.#resolveInvocation(expr.func, expr.arg);
		}
		return this.resolveOperand(expr.arg);
	}

	#resolveInvocation(expr: ast.FunctionExpression, arg: ast.Operand | null) {
		let func = Registry.functions.get(expr.name);
		if (func) {
			return func(this, arg, expr.opts);
		}
		throw new ReferenceError("Unknown custom function: " + expr.name);
	}
}
