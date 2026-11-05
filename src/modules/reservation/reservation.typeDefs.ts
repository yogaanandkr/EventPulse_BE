const reservationTypeDefs = `#graphql
  enum ReservationStatus {
    ACTIVE
    COMPLETED
    EXPIRED
    CANCELLED
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    EXPIRED
  }

  enum PaymentStatus {
    UNPAID
    PAID
    FAILED
    REFUNDED
  }

  type ReservationItem {
    ticketTypeId: ID!
    ticketName: String!
    quantity: Int!
    unitPrice: Float!
  }

  type Reservation {
    id: ID!
    userId: ID!
    eventId: ID!
    items: [ReservationItem!]!
    status: ReservationStatus!
    expiresAt: String!
    createdAt: String!
    updatedAt: String!
  }

  type BookingItem {
    ticketTypeId: ID!
    ticketName: String!
    quantity: Int!
    unitPrice: Float!
    totalPrice: Float!
  }

  type Booking {
    id: ID!
    bookingNumber: String!
    userId: ID!
    eventId: ID!
    reservationId: ID!
    items: [BookingItem!]!
    subtotal: Float!
    discount: Float!
    totalAmount: Float!
    currency: String!
    status: BookingStatus!
    paymentStatus: PaymentStatus!
    bookedAt: String
    confirmedAt: String
    cancelledAt: String
    createdAt: String!
    updatedAt: String!
    reservation: Reservation
  }

  input CreateReservationItemInput {
    ticketTypeId: ID!
    quantity: Int!
  }

  input CreateReservationInput {
    eventId: ID!
    items: [CreateReservationItemInput!]!
  }

  type ReservationPayload {
    reservation: Reservation!
    booking: Booking!
  }

  type ReleaseReservationPayload {
    success: Boolean!
    status: ReservationStatus!
  }

  extend type Query {
    myBookings: [Booking!]!
  }

  extend type Mutation {
    createReservation(input: CreateReservationInput!): ReservationPayload!

    releaseReservation(id: ID!): ReleaseReservationPayload!
  }
`;

export default reservationTypeDefs;
