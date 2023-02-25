import {FormattingContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeNumber} from "./number.js";

export class RuntimePlural implements RuntimeValue {
	value: number;
	opts: Intl.PluralRulesOptions;

	constructor(value: number, opts: Intl.PluralRulesOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	static from(other: RuntimePlural, extend_opts?: Intl.PluralRulesOptions) {
		return new this(other.value, {
			...other.opts,
			...extend_opts,
		});
	}

	static fromNumber(other: RuntimeNumber, extend_opts?: Intl.PluralRulesOptions) {
		return new this(other.value, {
			minimumIntegerDigits: other.opts.minimumIntegerDigits,
			minimumFractionDigits: other.opts.minimumFractionDigits,
			maximumFractionDigits: other.opts.maximumFractionDigits,
			minimumSignificantDigits: other.opts.minimumSignificantDigits,
			maximumSignificantDigits: other.opts.maximumSignificantDigits,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext): string {
		throw new EvalError("Cannot use :plural for formatting.");
	}

	*formatToParts(ctx: FormattingContext) {
		throw new EvalError("Cannot use :plural for formatting.");
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		// Attempt an exact match on the numerical value first.
		if (this.value === parseFloat(key.value)) {
			return true;
		}
		let pr = new Intl.PluralRules(ctx.locale, this.opts);
		return pr.select(this.value) === key.value;
	}
}

export function match_plural(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): RuntimeValue {
	if (arg === null) {
		throw new TypeError();
	}

	let resolved_opts: Intl.PluralRulesOptions = {};
	if (opts.has("type")) {
		let type_value = ctx.resolveOperand(opts.get("type"));
		if (type_value instanceof RuntimeString) {
			// TODO(stasm): Validate type value.
			resolved_opts.type = type_value.value as Intl.PluralRuleType;
		}
		// TODO(stasm): Handle other types.
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeNumber) {
		return RuntimePlural.fromNumber(arg_value, resolved_opts);
	}
	if (arg_value instanceof RuntimeString) {
		let num_value = parseFloat(arg_value.value);
		return new RuntimePlural(num_value, resolved_opts);
	}
	throw new TypeError();
}
