import {test} from "tap";
import {
	FormattingContext,
	Matchable,
	MessageFormat,
	RuntimeString,
	RuntimeValue,
} from "../runtime/index.js";
import {MatchablePlural, REGISTRY_FORMAT, REGISTRY_MATCH} from "../runtime/registry.js";
import * as ast from "../syntax/ast.js";

class Person {
	firstName: string;
	lastName: string;

	constructor(firstName: string, lastName: string) {
		this.firstName = firstName;
		this.lastName = lastName;
	}
}

class RuntimeList<T extends {toString(): string}> implements RuntimeValue {
	public value: Array<T>;
	private opts: Intl.ListFormatOptions;

	constructor(value: Array<T>, opts: Intl.ListFormatOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	formatToString(ctx: FormattingContext) {
		// TODO(stasm): Cache ListFormat.
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		return lf.format(this.value.map((x) => x.toString()));
	}

	*formatToParts(ctx: FormattingContext) {
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		yield* lf.formatToParts(this.value.map((x) => x.toString()));
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

REGISTRY_MATCH["pluralOfLength"] = function (
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Matchable {
	if (arg === null) {
		throw new TypeError();
	}
	let elements = ctx.resolveOperand(arg);
	if (!(elements instanceof RuntimeList)) {
		throw new TypeError();
	}

	// TODO(stasm): Cache PluralRules.
	let pr = new Intl.PluralRules(ctx.locale);
	let category = pr.select(elements.value.length);
	return new MatchablePlural(category, elements.value.length);
};

REGISTRY_FORMAT["listOfPeople"] = function (
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
};

test("Fancy list formatting, first names only", (tap) => {
	let message = new MessageFormat(
		"ro",
		`match {$names :pluralOfLength}
		 when one {I-am dat cadouri {$names :listOfPeople style=long type=conjunction case=dative name=first}.}
		 when * {Le-am dat cadouri {$names :listOfPeople style=long type=conjunction case=dative name=first}.} `
	);
	tap.equal(
		message.format({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		"Le-am dat cadouri Mariei, Ilenei și lui Petre."
	);
	tap.same(
		message.formatToParts({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		[
			{type: "literal", value: "Le-am dat cadouri "},
			{type: "element", value: "Mariei"},
			{type: "literal", value: ", "},
			{type: "element", value: "Ilenei"},
			{type: "literal", value: " și "},
			{type: "element", value: "lui Petre"},
			{type: "literal", value: "."},
		]
	);
	tap.end();
});

test("Fancy list formatting, full names", (tap) => {
	let message = new MessageFormat(
		"ro",
		`match {$names :pluralOfLength}
		 when one {I-am dat cadouri {$names :listOfPeople style=long type=disjunction case=dative name=full}.}
		 when * {Le-am dat cadouri {$names :listOfPeople style=long type=disjunction case=dative name=full}.} `
	);

	tap.equal(
		message.format({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		"Le-am dat cadouri Mariei Stanescu, Ilenei Zamfir sau lui Petre Belu."
	);

	tap.same(
		message.formatToParts({
			names: new RuntimeList([
				new Person("Maria", "Stanescu"),
				new Person("Ileana", "Zamfir"),
				new Person("Petre", "Belu"),
			]),
		}),
		[
			{type: "literal", value: "Le-am dat cadouri "},
			{type: "element", value: "Mariei Stanescu"},
			{type: "literal", value: ", "},
			{type: "element", value: "Ilenei Zamfir"},
			{type: "literal", value: " sau "},
			{type: "element", value: "lui Petre Belu"},
			{type: "literal", value: "."},
		]
	);

	tap.end();
});
