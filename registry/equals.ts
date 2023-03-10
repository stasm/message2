import {FormatContext, RuntimeString, RuntimeValue} from "../runtime/index.js";

export function match_equals(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeValue {
	if (arg === null) {
		throw new TypeError();
	}
	if (arg instanceof RuntimeString) {
		return arg;
	}
	throw new TypeError();
}
