import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AllImages from '@/components/all-images';
import crafters from './../../../data/data.json';

//import Card from '../../../components/card';
{
	/* <div className='max-w-sm rounded overflow-hidden shadow-lg flex flex-col flex-auto p-20' > */
}

// Dynamically generate metadata from params in url segment
export function generateMetadata({ params: { slug } }) {

  const crafter = crafters.find(craft => craft.slug === slug)

	return {
		title: 'Crafters - ' + crafter.title,
		description: 'The crafter description',
	};
}

const CraftersNamePage = ({ params: { slug } }) => {
	const crafter = crafters.find((item) => item.slug === slug);

	if (!crafter) {
		return notFound();
	}

	const exploreLink = `/crafters/${crafter.slug}`;

	return (
		<>
			<div className='grid place-items-center'>
				<div className='grid grid-cols-1 md:grid-cols-2 sm:mt-28 md:mt-24 mt-20'>
					<div className='w-full max-w-md mb-4 rounded-md border-2 border-slate-300'>
						<Image
							src={`/images/profile/${crafter.landingPic}`}
							alt={crafter.title}
							width={1200}
							height={939}
							sizes='100vw'
							className='object-fill rounded-md max-w-full h-auto'
							//className="image"
							//placeholder="blur"
							// style={{
							//     maxWidth: "100%",
							//     height: "14rem"
							// }}
							// style={{
							//   width: "auto",
							//   height: "auto"
							// }}
						/>
					</div>

					<div className='flex flex-col justify-center '>
						<div className='text-2xl text-primary mx-auto font-bold'>
							{crafter.title}
						</div>
						<div className='mx-auto text-sm font-bold'>{crafter.category}</div>
						<address className='mx-auto'>{crafter.location}</address>
						<div className=' mx-auto mb-8'>{crafter.mobile}</div>
					</div>
				</div>
				<Suspense fallback={<div>Loading images...</div>}>
					<AllImages allImages={crafter.images} slugName={slug} />
				</Suspense>
			</div>
		</>
	);
};

export function generateStaticParams() {
	return crafters.map((crft) => ({ slug: crft.slug.toString() }));
}

export default CraftersNamePage;
