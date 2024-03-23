require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");
const { Octokit } = require("octokit");
const octokit = new Octokit({
	auth: process.env.API_KEY,
});

const PAGE_SIZE = 100;

const asyncSpawn = async (command, args, cwd) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
		});
		// Listen for stdout data
		child.stdout.on("data", data => {
			console.log(`stdout: ${data}`);
		});

		// Listen for stderr data
		child.stderr.on("data", data => {
			console.error(`stderr: ${data}`);
		});

		// Listen for process exit
		child.on("close", code => {
			console.log(`child process exited with code ${code}`);
			resolve();
		});
	});
};

const clone = async repository => {
	// clone from repository to organization

	const filepath = path.resolve("repositories", repository.name);
	await asyncSpawn(`git`, ["clone", repository.clone_url, filepath]);
};

(async () => {
	const getPage = async page => {
		const res = await octokit.request("GET /orgs/{org}/repos", {
			org: process.env.ORG_NAME,
			per_page: PAGE_SIZE,
			page,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});
		return res.data;
	};

	let page = 1;
	let hasMore = true;
	do {
		const repos = await getPage(page++);
		hasMore = repos.length === PAGE_SIZE;
		for (const repo of repos) await clone(repo);
	} while (hasMore);
})();
