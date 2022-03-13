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

const clc = require('cli-color');

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

		const finalOutput = await createVideo();
		sendFile(finalOutput);

		console.log(success + 'Sent video in', Date.now() - start, 'ms');
	} catch (err) {
		console.log(error + 'An error has occured...');
		console.error(err);
		res.json({
			error: err,
		});
	}
};

let food: IFood | undefined = undefined;

app.get('/cors', async (req, res) => {
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

app.get('/', async (req, res) => {
	cacheVideo(req, res);
});

app.listen(port, async () => {
	food = await fetchData();
	fs.writeFileSync(
		`./videos/${moment(new Date()).format('YYYYMMDD')}.json`,
		JSON.stringify(food)
	);

	console.info(info + `Creating & sending the video...`);
	await createVideo();
	console.log(success + 'Sent video!');

	const continent = process.env.CRON_CONT || 'Europe';
	const city = process.env.CRON_CITY || 'Helsinki';

	const job = new CronJob(
		'0 7 * * *',
		async () => {
			await fetchData();

			console.info(info + `Creating & sending the video...`);
			await createVideo();
			console.log(success + 'Sent video!');
		},
		null,
		true,
		`${continent + '/' + city}`
	);

	job.start();
});

console.info(success + `Server is running on http://localhost:${port}.`);
