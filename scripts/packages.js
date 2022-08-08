const glob = require('glob');
const path = require('path');
const fs = require('fs');

async function copyPackageJson(build) {
	fs.copyFileSync('./package.json', path.join(build, 'package.json'));
}

async function createPackageJsons(build) {
	const files = glob.sync('!(node)/**/index.js', { cwd: build });

	await Promise.all(
		files.map(async (file) => {
			const directory = path.dirname(file);
			const packagePath = path.join(build, directory, 'package.json');

			const packageJson = {
				sideEffects: false,
				module: './index.js',
				main: path.posix.relative(path.dirname(packagePath), path.join(build, 'node', file)),
				types: './index.d.ts',
			};

			await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
		}),
	);
}

async function run() {
	try {
		await createPackageJsons('./dist/');
		await copyPackageJson('./dist');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

run();
