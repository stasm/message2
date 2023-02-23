import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";

export type RuntimeValue = Formattable & Matchable;
export type RuntimePart = FormattedPart | OpaquePart;

export interface Formattable {
	formatToString(ctx: FormattingContext): string;
	formatToParts(ctx: FormattingContext): IterableIterator<RuntimePart>;
}

export interface Matchable {
	match(ctx: FormattingContext, key: ast.Literal): boolean;
}

export interface FormattedPart {
	type: string;
	value: string;
}

export interface OpaquePart {
	type: "opaque";
	value: unknown;
}