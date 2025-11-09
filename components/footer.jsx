import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='grid bg-primary p-6 w-full mt-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-white'>
      <div className='col-span-1 m-4 flex flex-col sm:place-items-start space-y-6 mx-auto'>
        <h1 className='text-xl mb-4 underline'>
          Great services/products - Johannesburg.
        </h1>
        <p className='text-sm'>
        <Link className='font-bold underline' href={'http://adlocal.co.za'}>Adlocal</Link> - Local advertising 
        </p>
        <p className='text-sm'>
        <Link className='font-bold underline' href={'http://wildflowerhoney.co.za'}>Wildflower honey</Link> - Local honey 
        </p>
        <p className='text-sm'>
        <Link className='font-bold underline' href={'http://activeoxygen.co.za'}>Active Oxygen</Link> - Ozonation 
        </p>
        <p className='text-sm'>
        <Link className='font-bold underline' href={'http://pma-deco.co.za'}> Upholsterers </Link> - Refurbishers 
        </p>

      </div>
      <div className='col-span-1 m-4 flex justify-center'>
        <Image
          alt={'Local to your area'}
          src={'/flag-map-south-africa.jpg'}
          width={300}
          height={300}
          className='rounded-md'>
        </Image>
      </div>
      <div className='col-span-1 m-4'>
        <div  className='flex flex-col space-evenly'>
          <div className='text-md sm:mx-auto' align-top>Built and sponsored by: </div>
          <Link href='http://netsecurity.co.za'>
            <div className='bg-white rounded-md mx-auto flex flex-col justify-center align-bottom m-6'>
              <Image 
                alt="Netsecurity"
                src='/netsec-logo-sm.png' 
                width={200} 
                height={100}
                className='rounded-md self-center'>
              </Image>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  )
}
