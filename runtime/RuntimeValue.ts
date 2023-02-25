import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {MessagePart} from "./MessageFormat.js";

export interface RuntimeValue {
	formatToString(ctx: FormattingContext): string;
	formatToParts(ctx: FormattingContext): IterableIterator<MessagePart>;
	match(ctx: FormattingContext, key: ast.Literal): boolean;
}
