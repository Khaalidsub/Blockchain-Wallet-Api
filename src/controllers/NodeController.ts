import { BodyParams, Controller, Get, Inject, Post } from "@tsed/common";
import axios, { AxiosResponse } from "axios";
import { BlockChain } from "../models/BlockChain";
import { postBroadcast } from "../utils";

@Controller("/nodes")
export class NodeController {
  constructor(@Inject() public block: BlockChain) {}
  @Post("/register-and-broadcast-node")
  async registerNodeAndBroadCast(@BodyParams("newNodeUrl") newNodeUrl: string) {
    if (this.block.networkNodes.indexOf(newNodeUrl) == -1)
      this.block.networkNodes.push(newNodeUrl);

    const requestPromises: Promise<AxiosResponse<any>>[] = postBroadcast<
      string
    >("register-node", this.block, newNodeUrl);

    const result = await axios.all(requestPromises);
    return { note: "New node registered with network successfully." };
  }

  @Post("/register-node")
  registerNode(@BodyParams("newNodeUrl") newNodeUrl: String) {
    const nodeNotAlreadyPresent =
      this.block.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = this.block.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      this.block.networkNodes.push(newNodeUrl);

    return { note: "New node registered successfully." };
  }
  @Post("/register-nodes-bulk")
  registerNodeBulk(@BodyParams() allNetworkNodes: String[]) {
    allNetworkNodes.forEach((networkNodeUrl) => {
      const nodeNotAlreadyPresent =
        this.block.networkNodes.indexOf(networkNodeUrl) == -1;
      const notCurrentNode = this.block.currentNodeUrl !== networkNodeUrl;
      if (nodeNotAlreadyPresent && notCurrentNode)
        this.block.networkNodes.push(networkNodeUrl);
    });

    return { note: "Bulk registration successful." };
  }
  @Get("/")
  getAllNodes() {
    return this.block.networkNodes;
  }
}
