import {Img} from 'remotion';
export const MaykLogo: React.FC = ({...props}) => {
	const imgUrl =
		'https://www.mayk.fi/wp-content/uploads/2017/06/pelkka%CC%88piiArtboard-2.png';

	return (
		<div>
			<Img
				style={{
					position: 'absolute',
					right: 25,
					bottom: 25,
					filter: 'brightness(0.5) invert(1)',
					opacity: 0.05,
					width: '150px',
				}}
				src={imgUrl}
			/>
		</div>
	);
};
