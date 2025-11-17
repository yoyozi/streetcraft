import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { getAllCategories } from "@/lib/actions/product.actions";
import { Menu } from "lucide-react";
import Link from "next/link";

const CategoryDrawer = async () => {
    const categories = await getAllCategories();

    return (
        <Drawer direction='left'>
            <DrawerTrigger asChild>
                <Button variant='outline'>
                    <Menu />
                </Button>
            </DrawerTrigger>
            <DrawerContent className='h-full max-w-sm'>
                <DrawerHeader>
                    <DrawerTitle>Select a category</DrawerTitle>
                    <div className="space-y-1">
                        {categories.map((x) => (
                        <DrawerClose key={x.category} asChild>
                            <Button variant='ghost' className='w-full justify-start' asChild>
                                <Link href={`/search?category=${x.category}`}>
                                    {x.category} ({x._count})
                                </Link>
                            </Button>
                        </DrawerClose>
                        ))}
                    </div>
                </DrawerHeader>
            </DrawerContent>
        </Drawer>
    );
};

export default CategoryDrawer;