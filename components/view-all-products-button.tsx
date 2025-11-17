import { Button } from "./ui/button";
import Link from "next/link";

const ViewAllProductsButton = () => {
  return (
    <div className="flex justify-center items-center my-8">
      <Link href='/search'>
        <Button className="px-8 py-4 text-lg font-semibold">View All Products</Button>
      </Link>
    </div>
  );
};

export default ViewAllProductsButton;