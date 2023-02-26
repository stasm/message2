import {FormatContext} from "./FormatContext.js";
import {RuntimeValue} from "./RuntimeValue.js";

export interface CustomFunction {
	(ctx: FormatContext, arg: RuntimeValue | null, opts: Map<string, RuntimeValue>): RuntimeValue;
}

export class Registry {
	static functions: Map<string, CustomFunction> = new Map();

	static getFunction(name: string) {
		let func = this.functions.get(name);
		if (func) {
			return func;
		}
		throw new ReferenceError("Unknown custom function: " + name);
	}
}
