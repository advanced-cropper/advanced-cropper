const RELEASE = !!process.env.RELEASE;

if (!RELEASE) {
	console.log('Run `npm run publish:dist` to publish the package');
	process.exit(1);
}
