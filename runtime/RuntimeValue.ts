import * as ast from "../syntax/ast.js";
import {FormatContext} from "./FormatContext.js";
import {MessagePart} from "./MessageFormat.js";

export interface RuntimeValue {
	formatToString(ctx: FormatContext): string;
	formatToParts(ctx: FormatContext): IterableIterator<MessagePart>;
	match(ctx: FormatContext, key: ast.Literal): boolean;
}
