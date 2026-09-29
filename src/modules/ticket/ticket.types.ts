export interface ICreateTicketTypeInput {
    eventId: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    totalQuantity: number;
    saleStartDate?: string;
    saleEndDate?: string;
}

export interface IUpdateTicketTypeInput {
  name?: string;
  description?: string;
  price?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  status?: "ACTIVE" | "INACTIVE";
}