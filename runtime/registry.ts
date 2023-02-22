import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {Formattable, Matchable} from "./RuntimeValue.js";

export interface FormattingFunc {
	(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): Formattable;
}

export interface MatchingFunc {
	(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): Matchable;
}

export class Registry {
	static formatters: Map<string, FormattingFunc> = new Map();
	static matchers: Map<string, MatchingFunc> = new Map();
}
