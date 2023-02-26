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

	static from(other: Person, extend_opts?: PersonFormatOptions) {
		return new this(other.firstName, other.lastName, {
			...other.opts,
			...extend_opts,
		});
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
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): Person {
	if (arg instanceof Person) {
		return apply_person(ctx, arg, opts);
	}
	throw new TypeError();
}

export function map_person(
	ctx: FormattingContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeList {
	if (arg instanceof RuntimeList) {
		let person_values: Array<Person> = [];
		for (let element of arg.value) {
			if (element instanceof Person) {
				person_values.push(apply_person(ctx, element, opts));
			}
		}
		return new RuntimeList(person_values, arg.opts);
	}
	throw new TypeError();
}

export function apply_person(ctx: FormattingContext, value: Person, opts: Map<string, RuntimeValue>): Person {
	if (ctx.locale !== "ro") {
		throw new Error("Only Romanian is supported");
	}

	let explicit_opts: PersonFormatOptions = {};
	if (opts.has("name")) {
		let optval = opts.get("name");
		if (optval instanceof RuntimeString) {
			if (optval.value === "first" || optval.value === "last" || optval.value === "full") {
				explicit_opts.name = optval.value;
			}
		}
	}
	if (opts.has("declension")) {
		let optval = opts.get("declension");
		if (optval instanceof RuntimeString) {
			if (optval.value === "nominative" || optval.value === "dative") {
				explicit_opts.declension = optval.value;
			}
		}
	}

	return Person.from(value, explicit_opts);
}
