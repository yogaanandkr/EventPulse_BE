export const eventTypeDefs = `#graphql
type Venue {
    name: String!
    address: String!
    city: String!
    state: String!
    country: String!
}
type Event {
    id: ID!
    organizerId: ID!
    title: String!
    slug: String!
    description: String!
    category: String!
    venue: Venue!
    startDate: String!
    endDate: String!
    images: [String!]!
    status: EventStatus!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
}

enum EventStatus {
    DRAFT
    PUBLISHED
    CANCELLED
}

input VenueInput{
    name: String!
    address: String!
    city: String!
    state: String!
    country: String!
}

input CreateEventInput {
    title: String!
    description: String!
    category: String!
    venue: VenueInput!
    startDate: String!
    endDate: String!
    images: [String!]
}
`;
