
export default function AuthLayout({
    children,
    }: Readonly<{
        children: React.ReactNode;
    }>) {
    return (
        <div className='flex justify-center items-start pt-6 sm:items-center sm:pt-0 min-h-screen w-full'>
            {children}
        </div>
    );
}