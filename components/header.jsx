'use client'
import Link from 'next/link'
import Image from 'next/image';
import { FaStar, FaHome, FaEye } from 'react-icons/fa';
import { usePathname} from 'next/navigation'
import { useState, useEffect } from 'react';


const Header = () => {

  const pathname = usePathname();
  const [home, setHome] = useState(false)
  const rt = pathname.split('/')[1]

  useEffect(() => {
    setHome(pathname)
  }, [])

  return (

    <>
      <nav class="bg-primary p-2 mt-0 fixed w-full z-10 top-0">
        <div class="container mx-auto flex flex-wrap items-center">
          <div class="flex w-full md:w-1/2 justify-center md:justify-start text-white font-extrabold">
            <Link class="text-white no-underline hover:text-white hover:no-underline" href="/">
              <div className='flex flex-row '>
                <div>
                  <Image
                    className="width-full bg-slate-900 rounded-full p-1"
                    src={'/favicon-32x32.png'}
                    alt={''}
                    width={32}
                    height={32}
                    slyles={{
                      height: "auto",
                      width: "auto"
                    }} 
                  />
                </div>
                <div>
                  <span class="text-2xl pl-2"> Street Craft</span>
                </div>
              </div>
            </Link>
  
          </div>
            <div class="flex w-full pt-2 content-center justify-between md:w-1/2 md:justify-end">
                <ul class="list-reset flex justify-between flex-1 md:flex-none items-center">

                  <>
                    <li class="mr-3">
                      <div class="inline-block py-2 px-4 text-white no-underline">{pathname}</div>
                    </li>

                    {(rt === 'crafters') &&
                      (
                      <>
                        <li class="mr-3">
                          <Link 
                            class="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 inline-block text-2xl text-white no-underline hover:text-gray-900 hover:text-underline py-2 px-4 duration-300" 
                            href="/">
                              <FaHome />
                          </Link>
                        </li>
                        <li class="mr-3">
                          <Link 
                            className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 inline-block text-white no-underline hover:text-gray-900 active:text-gray-900 hover:text-underline py-2 px-4 duration-300" 
                            href="/crafts/select_one">
                              Crafts
                          </Link>
                        </li>
                      </>
                    )}

                    {(rt === 'crafts') &&
                      (
                      <>
                        <li class="mr-3">
                          <Link 
                            class="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 inline-block text-2xl text-white no-underline hover:text-gray-900 hover:text-underline py-2 px-4 duration-300" 
                            href="/">
                              <FaHome />
                          </Link>
                        </li>
                      </>
                    )}

                    {(pathname === '/') && 
                      (
                      <li class="mr-3">
                        <Link 
                          className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 inline-block text-white no-underline hover:text-gray-900 active:text-gray-900 hover:text-underline py-2 px-4 duration-300" 
                          href="/crafts/select_one">
                            Crafts
                        </Link>
                      </li>
                    )}
   
                  
                  </>              

                </ul>
            </div>
        </div>
    </nav>
  </>

  )
}

export default Header
