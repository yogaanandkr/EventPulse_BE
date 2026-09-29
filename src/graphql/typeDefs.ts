export const typeDefs = `#graphql

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    avatar: String
    phone: String
    isActive: Boolean!
    isEmailVerified: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  enum UserRole {
    CUSTOMER
    ORGANIZER
    ADMIN
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: UserRole
  }

  type Query {
    health: String!
    me: User!

    event(id: ID!): Event
    events: [Event!]!
    myEvents: [Event!]!
    ticketTypes(eventId: ID!): [TicketType!]!

  }

  type Mutation {
    register(input: RegisterInput!): User!
    login(input: LoginInput!): AuthPayload!
    refreshToken: AuthPayload!
    logout: Boolean!

    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID! input: UpdateEventInput!): Event!
    publishEvent(id: ID!): Event!
    cancelEvent(id: ID!): Event!


    createTicketType(
      input: CreateTicketTypeInput!
    ): TicketType!

    updateTicketType(
      id: ID!
      input: UpdateTicketTypeInput!
    ): TicketType!
  }

  input LoginInput{
    email: String!
    password: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  input UpdateEventInput {
    title: String
    description: String
    category: String
    venue: VenueInput
    startDate: String
    endDate: String
    images: [String!]
  }
    
`;
