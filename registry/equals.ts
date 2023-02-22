import {FormattingContext, Matchable, RuntimeString} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export function match_equals(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Matchable {
	if (arg === null) {
		throw new TypeError();
	}
	let value = ctx.resolveOperand(arg);
	if (value instanceof RuntimeString) {
		return value;
	}
	throw new TypeError();
}
