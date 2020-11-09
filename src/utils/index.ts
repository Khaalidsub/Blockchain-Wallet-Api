import axios, { AxiosResponse } from "axios";
import { BlockChain } from "../models/BlockChain";

export enum Routes {
  blockchain = "blockchain",
  recieveNewBlock = "recieve-new-block",
}

export const postBroadcast = <T>(url: string, block: BlockChain, data: T) => {
  const requestPromises: Promise<AxiosResponse<any>>[] = [];
  block.networkNodes.forEach((networkNodeUrl) => {
    requestPromises.push(axios.post(`${networkNodeUrl}/${url}`, data));
  });
  return requestPromises;
};
export const getBroadcast = <T>(url: string, block: BlockChain, data: T) => {
  const requestPromises: Promise<AxiosResponse<any>>[] = [];
  block.networkNodes.forEach((networkNodeUrl) => {
    requestPromises.push(axios.post(`${networkNodeUrl}/transaction`, data));
  });
  return requestPromises;
};
export const isNodeExist = (
  networkNodes: String[],
  currentNode: String,
  newNode: String
) => {
  const nodeNotAlreadyPresent = networkNodes.indexOf(newNode) == -1;
  const notCurrentNode = currentNode !== newNode;
  return nodeNotAlreadyPresent && notCurrentNode;
};
