import {readFileSync} from "fs";
import {createInterface} from "readline";
import {Lexer} from "../impl/Lexer.js";

function exit_help(exit_code) {
	console.log(`
    Print tokens parsed by the lexer.

        Usage: node lex.mjs [FILE]

        When FILE is not specified, read text from stdin.

    Examples:

        node lex.mjs path/to/file.txt
        node lex.mjs <(echo "{Hello, world!}")
        cat path/to/file.txt | node lex.mjs

    Options:

        -h, --help      Display help and quit.
`);
	process.exit(exit_code);
}

function main_stdin() {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "lexer>",
	});

	const lines = [];

	rl.on("line", (line) => lines.push(line));
	rl.on("close", () => main(lines.join("\n") + "\n"));
}

function main_file(file_path) {
	let content = readFileSync(file_path, "utf8");
	main(content);
}

function main(content) {
	let lexer = new Lexer(content);
	for (let token of lexer) {
		console.log(token);
	}
}

let [$1] = process.argv.slice(2);
if ($1 === "-h" || $1 === "--help") {
	exit_help(1);
}

if ($1) {
	main_file($1);
} else {
	main_stdin();
}
