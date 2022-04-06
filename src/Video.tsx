import {Composition} from 'remotion';
import {Food} from './Food';
import {Meal} from './Food/Meal';
import {Date} from './Food/Date';

export const RemotionVideo: React.FC = () => {
	const width = 1080;
	const height = 1080;
	const fps = 60;

	return (
		<>
			<Composition
				id="Food"
				component={Food}
				durationInFrames={300}
				fps={fps}
				width={width}
				height={height}
				defaultProps={{
					titleColor: 'white',
				}}
			/>
			<Composition
				id="Title"
				component={Date}
				durationInFrames={200}
				fps={60}
				width={width}
				height={height}
			/>
			<Composition
				id="Meal"
				component={Meal}
				durationInFrames={200}
				fps={60}
				width={width}
				height={height}
			/>
		</>
	);
};
