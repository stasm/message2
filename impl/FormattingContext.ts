import * as ast from "../syntax/ast.js";
import {REGISTRY_FORMAT, REGISTRY_MATCH} from "./registry.js";
import {RuntimeString} from "./RuntimeString.js";
import {Formattable, Matchable, RuntimeValue} from "./RuntimeValue.js";

// Resolution context for a single formatMessage() call.

export class FormattingContext {
	locale: string;
	vars: Record<string, RuntimeValue>;
	// TODO(stasm): expose cached formatters, etc.

	constructor(locale: string, vars: Record<string, RuntimeValue>) {
		this.locale = locale;
		this.vars = vars;
	}

	formatPattern(pattern: ast.Pattern): string {
		let output = "";
		for (let value of this.resolvePattern(pattern)) {
			output += value.formatToString(this);
		}
		return output;
	}

	*resolvePattern(pattern: ast.Pattern): IterableIterator<Formattable> {
		let result = "";
		for (let element of pattern.elements) {
			if (element instanceof ast.Text) {
				yield new RuntimeString(element.value);
			} else if (element instanceof ast.FunctionExpression) {
				let callable = REGISTRY_FORMAT[element.name];
				yield callable(this, null, element.opts);
			} else if (element instanceof ast.OperandExpression) {
				if (element.func) {
					let func = REGISTRY_FORMAT[element.func.name];
					yield func(this, element.arg, element.func.opts);
				} else if (element.arg instanceof ast.VariableReference) {
					yield this.vars[element.arg.name];
				} else {
					yield new RuntimeString(element.arg.value);
				}
			} else {
				// TODO(stasm): markup
			}
		}
		return result;
	}

	selectVariant(variants: Array<ast.Variant>, selectors: Array<ast.Expression>): ast.Variant {
		let resolved_selectors: Array<Matchable> = [];
		for (let expression of selectors) {
			if (expression instanceof ast.FunctionExpression) {
				let func = REGISTRY_MATCH[expression.name];
				let value = func(this, null, expression.opts);
				resolved_selectors.push(value);
			} else if (expression.func) {
				let func = REGISTRY_MATCH[expression.func.name];
				let value = func(this, expression.arg, expression.func.opts);
				resolved_selectors.push(value);
			} else if (expression.arg instanceof ast.VariableReference) {
				let value = this.vars[expression.arg.name];
				resolved_selectors.push(value);
			} else {
				let value = new RuntimeString(expression.arg.value);
				resolved_selectors.push(value);
			}
		}

		to_next_variant: for (let variant of variants) {
			to_next_key: for (let i = 0; i < resolved_selectors.length; i++) {
				let key = variant.keys[i];
				if (key instanceof ast.Star) {
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

	toRuntimeValue(node: ast.SyntaxNode): RuntimeValue {
		if (node instanceof ast.Literal) {
			return new RuntimeString(node.value);
		}
		if (node instanceof ast.VariableReference) {
			return this.vars[node.name];
		}
		throw new TypeError("Invalid node type.");
	}
}
