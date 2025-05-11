export default function (line, context = {}) {
	let {index, file, fileType, type, indent} = context;
	let ret = {file, line: index, type};

	if (line.startsWith("^")) {
		line = line.slice(1);
	}

	ret.commit = line.match(/^[0-9a-f]{6,}/i)[0];
	line = line.slice(ret.commit.length + 1);

	let commitInfo = line.match(/^.*?\((?<author>.+?)\s+(?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}) (?<timezone>[+-]?\d{4})\s+\d+\) /);

	if (commitInfo === null) {
		console.error("No match for", line);
	}

	ret.author = commitInfo.groups.author;

	// Temporal info
	let {date, time, timezone} = commitInfo.groups;
	ret.date = date;
	ret.time = time;
	ret.timezone = timezone.slice(0, 3) + ":" + timezone.slice(3);
	ret.datetime = date + "T" + time + ret.timezone;

	line = line.slice(commitInfo[0].length);

	let lineIndent = line.match(RegExp(`^(${indent})*`))[0]; // will always match something due to the *
	ret.depth = lineIndent.length / indent.length;

	line = line.trim();

	if (fileType === "svelte") {
		if (line === "<style>") {
			context.type = "css";
		}
		else if (line === "<script>") {
			context.type = "js";
		}
		else if (/<\/style>|<\/script>/.test(line)) {
			ret.type = context.type = fileType;
		}
	}

	ret.length = line.slice(indent.length).length;
	return ret;
}
