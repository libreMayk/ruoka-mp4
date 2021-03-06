import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Date: React.FC<{
	titleText: string;
	titleColor: string;
	font?: string;
	marginTop: number;
}> = ({titleText, titleColor, font, marginTop}) => {
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();
	const text = titleText.split(' ').map((t) => ` ${t} `);
	return (
		<h1
			style={{
				fontFamily: `${font}, SF Pro Text, Helvetica, Arial`,
				fontWeight: 'bold',
				fontSize: 80,
				textAlign: 'left',
				marginTop: marginTop - 6 + 'rem',
				marginLeft: '5rem',
				width: '100%',
			}}
		>
			{text.map((t, i) => {
				return (
					<span
						key={t}
						style={{
							color: titleColor,
							marginLeft: 10,
							marginRight: 10,
							transform: `scale(${spring({
								fps: videoConfig.fps,
								frame: frame - i * 5,
								config: {
									damping: 100,
									stiffness: 200,
									mass: 0.5,
								},
							})})`,
							display: 'inline-block',
						}}
					>
						{t}
					</span>
				);
			})}
		</h1>
	);
};
