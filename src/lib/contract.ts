import { ethers } from "ethers";
import contractAbi from "./contract-abi.json";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x2926afd03D40160be5739fA5b063c52e54CAFEBE";
const ALCHEMY_URL =
  process.env.ALCHEMY_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/Rw4dHAu8A_9De5-3lRDgr";

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
