export const ticketTypeDefs = `#graphql

  type TicketType {
    id: ID!
    eventId: ID!

    name: String!
    description: String

    price: Float!
    currency: String!

    totalQuantity: Int!
    availableQuantity: Int!
    soldQuantity: Int!
    reservedQuantity: Int!

    saleStartDate: String
    saleEndDate: String

    status: TicketStatus!

    createdAt: String!
    updatedAt: String!
  }

  enum TicketStatus {
    ACTIVE
    INACTIVE
  }

  input CreateTicketTypeInput {
    eventId: ID!
    name: String!
    description: String
    price: Float!
    currency: String
    totalQuantity: Int!
    saleStartDate: String
    saleEndDate: String
  }

  input UpdateTicketTypeInput {
    name: String
    description: String
    price: Float
    saleStartDate: String
    saleEndDate: String
    status: TicketStatus
  }
`;
