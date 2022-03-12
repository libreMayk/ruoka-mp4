/**
 * This is an example of a server that returns dynamic video.
 * Run `npm run server` to try it out!
 * If you don't want to render videos on a server, you can safely
 * delete this file.
 */

import {bundle} from '@remotion/bundler';
import {
	getCompositions,
	renderFrames,
	stitchFramesToVideo,
} from '@remotion/renderer';
import express, {Request, Response} from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import moment from 'moment';

const clc = require('cli-color');

const app = express();
const port = process.env.PORT || 8000;
const compositionId = 'Food';

const cache = new Map<string, string>();

export const info = clc.bold.blue('[INFO] ');
export const success = clc.bold.green('[SUCCESS] ');
export const warning = clc.bold.yellow('[WARNING] ');
export const error = clc.bold.red('[ERROR] ');

const createVideo = async (inputProps?: object | undefined) => {
	const bundled = await bundle(path.join(__dirname, './src/index.tsx'));
	const comps = await getCompositions(bundled, {inputProps});
	const video = comps.find((c) => c.id === compositionId);
	if (!video) {
		throw new Error(`No video called ${compositionId}`);
	}

	const tmpDir = path.resolve(process.env.VIDEO_DIR || 'videos');
	await fs.promises.mkdir(tmpDir, {recursive: true});
	const key = moment(new Date()).format('YYYYMMDD') + '.mp4';
	const finalOutput = path.join(tmpDir, 'ruoka' + key);

	if (fs.existsSync(finalOutput)) {
		return finalOutput;
	} else {
		const {assetsInfo} = await renderFrames({
			config: video,
			webpackBundle: bundled,
			onStart: () => console.log(info + 'Rendering frames...'),
			onFrameUpdate: (f) => {
				if (f % 10 === 0) {
					process.stdout.write(info + `Rendered frame ${clc.bold(f)}...\r`);
				}
			},
			parallelism: null,
			outputDir: tmpDir,
			inputProps,
			compositionId,
			imageFormat: 'jpeg',
		});

		await stitchFramesToVideo({
			dir: tmpDir,
			force: true,
			fps: video.fps,
			height: video.height,
			width: video.width,
			outputLocation: finalOutput,
			imageFormat: 'jpeg',
			assetsInfo,
		});
	}

	return finalOutput;
};

const cacheVideo = async (req: Request, res: Response) => {
	const sendFile = (file: string) => {
		fs.createReadStream(file)
			.pipe(res)
			.on('close', () => {
				res.end();
			});
	};

	try {
		if (cache.get(JSON.stringify(req.query))) {
			sendFile(cache.get(JSON.stringify(req.query)) as string);
			return;
		}

		res.set('content-type', 'video/mp4');

		const finalOutput = await createVideo();
		sendFile(finalOutput);

		console.log(success + 'Video rendered and sent!');

		fs.readdirSync('./videos').map((f) => {
			if (f.endsWith('.jpeg')) {
				fs.unlinkSync('./videos/' + f);
			} else {
				return;
			}
		});
	} catch (err) {
		console.log(error + 'An error has occured...');
		console.error(err);
		res.json({
			error: err,
		});
	}
};

app.get('/', async (req, res) => {
	cacheVideo(req, res);
});

app.listen(port);

console.log(success + `Server is running on http://localhost:${port}.`);

axios
	.get(`http://localhost:${port}`)
	.then(() => {
		console.log(success + 'Successfully fetched the API!');
	})
	.catch((err) => {
		console.log(error + 'An error has occured...');
		console.error(err);
	});
