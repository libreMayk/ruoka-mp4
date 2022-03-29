import {useEffect} from 'react';
import {Audio, continueRender} from 'remotion';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {Meal} from './Food/Meal';
import {Date} from './Food/Date';
import {Logo} from './Food/Logo';
import {MaykLogo} from './Food/MaykLogo';

import {RiPlantFill} from 'react-icons/ri';
import {MdFastfood} from 'react-icons/md';

import audio from './assets/audio.mp3';
import './assets/fonts.css';
import './assets/styles.css';
import dotenv from 'dotenv';

dotenv.config();

export const Food: React.FC<{
	titleColor: string;
}> = ({titleColor}) => {
	const [data, setData] = useState(Object);
	const [handle] = useState(() => delayRender());

	const fetchData = async () => {
		const response = await fetch(`${process.env.API_URL}/api`, {
			mode: 'cors',
		});
		const json = await response.json();
		console.log(data);
		setData(json);

		continueRender(handle);
	};

	useEffect(() => {
		fetchData();
	}, []);

	const frame = useCurrentFrame();
	const videoConfig = useVideoConfig();

	const opacity = interpolate(
		frame,
		[videoConfig.durationInFrames - 25, videoConfig.durationInFrames - 15],
		[1, 0],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	const opacityIcon = interpolate(frame, [0, 60], [0, 1]);

	const globalFont = 'Muli';

	return data.data ? (
		<div style={{flex: 1, backgroundColor: '#111116'}}>
			<Audio src={audio} startFrom={0} endAt={300} />
			<div style={{opacity}}>
				<Sequence from={0} durationInFrames={videoConfig.durationInFrames}>
					<Logo transitionStart={25} />
				</Sequence>
				<Sequence from={0}>
					<Date
						font={globalFont}
						titleText={`${data.data.menu_today.food.date} - vk ${data.data.menu_today.food.current_week}`}
						titleColor={titleColor}
					/>
				</Sequence>
				<Sequence from={20}>
					<div
						style={{
							marginTop: '31rem',
							marginLeft: '6rem',
							display: 'inline',
							color: 'white',
						}}
					>
						<div
							style={{
								display: 'inline-flex',
							}}
						>
							<MdFastfood
								style={{
									fontSize: '60px',
									marginRight: '20px',
									opacity: opacityIcon,
								}}
							/>
							<Meal
								font={globalFont}
								input={data.data.menu_today.food.normal}
							/>
						</div>
						<div
							style={{
								display: 'inline-flex',
							}}
						>
							<RiPlantFill
								style={{
									fontSize: '60px',
									marginRight: '20px',
									opacity: opacityIcon,
								}}
							/>
							<Meal font={globalFont} input={data.data.menu_today.food.vege} />
						</div>
					</div>
				</Sequence>
			</div>
			<div style={{opacity}}>
				<MaykLogo />
			</div>
		</div>
	) : (
		<div>
			<h1>Loading...</h1>
		</div>
	);
};
