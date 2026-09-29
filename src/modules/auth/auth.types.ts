export interface IRegister {
  name: string;
  email: string;
  password: string;
  role?: "CUSTOMER" | "ORGANIZER";
}

export interface ILogin{
    email: string;
    password: string;
}