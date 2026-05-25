import { Order } from "@/types";
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PurchaseReceiptEmail({ order }: { order: Order }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Purchase Receipt</h1>

        <table style={{ width: '100%', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px' }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Order ID</p>
                <p style={{ margin: 0 }}>{order.id.toString()}</p>
              </td>
              <td style={{ padding: '4px 8px' }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Purchased On</p>
                <p style={{ margin: 0 }}>{formatDateTime(order.createdAt).dateTime}</p>
              </td>
              <td style={{ padding: '4px 8px' }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Price Paid</p>
                <p style={{ margin: 0 }}>{formatCurrency(order.totalPrice)}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          {order.orderItems.map((item) => (
            <table key={item.productId} style={{ width: '100%', marginBottom: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '80px', verticalAlign: 'top' }}>
                    <img
                      width="80"
                      alt={item.name}
                      style={{ borderRadius: '4px' }}
                      src={
                        item.image.startsWith('/')
                          ? `${process.env.NEXT_PUBLIC_SERVER_URL}${item.image}`
                          : item.image
                      }
                    />
                  </td>
                  <td style={{ verticalAlign: 'top', padding: '0 8px' }}>
                    {item.name} x {item.qty}
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    {formatCurrency(item.price)}
                  </td>
                </tr>
              </tbody>
            </table>
          ))}

          <table style={{ width: '100%', borderTop: '1px solid #d1d5db', paddingTop: '8px' }}>
            <tbody>
              {[
                { name: 'Items', price: order.itemsPrice },
                { name: 'Tax', price: order.taxPrice },
                { name: 'Shipping', price: order.shippingPrice },
                { name: 'Total', price: order.totalPrice },
              ].map(({ name, price }) => (
                <tr key={name}>
                  <td style={{ textAlign: 'right', padding: '2px 8px' }}>{name}:</td>
                  <td style={{ textAlign: 'right', width: '80px', padding: '2px 0' }}>
                    {formatCurrency(price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

