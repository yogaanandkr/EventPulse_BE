export interface ICreateEventInput {
  title: string;
  description: string;
  category: string;

  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };

  startDate: string;
  endDate: string;
  images?: string[];
}

export interface IUpdateEventInput {
  title?: string;
  description?: string;
  category?: string;

  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };

  startDate?: string;
  endDate?: string;
  images?: string[];
}
