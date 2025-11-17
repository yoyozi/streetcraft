import { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react"; 
import Profileform from "./profile-form";

// Our form is going to be a 'client' component embedded in the ProfilePage
// We then cannot call - session = await auth() - as this is server side
// We need to use the SessionProvider to wrap the ProfilePage
// This will provide the session to the client side and allow us to use it in 
// the clientside ProfilePage component.

export const metadata: Metadata = {
  title: 'Customer Profile',
};

export default async function ProfilePage() {

  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className='max-w-md  mx-auto space-y-4'>
        <h2 className='h2-bold'>Profile</h2>
        <Profileform />
      </div>
    </SessionProvider>
  );
};
