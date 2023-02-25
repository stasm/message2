import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {RuntimeValue} from "./RuntimeValue.js";

export interface CustomFunction {
	(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): RuntimeValue;
}

export class Registry {
	static functions: Map<string, CustomFunction> = new Map();
}
