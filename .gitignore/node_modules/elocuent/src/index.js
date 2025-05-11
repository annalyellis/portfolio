import { createWriteStream } from "fs";
import { spawn } from "child_process";
import { createInterface } from 'readline';
import { globSync } from "glob";

import parseLine from "./parse-line.js";
import defaults from "./defaults.js";

function resolveOptions(options) {
	options = Object.assign({}, defaults, options);

	if (!options.input) {
		// Generate glob from dirs and types
		let dirGlob = options.dir.includes(",")? `{${options.dir}}` : options.dir;
		let typeGlob = options.types.includes(",")? `{${options.types}}` : options.types;
		options.input = `${dirGlob}/**/*.${typeGlob}`;
	}

	options.indent ??= options.spaces ? " ".repeat(options.spaces === true ? 2 : options.spaces) : "\t";
	return options;
}

export default async function (options = {}) {
	let originalOptions = options;
	options = resolveOptions(originalOptions);

	if (options.dryRun) {
		console.info("Dry run. No files will be written.");
		options.verbose = true;
	}

	if (options.verbose) {
		console.info("Options:", originalOptions);
		console.info("Resolved options:", options);
	}

	// Read input files
	const files = globSync(options.input);

	if (files.length === 0) {
		console.error("No files found");
		process.exit(1);
	}

	if (options.verbose) {
		console.info("Files to be read:", files);
	}

	let stream, blameStream;

	if (!options.dryRun) {
		stream = createWriteStream(options.output);

		if (options.blameOut) {
			blameStream = createWriteStream(options.blameOut);
		}
	}

	let wroteHeader = false;
	let totalLines = 0;

	for (let i=0; i<files.length; i++) {
		const file = files[i];
		const gitBlame = spawn('git', ['blame', file]);
		const rl = createInterface({ input: gitBlame.stdout });

		// Line number
		let index = 1;
		let fileType = file.split(".").pop();
		let type = fileType;

		blameStream?.write(`${i > 0? "\n" : ""}File: ${file}\n${"-".repeat(file.length + 7)}\n\n`)

		for await (let line of rl) {
			blameStream?.write(line + "\n");
			totalLines++;
			let context = {file, index: index++, fileType, type, indent: options.indent};
			let info = parseLine(line, context);
			type = context.type;

			if (!wroteHeader) {
				stream?.write(Object.keys(info).join(",") + "\n");

				wroteHeader = true;
			}

			stream?.write(Object.values(info).join(",") + "\n");
		}

		gitBlame.kill();
	}

	console.info(`Analyzed a total of ${totalLines} lines of code in ${files.length} files. Results written to ${options.output}`);

	stream?.end();
	blameStream?.end();
}