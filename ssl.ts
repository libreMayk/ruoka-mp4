'use strict';

require('dotenv/config');
const {app, initMain} = require('./server.tsx');
const gl = require('greenlock-express');

gl.init({
	packageRoot: __dirname,
	configDir: './greenlock.d',
	maintainerEmail: process.env.EMAIL,
	cluster: false,
})
	// Serves on ports 80 and 443
	// Magically get SSL certificates!
	.serve(app, async () => {
		await initMain();
	});
