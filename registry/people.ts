import {FormattingContext, RuntimeString} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeList} from "./list.js";

export function format_people(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): RuntimeList<string> {
	if (ctx.locale !== "ro") {
		throw new Error("Only Romanian supported");
	}

	if (arg === null) {
		throw new TypeError();
	}

	let elements = ctx.resolveOperand(arg);
	if (!(elements instanceof RuntimeList)) {
		throw new TypeError();
	}

	let name_format = ctx.resolveOperand(opts.get("name"));
	if (!(name_format instanceof RuntimeString)) {
		throw new TypeError();
	}

	let names: Array<string> = [];
	switch (name_format.value) {
		case "first":
			names = elements.value.map((p) => decline(p.firstName));
			break;
		case "last":
			names = elements.value.map((p) => decline(p.lastName));
			break;
		case "full":
			// Decline only the first name.
			names = elements.value.map((p) => decline(p.firstName) + " " + p.lastName);
			break;
	}

	let list_style = ctx.resolveOperand(opts.get("style"));
	if (!(list_style instanceof RuntimeString)) {
		throw new TypeError();
	}

	let list_type = ctx.resolveOperand(opts.get("type"));
	if (!(list_type instanceof RuntimeString)) {
		throw new TypeError();
	}

	return new RuntimeList(names, {
		// TODO(stasm): Add default options.
		style: list_style.value as Intl.ListFormatStyle,
		type: list_type.value as Intl.ListFormatType,
	});

	function decline(name: string): string {
		let declension = ctx.resolveOperand(opts.get("case"));
		if (!(declension instanceof RuntimeString)) {
			throw new TypeError();
		}

		if (declension.value === "dative") {
			switch (true) {
				case name.endsWith("ana"):
					return name.slice(0, -3) + "nei";
				case name.endsWith("ca"):
					return name.slice(0, -2) + "căi";
				case name.endsWith("ga"):
					return name.slice(0, -2) + "găi";
				case name.endsWith("a"):
					return name.slice(0, -1) + "ei";
				default:
					return "lui " + name;
			}
		} else {
			return name;
		}
	}
}
