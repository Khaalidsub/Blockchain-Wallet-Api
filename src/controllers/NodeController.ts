import { BodyParams, Controller, Get, Inject, Post } from "@tsed/common";
import axios, { AxiosResponse } from "axios";
import { BlockChain } from "../models/BlockChain";
import { KeyMaker } from "../models/KeyMaker";
import { getBroadcast, isNodeExist, postBroadcast } from "../utils";

@Controller("/nodes")
export class NodeController {
  constructor(
    @Inject() public block: BlockChain,
    @Inject() public keyMaker: KeyMaker
  ) {
    //50 seconds now => 13hrs
    setInterval(this.requestNodesStatus, 5000 * 10);
  }

  @Post("/register-and-broadcast-node")
  async registerNodeAndBroadCast(@BodyParams("newNodeUrl") newNodeUrl: string) {
    if (this.block.networkNodes.indexOf(newNodeUrl) == -1)
      this.block.networkNodes.push(newNodeUrl);

    const requestBroadcast: Promise<AxiosResponse<any>>[] = postBroadcast<
      string
    >("register-node", this.block, newNodeUrl);

    await axios.all(requestBroadcast);
    const requestRegisterBulk: Promise<AxiosResponse<any>>[] = postBroadcast<
      string
    >("register-nodes-bulk", this.block, newNodeUrl);
    await axios.all(requestRegisterBulk);
    return { note: "New node registered with network successfully." };
  }

  @Post("/register-node")
  registerNode(@BodyParams("newNodeUrl") newNodeUrl: String) {
    if (
      isNodeExist(
        this.block.networkNodes,
        this.block.currentNodeUrl,
        newNodeUrl
      )
    )
      this.block.networkNodes.push(newNodeUrl);

    return { note: "New node registered successfully." };
  }
  @Post("/register-nodes-bulk")
  registerNodeBulk(@BodyParams() allNetworkNodes: String[]) {
    allNetworkNodes.forEach((networkNodeUrl) => {
      if (
        isNodeExist(
          this.block.networkNodes,
          this.block.currentNodeUrl,
          networkNodeUrl
        )
      )
        this.block.networkNodes.push(networkNodeUrl);
    });

    return { note: "Bulk registration successful." };
  }

  @Get("/status")
  getNodesStatus() {
    return true;
  }

  requestNodesStatus() {
    this.block.networkNodes.forEach((networkNode) => {
      axios
        .get(`${networkNode}/status`)
        .then((result) => {
          console.log("Checking if there is any node status");

          const isNodeValid = this.block.updateNodeStatus(result.data === true);
          if (!isNodeValid) {
            this.block.networkNodes = this.block.networkNodes.filter(
              (node) => node !== networkNode
            );
          }
        })
        .catch(() => {
          const isNodeValid = this.block.updateNodeStatus(false);
          if (!isNodeValid) {
            this.block.networkNodes = this.block.networkNodes.filter(
              (node) => node !== networkNode
            );
          }
        });
    });
  }

  @Get("/")
  getAllNodes() {
    return this.block.networkNodes;
  }
}
