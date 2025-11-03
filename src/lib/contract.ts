import { ethers } from "ethers";
import contractAbi from "./contract-abi.json";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "YOUR_MAINNET_CONTRACT_ADDRESS_HERE"; // TODO: Replace with your mainnet contract address
const ALCHEMY_URL =
  process.env.NEXT_PUBLIC_ALCHEMY_URL ||
  "https://eth-mainnet.g.alchemy.com/v2/YOUR_MAINNET_ALCHEMY_API_KEY_HERE"; // Ethereum Mainnet

export async function getPaymentPrice(): Promise<string> {
  const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);
  const price = await contract.paymentPrice();
  return ethers.formatEther(price);
}

export async function makePayment(
  signer: ethers.Signer,
  price: string
): Promise<ethers.TransactionResponse> {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  const tx = await contract.makePayment({ value: ethers.parseEther(price) });
  return tx;
}
