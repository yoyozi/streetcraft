// cn used for setting dynamic classes
import { cn } from '@/lib/utils';

const ProductPrice = ({ value, className }: { value:number, className?:string}) => {
    // ensure 2 decimal places for price
    const stringValue = value.toFixed(2);
    // get the integer and the float using split
    const [ intValue, floatValue ] = stringValue.split('.'); 

    // the className only gets applied if we pass it in else just text-2xl is applied
    return ( <p className={ cn('text-2xl', className)}>
        <span className="text-xs align-super">R</span>
        { intValue }
        <span className="text-xs align-super">{floatValue}</span>
    </p> );
}
 
export default ProductPrice;