import { Order } from "@/types";
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { EFT_BANK_NAME, EFT_ACCOUNT_NUMBER, EFT_BRANCH_CODE, EFT_ACCOUNT_HOLDER } from '@/lib/constants';

type EftPaymentInstructionsProps = {
  order: Order;
};

export default function EftPaymentInstructionsEmail({ order }: EftPaymentInstructionsProps) {
  const ref = order.id.substring(0, 8).toUpperCase();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>EFT Payment Instructions</h1>

        <p>Dear {order.user.name},</p>
        <p>Thank you for your order! Please complete your payment using the banking details below.</p>

        {/* Order Summary */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#f9fafb' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0 }}>Order Summary</h2>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Order ID</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{order.id}</p>
                </td>
                <td>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Order Date</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{formatDateTime(order.createdAt).dateTime}</p>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ paddingTop: '12px' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Amount to Pay</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#15803d' }}>
                    {formatCurrency(order.totalPrice)}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Banking Details */}
        <div style={{ border: '1px solid #3b82f6', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#eff6ff' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, color: '#1e3a5f' }}>Banking Details</h2>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                { label: 'Bank Name', value: EFT_BANK_NAME },
                { label: 'Account Holder', value: EFT_ACCOUNT_HOLDER },
                { label: 'Account Number', value: EFT_ACCOUNT_NUMBER },
                { label: 'Branch Code', value: EFT_BRANCH_CODE },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td style={{ width: '40%', padding: '4px 0', fontWeight: 600, color: '#374151' }}>{label}:</td>
                  <td style={{ padding: '4px 0', fontWeight: 700 }}>{value}</td>
                </tr>
              ))}
              <tr>
                <td style={{ width: '40%', padding: '4px 0', fontWeight: 600, color: '#374151' }}>Reference:</td>
                <td style={{ padding: '4px 0', fontWeight: 700, color: '#dc2626' }}>{ref}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Important Instructions */}
        <div style={{ border: '1px solid #fb923c', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#fff7ed' }}>
          <h3 style={{ fontSize: '16px', marginTop: 0, color: '#7c2d12' }}>Important Instructions</h3>
          <p style={{ fontSize: '14px', margin: '8px 0' }}>
            <strong>Please use your Order ID as the payment reference:</strong> {ref}
          </p>
          <p style={{ fontSize: '14px', margin: '8px 0' }}>Payment must be made within 48 hours to secure your order</p>
          <p style={{ fontSize: '14px', margin: '8px 0' }}>Once payment is received, we will process your order immediately</p>
          <p style={{ fontSize: '14px', margin: '8px 0' }}>You will receive a confirmation email once payment is verified</p>
        </div>

        {/* Order Items */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0 }}>Order Items</h2>
          {order.orderItems.map((item) => (
            <table key={item.productId} style={{ width: '100%', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>
                    <img
                      width="60"
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
                    <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Qty: {item.qty}</p>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(item.price)}
                  </td>
                </tr>
              </tbody>
            </table>
          ))}

          <table style={{ width: '100%', borderTop: '1px solid #9ca3af', paddingTop: '8px' }}>
            <tbody>
              {[
                { name: 'Items', price: order.itemsPrice },
                { name: 'Tax', price: order.taxPrice },
                { name: 'Shipping', price: order.shippingPrice },
              ].map(({ name, price }) => (
                <tr key={name}>
                  <td style={{ textAlign: 'right', padding: '2px 8px', color: '#6b7280' }}>{name}:</td>
                  <td style={{ textAlign: 'right', width: '100px', padding: '2px 0' }}>{formatCurrency(price)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #9ca3af' }}>
                <td style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 700, fontSize: '18px' }}>Total:</td>
                <td style={{ textAlign: 'right', width: '100px', padding: '4px 0', fontWeight: 700, fontSize: '18px' }}>
                  {formatCurrency(order.totalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Shipping Address */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px' }}>Shipping Address</h3>
          <p style={{ fontSize: '14px', margin: '4px 0' }}>{order.shippingAddress.fullName}</p>
          <p style={{ fontSize: '14px', margin: '4px 0' }}>{order.shippingAddress.streetAddress}</p>
          <p style={{ fontSize: '14px', margin: '4px 0' }}>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
          <p style={{ fontSize: '14px', margin: '4px 0' }}>{order.shippingAddress.country}</p>
        </div>

        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          If you have any questions about your order or payment, please contact our support team.
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Thank you for shopping with us!
        </p>
      </div>
    </div>
  );
}
