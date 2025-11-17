import { DollarSign, Headset, ShoppingBag, WalletCards } from "lucide-react";
import { Card, CardContent } from "./ui/card";


const IconBoxes = () => {
  return (
    <div>
      <Card>
        <CardContent className='grid md:grid-cols-4 gap-4 p-4'>
            <div className="space-y-2">
                <ShoppingBag />
                <div className="text-sm font-bolb">Free Shipping</div>
                <div className="text-sm text-muted-foreground">For small items purchased over R1000</div>
            </div>
            <div className="space-y-2">
                <DollarSign />
                <div className="text-sm font-bolb">Moneyback garauntee</div>
                <div className="text-sm text-muted-foreground">Within 30 days of purchase</div>
            </div>
            <div className="space-y-2">
                <WalletCards />
                <div className="text-sm font-bolb">Flexible payments</div>
                <div className="text-sm text-muted-foreground">Credit/Debit cars or EFT</div>
            </div>
            <div className="space-y-2">
                <Headset />
                <div className="text-sm font-bolb">24/7 Support</div>
                <div className="text-sm text-muted-foreground">Get support anytime</div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconBoxes;