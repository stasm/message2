import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {MessagePart, OpaquePart} from "./MessageFormat.js";

export type RuntimeValue = Formattable & Matchable;

export interface Formattable {
	formatToString(ctx: FormattingContext): string;
	formatToParts(ctx: FormattingContext): IterableIterator<MessagePart | OpaquePart>;
}

export interface Matchable {
	match(ctx: FormattingContext, key: ast.Literal): boolean;
}
