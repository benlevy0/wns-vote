"use client";

import { useEffect, useState } from "react";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import type { NextPage } from "next";
import { AwesomeButton } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";
import ReactModal from "react-modal";
import { getAddress, isAddress, parseAbiItem } from "viem";
import { namehash } from "viem/ens";
import { useAccount, useEnsName, usePublicClient } from "wagmi";
import { useContractRead, useContractWrite } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useAccountBalance } from "~~/hooks/scaffold-eth/";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface Proposal {
  id: number;
  description: string;
}

const Home: NextPage = () => {
  const [isRegistryModalOpen, setRegistryModalOpen] = useState(false);
  const [ensRegistry, setEnsRegistry] = useState<string[]>(["one.eth", "two.eth", "three.eth", "four.eth", "five.eth"]);
  const { address: connectedAddress } = useAccount();
  const [ensName, setEnsName] = useState("");
  const checkSumAddress = connectedAddress ? getAddress(connectedAddress) : undefined;
  const { data: fetchedEns } = useEnsName({
    address: checkSumAddress,
    enabled: isAddress(checkSumAddress ?? ""),
    chainId: 1,
  });
  const [isVotingModalOpen, setVotingModalOpen] = useState(false);
  const [liveVotes, setLiveVotes] = useState<Proposal[]>([{ id: 1, description: "Test first proposal" }]);
  const { balance, price, isError, isLoading } = useAccountBalance(connectedAddress);
  const [eyeballScanned, setEyeballScanned] = useState(false);

  useEffect(() => {
    if (fetchedEns) {
      setEnsName(fetchedEns);
    }
  }, [setEnsName, fetchedEns]);

  useEffect(() => {
    getEnsRegistry();
  }, []);

  async function getProposalEvents() {
    const { targetNetwork } = useTargetNetwork();
    const publicClient = usePublicClient({
      chainId: targetNetwork.id,
    });
    const logs = await publicClient.getLogs({
      address: "blah",
      event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
    });
    const parsedLogs: Proposal[] = JSON.parse(logs);
    setLiveVotes(parsedLogs);
  }

  async function getEnsRegistry() {
    const contractName = "";

    const validatedEnsNodesFunctionABI = wagmigotchiABI;
    useContractRead({
      address: "blah",
      abi: validatedEnsNodesFunctionABI,
      functionName: "validatedEnsNodes",
      onSuccess(data) {
        console.log("Successfully fetched ENS registry");
        console.log(data);
        setEnsRegistry(data);
      },
    });
  }

  const onSuccess = (result: ISuccessResult) => {
    const { merkle_root, nullifier_hash, proof, verification_level: _verification_level } = result;
    const ensHash = namehash(ensName);
    const sendProofFunctionABI = wagmigotchiABI;
    useContractWrite({
      address: "blah",
      abi: sendProofFunctionABI,
      functionName: "registerEns",
      onSuccess() {
        console.log("Successfully registered ENS");
        setEyeballScanned(true);
      },
      args: [ensHash, merkle_root, nullifier_hash, proof],
    });
  };

  const onVotePress = () => {
    console.log("Vote Pressed");
    setVotingModalOpen(true);
  };

  const closeVoting = () => {
    setVotingModalOpen(false);
  };

  const openRegistry = async () => {
    console.log("View Registry Pressed");
    // setEnsRegistry();
    setRegistryModalOpen(true);
  };

  const closeRegistry = () => {
    setRegistryModalOpen(false);
  };

  const castVote = async (voteItemId: number, tokenBalance: number | null) => {
    const sqrtTokens = Math.sqrt(tokenBalance ?? 0);
    const sendVoteFunctionABI = wagmigotchiABI;
    useContractWrite({
      address: "blah",
      abi: sendVoteFunctionABI,
      functionName: "vote",
      onSuccess() {
        console.log("Successfully cast vote");
      },
      args: [voteItemId, sqrtTokens],
    });
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <div className="flex justify-center items-center space-x-2">
          <p className="my-2 font-medium">Connected Address:</p>
          <Address address={connectedAddress} />
        </div>

        <div className="flex justify-center items-center space-x-2">
          {eyeballScanned || (
            <IDKitWidget
              app_id="app_6c5c6f2e795e36fe2ca4bc71bae94026"
              action="link-with-ens"
              // On-chain only accepts Orb verifications
              verification_level={VerificationLevel.Orb}
              onSuccess={onSuccess}
              signal={ensName}
            >
              {({ open }) => (
                <AwesomeButton type="primary" onPress={open}>
                  Verify your ENS with World ID
                </AwesomeButton>
              )}
            </IDKitWidget>
          )}
          <div className="flex justify-center items-center space-x-2">
            {!eyeballScanned || (
              <AwesomeButton type="primary" onPress={onVotePress}>
                Vote with your verified ENS
              </AwesomeButton>
            )}
          </div>
          <div className="flex justify-center items-center space-x-2">
            <AwesomeButton type="primary" onPress={openRegistry}>
              View verified ENS registry
            </AwesomeButton>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center space-x-2">
        <ReactModal
          isOpen={isRegistryModalOpen}
          onRequestClose={closeRegistry}
          contentLabel="ENS Registry Modal"
          style={{
            content: {
              position: "fixed",
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: "500px",
              backgroundColor: "white",
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              outline: "none",
            },
            overlay: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: "50",
            },
          }}
          ariaHideApp={false}
        >
          <div className="modal-content" style={{ position: "relative" }}>
            {" "}
            <h2>Registered ENS Names</h2>
            <ul>
              {ensRegistry.map((ensName, index) => (
                <li key={index}>{ensName}</li>
              ))}
            </ul>
            <button
              onClick={closeRegistry}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                border: "none",
                background: "#ff6b6b",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                textAlign: "center",
                lineHeight: "30px",
                fontSize: "16px",
                padding: "0",
              }}
            >
              &times;
            </button>
          </div>
        </ReactModal>
      </div>
      <div className="flex justify-center items-center space-x-2">
        <ReactModal
          isOpen={isVotingModalOpen}
          onRequestClose={closeVoting}
          contentLabel="Live Votes Modal"
          style={{
            content: {
              position: "fixed",
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 40px)",
              maxWidth: "600px",
              backgroundColor: "white",
              padding: "40px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              outline: "none",
              overflow: "auto",
            },
            overlay: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: 50,
            },
          }}
          ariaHideApp={false}
        >
          <div className="modal-content" style={{ position: "relative" }}>
            <button
              onClick={closeVoting}
              style={{
                position: "absolute",
                top: "0px",
                right: "5px",
                border: "none",
                background: "#ff6b6b",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                textAlign: "center",
                lineHeight: "30px",
                fontSize: "16px",
                padding: "0",
              }}
            >
              &times;
            </button>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Live Votes</h2>
            <ul style={{ marginTop: "60px" }}>
              {liveVotes.map(voteItem => (
                <li key={voteItem.id} style={{ listStyle: "none", marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0 20px",
                    }}
                  >
                    <span style={{ marginRight: "auto" }}>{voteItem.description}</span>
                    <button
                      onClick={() => castVote(voteItem.id, balance)}
                      style={{
                        marginRight: "10px",
                        padding: "10px 20px",
                        border: "1px solid #007bff",
                        background: "#007bff",
                        color: "white",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      Vote
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ReactModal>
      </div>
    </div>
  );
};

export default Home;
