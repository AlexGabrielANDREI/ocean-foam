declare global {
  interface Window {
    ethereum?: any;
  }
}

// JSON module declarations
declare module "*.json" {
  const value: any;
  export default value;
}

export {};
