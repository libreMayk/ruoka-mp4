const got = (...args) => import('got').then(({default: got}) => got(...args));
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

const express = require('express');
const moment = require('moment');
const clc = require('cli-color');
const app = express();

const port = process.env.PORT || 8080;

const food = {
	date: [] || null,
	normal: [] || null,
	vege: [] || null,
};

const url = 'https://www.mayk.fi/tietoa-meista/ruokailu/';

const info = clc.bold.blue('[INFO] ');
const success = clc.bold.green('[SUCCESS] ');
const warning = clc.bold.yellow('[WARNING] ');
const error = clc.bold.red('[ERROR] ');

const fetchData = () => {
	got(url)
		.then((response) => {
			const dom = new JSDOM(response.body);
			const ruokaMenu = dom.window.document.querySelectorAll(
				'.ruoka-template-header'
			);

			Array.from(ruokaMenu).map((element) => {
				const ruokaPvm = element.querySelector('.ruoka-header-pvm').textContent;
				const ruoka = element.querySelector('.ruoka-header-ruoka').textContent;
				const kasvisruoka = element.querySelector(
					'.ruoka-header-kasvisruoka'
				).textContent;

				if (food.date[4]) return;
				else {
					food.date.push(ruokaPvm.replace(/\s+/g, '')); // ruokaPvm.replace(/\s+/g, '');
					food.normal.push(ruoka); // ruoka
					food.vege.push(kasvisruoka.replace(/ {2}Kasvisruoka /g, '')); // kasvisruoka.replace(/ {2}Kasvisruoka/g, '')
				}
			});

			console.log(
				info + `Fetched data at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`
			);
		})
		.catch((err) => {
			console.log(err);
		});
};

const getTodayDateNum = () => {
	if (moment().locale('fi').isoWeekday() - 1 >= 5) {
		return 4;
	} else {
		return moment().locale('fi').isoWeekday() - 1;
	}
};

fetchData();

app.get('/', (req, res) => {
	res.redirect('/cors');
});

app.get('/cors', (req, res) => {
	fetchData();

	res.set('Access-Control-Allow-Origin', '*');

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

app.listen(port);

console.info(success + `API is running on http://localhost:${port}\n`);

/* eslint-env node */
module.exports = {
	info,
	success,
	warning,
	error,
};
