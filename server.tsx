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
import {JSDOM} from 'jsdom';
import {CronJob} from 'cron';
import MarkdownIt from 'markdown-it';
import dotenv from 'dotenv';

dotenv.config();
const clc = require('cli-color');

const md = new MarkdownIt();
const app = express();
const port = process.env.PORT || 8080;
const compositionId = 'Food';

export const info = clc.bold.blue('[INFO] ');
export const success = clc.bold.green('[SUCCESS] ');
export const warning = clc.bold.yellow('[WARNING] ');
export const error = clc.bold.red('[ERROR] ');

const url = 'https://www.mayk.fi/tietoa-meista/ruokailu/';

interface IFood {
	date: string[];
	normal: string[];
	vege: string[];
}
let busy = false;

const fetchData = () =>
	new Promise<IFood | undefined>((resolve) => {
		const start = Date.now();
		console.info(info + `Fetching data...`);

		axios(url)
			.then((response) => {
				const dom = new JSDOM(response.data);
				const ruokaMenu = Array.from(
					dom.window.document.querySelectorAll('.ruoka-template-header')
				) as HTMLElement[];

				const food: IFood = {
					date: [],
					normal: [],
					vege: [],
				};

				ruokaMenu.map((element) => {
					const ruokaPvm =
						element.querySelector('.ruoka-header-pvm')?.textContent;
					const ruoka = element.querySelector(
						'.ruoka-header-ruoka'
					)?.textContent;
					const kasvisruoka = element.querySelector(
						'.ruoka-header-kasvisruoka'
					)?.textContent;

					if (ruokaPvm && ruoka && kasvisruoka) {
						food.date.push(ruokaPvm.replace(/\s+/g, '')); // ruokaPvm.replace(/\s+/g, '');
						food.normal.push(ruoka); // ruoka
						food.vege.push(kasvisruoka.replace(/ {2}Kasvisruoka /g, '')); // kasvisruoka.replace(/ {2}Kasvisruoka/g, '')
					}
				});

				console.log(
					info + `Fetched data in`,
					Date.now() - start,
					`ms at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`
				);

				resolve(food);
			})
			.catch((err) => {
				console.warn('Failed to fetch', err);
				resolve(undefined);
			});
	});

const getTodayDateNum = () => {
	if (moment().locale('fi').isoWeekday() - 1 >= 5) {
		return 4;
	} else {
		return moment().locale('fi').isoWeekday() - 1;
	}
};

