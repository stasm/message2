import {FormattingContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeList} from "./list.js";

export interface PersonFormatOptions {
	name?: "first" | "last" | "full";
	declension?: "nominative" | "dative";
}

export class Person implements RuntimeValue {
	firstName: string;
	lastName: string;
	opts: PersonFormatOptions;

	constructor(firstName: string, lastName: string, opts: PersonFormatOptions = {}) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.opts = opts;
	}

	formatToString(ctx: FormattingContext) {
		switch (this.opts.name) {
			case "first":
				return this.#decline(ctx, this.firstName);
			case "last":
				return this.#decline(ctx, this.lastName);
			case "full":
			default:
				// Decline only the first name.
				return this.#decline(ctx, this.firstName) + " " + this.lastName;
		}
	}

	*formatToParts(ctx: FormattingContext) {
		switch (this.opts.name) {
			case "first":
				yield {type: "person_name_first", value: this.#decline(ctx, this.firstName)};
			case "last":
				yield {type: "person_name_last", value: this.#decline(ctx, this.lastName)};
			case "full":
			default:
				// Decline only the first name.
				yield {type: "person_name_first", value: this.#decline(ctx, this.firstName)};
				yield {type: "literal", value: " "};
				yield {type: "person_name_last", value: this.lastName};
		}
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}

	#decline(ctx: FormattingContext, name: string): string {
		if (this.opts.declension === "dative") {
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

export function format_person(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Person {
	if (arg === null) {
		throw new TypeError();
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof Person) {
		return apply_person(ctx, arg_value, opts);
	}
	throw new TypeError();
}

export function map_person(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): RuntimeList {
	if (arg === null) {
		throw new TypeError();
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeList) {
		let person_values: Array<Person> = [];
		for (let element of arg_value.value) {
			if (element instanceof Person) {
				person_values.push(apply_person(ctx, element, opts));
			}
		}
		return new RuntimeList(person_values, arg_value.opts);
	}
	throw new TypeError();
}

export function apply_person(ctx: FormattingContext, value: Person, opts: ast.Options): Person {
	if (ctx.locale !== "ro") {
		throw new Error("Only Romanian is supported");
	}

	let resolved_opts: PersonFormatOptions = {};
	if (opts.has("name")) {
		let value = ctx.resolveOperand(opts.get("name"));
		if (value instanceof RuntimeString) {
			if (value.value === "first" || value.value === "last" || value.value === "full") {
				resolved_opts.name = value.value;
			}
		}
	}
	if (opts.has("declension")) {
		let value = ctx.resolveOperand(opts.get("declension"));
		if (value instanceof RuntimeString) {
			if (value.value === "nominative" || value.value === "dative") {
				resolved_opts.declension = value.value;
			}
		}
	}

	return new Person(value.firstName, value.lastName, {
		...value.opts,
		...resolved_opts,
	});
}
