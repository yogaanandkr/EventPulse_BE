const paymentTypeDefs = `#graphql
  type PaymentOrderPayload {
    paymentId: ID!
    orderId: String!
    amount: Int!
    currency: String!
    keyId: String!
    bookingNumber: String!
  }

  extend type Mutation {
    createPaymentOrder(bookingId: ID!): PaymentOrderPayload!
  }

  input VerifyRazorpayPaymentInput {
  razorpay_order_id: String!
  razorpay_payment_id: String!
  razorpay_signature: String!
}

extend type Mutation {
  verifyRazorpayPayment(
    input: VerifyRazorpayPaymentInput!
  ): Booking!
}
`;

export default paymentTypeDefs;
