'use strict';

require('dotenv/config');
const app = require('./server.tsx');

require('greenlock-express')
	.init({
		packageRoot: __dirname,
		configDir: './greenlock.d',
		maintainerEmail: process.env.EMAIL,
		cluster: false,
	})
	// Serves on ports 80 and 443
	// Magically get SSL certificates!
	.serve(app);