const createVideo = async (inputProps?: object | undefined) => {
	const tmpDir = path.resolve(process.env.VIDEO_DIR || 'videos');
	await fs.promises.mkdir(tmpDir, {recursive: true});
	const key = moment(new Date()).format('YYYYMMDD') + '.mp4';
	const finalOutput = path.join(tmpDir, 'ruoka' + key);

	const start = Date.now();

	if (fs.existsSync(finalOutput)) {
		return finalOutput;
	} else {
		const bundled = await bundle(path.join(__dirname, './src/index.tsx'));
		const comps = await getCompositions(bundled, {inputProps});
		const video = comps.find((c) => c.id === compositionId);
		if (!video) {
			throw new Error(`No video called ${compositionId}`);
		}

		const {assetsInfo} = await renderFrames({
			config: video,
			webpackBundle: bundled,
			onStart: () => {
				console.log(info + 'Rendering frames...');
			},
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
			envVariables: {
				SHA512_KEY:
					'sha512-KUoB3bZ1XRBYj1QcH4BHCQjurAZnCO3WdrswyLDtp7BMwCw7dPZngSLqILf68SGgvnWHTD5pPaYrXi6wiRJ65g==',
				API_URL: 'http://localhost:8080',
			},
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

		fs.readdirSync('./videos').map((file) => {
			if (file.endsWith('.jpeg')) {
				fs.unlinkSync('./videos/' + file);
			}

			if (file.startsWith('ruoka') && !file.endsWith(key)) {
				fs.unlinkSync('./videos/' + file);
			}
		});
	}

	console.log(success + 'Created video in', Date.now() - start, 'ms');

	return finalOutput;
};

const cacheVideo = async (req: Request, res: Response) => {
	const start = Date.now();
	const sendFile = (file: string) => {
		fs.createReadStream(file)
			.pipe(res)
			.on('close', () => {
				res.end();
			});
	};

	try {
		res.set('content-type', 'video/mp4');

		if (busy) {
			console.info(info + `The video is already being rendered!`);
		} else {
			console.info(info + `Creating & sending the video...`);
			const finalOutput = await createVideo();
			sendFile(finalOutput);
			console.log(success + 'Sent video in', Date.now() - start, 'ms');
		}
	} catch (err) {
		console.log(error + 'An error has occured...');
		console.error(err);
		res.json({
			error: err,
		});
	}
};

const initMain = async () => {
	food = await fetchData();
	fs.writeFileSync(
		`./videos/${moment(new Date()).format('YYYYMMDD')}.json`,
		JSON.stringify(food)
	);

	console.info(info + `Creating & sending the video...`);
	await createVideo();
	console.info(success + 'Sent video!');

	const continent = process.env.CRON_CONT || 'Europe';
	const city = process.env.CRON_CITY || 'Helsinki';

	const job = new CronJob(
		'0 7 * * *',
		async () => {
			await fetchData();

			if (busy) {
				console.info(info + `The video is already being rendered!`);
			} else {
				console.info(info + `Creating & sending the video...`);
				await createVideo();
				console.info(success + 'Sent video!');
			}
		},
		null,
		true,
		`${continent + '/' + city}`
	);

	job.start();
};

let food: IFood | undefined = undefined;

app.get('/', (req, res) => {
	const file = fs.readFileSync('./README.md');
	const head = `<title>API Documentation</title>
	<link rel="stylesheet" 
	href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css" 
	integrity="${process.env.SHA512_KEY}" 
	crossorigin="anonymous" referrerpolicy="no-referrer" />
	<style>
		@font-face {
			font-family: 'Muli';
			src: url('https://fonts.gstatic.com/s/muli/v26/7Aulp_0qiz-aVz7u3PJLcUMYOFnOkEk30eg.woff2')
				format('woff2');
			font-style: normal;
			font-weight: 400;
			unicode-range: U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2C6, U+2DA, U+2DC,
				U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF,
				U+FFFD;
		}
		@font-face {
			font-family: 'Muli';
			src: url('https://fonts.gstatic.com/s/muli/v26/7Aulp_0qiz-aVz7u3PJLcUMYOFkpl0k30eg.woff2')
				format('woff2');
			font-style: normal;
			font-weight: 700;
			unicode-range: U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2C6, U+2DA, U+2DC,
				U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF,
				U+FFFD;
		}

		@media (prefers-color-scheme: dark) {
			body {
				background: #0d1117;
			}
		}

		body {
			font-family: "Muli", -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
		}

		.markdown-body {
			box-sizing: border-box;
			min-width: 200px;
			max-width: 980px;
			margin: 0 auto;
			padding: 45px;
			font-family: "Muli";
		}
	
		@media (max-width: 800px) {
			.markdown-body {
				padding: 15px;
			}
		}
	</style>`;

	res.send(
		head +
			`<article class="markdown-body">
				${md.render(file.toString())}
			</article>`
	);
});

app.get('/api', async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');

	if (!food) {
		food = await fetchData();
	}

	if (!food) {
		return res.status(500).send({});
	}

	fs.writeFileSync(
		`./videos/${moment(new Date()).format('YYYYMMDD')}.json`,
		JSON.stringify(food)
	);

	fs.readdirSync('./videos').map(async (file) => {
		if (
			file.endsWith('.json') &&
			file.replace('.json', '') !== moment(new Date()).format('YYYYMMDD')
		) {
			food = await fetchData();
			fs.writeFileSync(
				`./videos/${moment(new Date()).format('YYYYMMDD')}.json`,
				JSON.stringify(food)
			);

			if (fs.existsSync('./videos/' + file)) {
				fs.unlinkSync('./videos/' + file);
			}
		}
	});

	res.send({
		status_code: res.statusCode,
		status_message: res.statusMessage || null,
		time_now: Date.now(),
		url,
		data: {
			menu: {
				food,
			},
			menu_today: {
				food: {
					num_date: getTodayDateNum(),
					today_date_full: moment()
						.locale('fi')
						.format('MMMM Do YYYY, h:mm:ss a'),
					today_date: moment().locale('fi').format('l'),
					current_week: moment().locale('fi').format('w'),
					date: food.date[getTodayDateNum()] || null,
					normal: food.normal[getTodayDateNum()] || null,
					vege: food.vege[getTodayDateNum()] || null,
				},
			},
		},
	});
});

app.get('/video', async (req, res) => {
	cacheVideo(req, res);
});

if (require.main === module) {
	app.listen(port, async () => {
		await initMain();
	});
}

console.info(success + `Server is running on http://localhost:${port}.`);

module.exports = {
	app,
	initMain,
};
