'use client'
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
    return <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground mb-4">
            <span className="text-2xl font-bold">SC</span>
        </div>
        <div className="p-6 w-1/3 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold mb-4">Not Found</h1>
            <p className="text-destructive">Could not find requested page</p>
            <Button 
                variant="outline" 
                className="mt-4 ml-2" 
                onClick={ () => (window.location.href = '/')}>
                Back to home
            </Button>
        </div>
    </div>;
}

export default NotFoundPage;