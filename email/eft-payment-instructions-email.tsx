import { Order } from "@/types";
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { EFT_BANK_NAME, EFT_ACCOUNT_NUMBER, EFT_BRANCH_CODE, EFT_ACCOUNT_HOLDER } from '@/lib/constants';
require('dotenv').config();

type EftPaymentInstructionsProps = {
  order: Order;
};

export default function EftPaymentInstructionsEmail({ order }: EftPaymentInstructionsProps) {
  return (
    <Html>
      <Preview>EFT Payment Instructions for Order {order.id}</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>EFT Payment Instructions</Heading>
            
            <Text className='text-base'>
              Dear {order.user.name},
            </Text>
            
            <Text className='text-base'>
              Thank you for your order! Please complete your payment using the banking details below.
            </Text>

            {/* Order Summary */}
            <Section className='border border-solid border-gray-300 rounded-lg p-4 my-4 bg-gray-50'>
              <Heading as='h2' className='text-lg mt-0'>Order Summary</Heading>
              <Row>
                <Column>
                  <Text className='mb-0 text-gray-500'>Order ID</Text>
                  <Text className='mt-0 font-semibold'>{order.id}</Text>
                </Column>
                <Column>
                  <Text className='mb-0 text-gray-500'>Order Date</Text>
                  <Text className='mt-0 font-semibold'>
                    {formatDateTime(order.createdAt).dateTime}
                  </Text>
                </Column>
              </Row>
              <Row className='mt-4'>
                <Column>
                  <Text className='mb-0 text-gray-500'>Amount to Pay</Text>
                  <Text className='mt-0 text-2xl font-bold text-green-700'>
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Banking Details */}
            <Section className='border border-solid border-blue-500 rounded-lg p-4 my-4 bg-blue-50'>
              <Heading as='h2' className='text-lg mt-0 text-blue-900'>Banking Details</Heading>
              
              <Row className='mb-2'>
                <Column width='40%'>
                  <Text className='mb-0 text-gray-700 font-semibold'>Bank Name:</Text>
                </Column>
                <Column>
                  <Text className='mb-0 font-bold'>{EFT_BANK_NAME}</Text>
                </Column>
              </Row>

              <Row className='mb-2'>
                <Column width='40%'>
                  <Text className='mb-0 text-gray-700 font-semibold'>Account Holder:</Text>
                </Column>
                <Column>
                  <Text className='mb-0 font-bold'>{EFT_ACCOUNT_HOLDER}</Text>
                </Column>
              </Row>

              <Row className='mb-2'>
                <Column width='40%'>
                  <Text className='mb-0 text-gray-700 font-semibold'>Account Number:</Text>
                </Column>
                <Column>
                  <Text className='mb-0 font-bold text-lg'>{EFT_ACCOUNT_NUMBER}</Text>
                </Column>
              </Row>

              <Row className='mb-2'>
                <Column width='40%'>
                  <Text className='mb-0 text-gray-700 font-semibold'>Branch Code:</Text>
                </Column>
                <Column>
                  <Text className='mb-0 font-bold'>{EFT_BRANCH_CODE}</Text>
                </Column>
              </Row>

              <Row>
                <Column width='40%'>
                  <Text className='mb-0 text-gray-700 font-semibold'>Reference:</Text>
                </Column>
                <Column>
                  <Text className='mb-0 font-bold text-red-600'>
                    {order.id.substring(0, 8).toUpperCase()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Important Instructions */}
            <Section className='border border-solid border-orange-400 rounded-lg p-4 my-4 bg-orange-50'>
              <Heading as='h3' className='text-base mt-0 text-orange-900'>Important Instructions</Heading>
              <Text className='text-sm my-2'>
                ⚠️ <strong>Please use your Order ID as the payment reference:</strong> {order.id.substring(0, 8).toUpperCase()}
              </Text>
              <Text className='text-sm my-2'>
                • Payment must be made within 48 hours to secure your order
              </Text>
              <Text className='text-sm my-2'>
                • Once payment is received, we will process your order immediately
              </Text>
              <Text className='text-sm my-2'>
                • You will receive a confirmation email once payment is verified
              </Text>
            </Section>

            {/* Order Items */}
            <Section className='border border-solid border-gray-300 rounded-lg p-4 my-4'>
              <Heading as='h2' className='text-lg mt-0'>Order Items</Heading>
              {order.orderItems.map((item) => (
                <Row key={item.productId} className='mt-4 pb-4 border-b border-gray-200'>
                  <Column className='w-20'>
                    <Img
                      width='60'
                      alt={item.name}
                      className='rounded'
                      src={
                        item.image.startsWith('/')
                          ? `${process.env.NEXT_PUBLIC_SERVER_URL}${item.image}`
                          : item.image
                      }
                    />
                  </Column>
                  <Column className='align-top'>
                    <Text className='mx-2 my-0 font-semibold'>{item.name}</Text>
                    <Text className='mx-2 my-0 text-sm text-gray-600'>Qty: {item.qty}</Text>
                  </Column>
                  <Column align='right' className='align-top'>
                    <Text className='m-0 font-semibold'>{formatCurrency(item.price)}</Text>
                  </Column>
                </Row>
              ))}

              {/* Price Breakdown */}
              <Row className='mt-4 pt-2'>
                <Column align='right' className='text-gray-600'>
                  <Text className='my-1'>Items:</Text>
                </Column>
                <Column align='right' width={100}>
                  <Text className='my-1'>{formatCurrency(order.itemsPrice)}</Text>
                </Column>
              </Row>
              <Row>
                <Column align='right' className='text-gray-600'>
                  <Text className='my-1'>Tax:</Text>
                </Column>
                <Column align='right' width={100}>
                  <Text className='my-1'>{formatCurrency(order.taxPrice)}</Text>
                </Column>
              </Row>
              <Row>
                <Column align='right' className='text-gray-600'>
                  <Text className='my-1'>Shipping:</Text>
                </Column>
                <Column align='right' width={100}>
                  <Text className='my-1'>{formatCurrency(order.shippingPrice)}</Text>
                </Column>
              </Row>
              <Row className='border-t border-gray-400 pt-2'>
                <Column align='right'>
                  <Text className='my-1 font-bold text-lg'>Total:</Text>
                </Column>
                <Column align='right' width={100}>
                  <Text className='my-1 font-bold text-lg'>{formatCurrency(order.totalPrice)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Shipping Address */}
            <Section className='my-4'>
              <Heading as='h3' className='text-base'>Shipping Address</Heading>
              <Text className='text-sm my-1'>{order.shippingAddress.fullName}</Text>
              <Text className='text-sm my-1'>{order.shippingAddress.streetAddress}</Text>
              <Text className='text-sm my-1'>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </Text>
              <Text className='text-sm my-1'>{order.shippingAddress.country}</Text>
            </Section>

            <Text className='text-sm text-gray-600 mt-6'>
              If you have any questions about your order or payment, please contact our support team.
            </Text>

            <Text className='text-sm text-gray-600'>
              Thank you for shopping with us!
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
