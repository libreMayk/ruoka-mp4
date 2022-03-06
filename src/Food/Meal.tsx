import {interpolate, useCurrentFrame} from 'remotion';

export const Meal: React.FC<{
	input: string;
	font?: string;
}> = ({input, font}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 30], [0, 1]);
	return (
		<div
			style={{
				fontFamily: `${font}, SF Pro Text, Helvetica, Arial`,
				fontSize: 50,
				textAlign: 'left',
				width: '100%',
				color: 'white',
				opacity,
			}}
		>
			{input}
		</div>
	);
};
