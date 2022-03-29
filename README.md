[![mayk_logo](https://www.mayk.fi/wp-content/uploads/2017/06/pelkka%CC%88piiArtboard-2.png)](https://www.mayk.fi/)

# ruoka-mp4

`ruoka-mp4` is an API for [mayk.fi](https://www.mayk.fi/tietoa-meista/ruokailu/)'s food menu and a video generator. It creates a video with [Remotion](https://www.remotion.dev/) using Node.js in an Instagram-like format.

## API description & endpoints

### Endpoints

1. [/api](#apiapi-endpoint)
2. [/video](#videovideo-endpoint)

### [`/api`](/api) endpoint

There you can find the API in a JSON format. This is what it would look like:

```json
{
	"status_code": 200,
	"status_message": null,
	"time_now": 1648581930492,
	"url": "https://www.mayk.fi/tietoa-meista/ruokailu/",
	"data": {
		"menu": {
			"food": {
				"date": ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai"],
				"normal": [
					"monday meal",
					"tuesday meal",
					"wednesday meal",
					"thursday meal",
					"friday meal"
				],
				"vege": [
					"vegan monday meal",
					"vegan tuesday meal",
					"vegan wednesday meal",
					"vegan thursday meal",
					"vegan friday meal"
				]
			}
		},
		"menu_today": {
			"food": {
				"num_date": 1,
				"today_date_full": "maaliskuu 29. 2022, 10:25:30 pm",
				"today_date": "29.3.2022",
				"current_week": "13",
				"date": "Tiistai",
				"normal": "tuesday meal",
				"vege": "vegan tuesday meal"
			}
		}
	}
}
```

### [`/video`](/video) endpoint

When the video is rendered, it is sent to [`/video`](/video) as a **video** in `.mp4` format. Here is an example:

[![ruoka_preview](http://img.youtube.com/vi/MnTTeq7vGtc/0.jpg)](http://www.youtube.com/watch?v=MnTTeq7vGtc 'ruoka_preview')
