import {Img} from 'remotion';
export const MaykLogo: React.FC = () => {
	const imgUrl =
		'https://www.mayk.fi/wp-content/uploads/2017/06/favicon-150x150.png';

	return (
		<div>
			<Img
				style={{
					position: 'absolute',
					right: 25,
					bottom: 25,
					filter: 'brightness(150%)',
					opacity: 0.1,
				}}
				src={imgUrl}
			/>
		</div>
	);
};
