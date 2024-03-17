// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import type { NextPage } from "next";
import { AwesomeButton } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";
import ReactModal from "react-modal";
import { decodeAbiParameters, getAddress, isAddress } from "viem";
import { namehash } from "viem/ens";
import { useAccount, useEnsName, usePublicClient } from "wagmi";
import { useContractRead, useContractWrite } from "wagmi";
import { sepolia } from "wagmi/chains";
import registryAbi from "~~/components/abis/ENSWorldIdRegistry.json";
import tokenAbi from "~~/components/abis/GovernanceToken.json";
import governorAbi from "~~/components/abis/Governor.json";
import { Address } from "~~/components/scaffold-eth";
import { useAccountBalance } from "~~/hooks/scaffold-eth/";

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

interface Proposal {
  id: number;
  description: string;
  voted: null | boolean;
}

function sqrtBigInt(value) {
  if (value < 0n) {
    throw "Square root of negative numbers is not supported";
  }

  if (value < 2n) {
    return value;
  }

  function newtonIteration(n, x0) {
    const x1 = (n / x0 + x0) >> 1n;
    if (x0 === x1 || x0 === x1 - 1n) {
      return x0;
    }
    return newtonIteration(n, x1);
  }

  return newtonIteration(value, value / 2n);
}

const weiToEtherBigInt = weiBigInt => {
  const WEI_PER_ETHER = BigInt(10 ** 18);
  return weiBigInt / WEI_PER_ETHER;
};

const Home: NextPage = () => {
  //const [isDarkMode, _setIsDarkMode] = useState(false);
  const isDarkMode = false;
  const showRegistry = true;
  const [isRegistryModalOpen, setRegistryModalOpen] = useState(false);
  const [ensRegistry, setEnsRegistry] = useState<string[]>([]);
  const { address: connectedAddress } = useAccount();
  const [ensName, setEnsName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const checkSumAddress = connectedAddress ? getAddress(connectedAddress) : undefined;
  const { data: fetchedEns } = useEnsName({
    address: checkSumAddress,
    enabled: isAddress(checkSumAddress ?? ""),
    chainId: sepolia.id,
  });
  const [isVotingModalOpen, setVotingModalOpen] = useState(false);
  const [liveVotes, setLiveVotes] = useState<Proposal[]>([]);
  const { balance } = useAccountBalance(connectedAddress);
  const client = usePublicClient();
  const GOVERNOR_ADDRESS = "0x40E7aFaaCCC1C24CB197C93dbE24094d6822E41e";
  const REGISTRY_ADDRESS = "0x2e7e59FCF7287b669A06B8F9eE7eec30BeD8feA3";
  const TOKEN_ADDRESS = "0xbb8f6b8df8cca184d54e58019cd8b71bdc26360e";

  useContractRead({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi,
    functionName: "validatedEnsNodes",
    args: [namehash(ensName)],
    onSuccess(data) {
      setIsVerified(Boolean(data));
    },
  });

  useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi.abi,
    functionName: "getCurrentVotes",
    args: [connectedAddress],
    onSuccess(data) {
      const sqrtVotingPowerWei = sqrtBigInt(BigInt(data.toString()) * BigInt(10 ** 18));
      setVotingPower(sqrtVotingPowerWei);
    },
  });

  const { writeAsync: registerEns } = useContractWrite({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi,
    functionName: "registerEns",
    value: 0n,
    onSuccess(data) {
      console.log(data);
      setIsVerified(true);
    },
  });

  const { writeAsync: castVoteContract } = useContractWrite({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi.abi,
    functionName: "castVote",
    onSuccess() {
      console.log("Successfully cast vote");
      setVotingModalOpen(false);
    },
  });

  useEffect(() => {
    if (fetchedEns) {
      console.log(fetchedEns);
      setEnsName(fetchedEns);
    }
  }, [setEnsName, fetchedEns]);

  useEffect(() => {
    getProposalEvents();
    getRegisteredNames();
  }, []);

  async function getProposalEvents() {
    const events = await client.getContractEvents({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi.abi,
      eventName: "ProposalCreated",
      fromBlock: 5500322n,
      toBlock: "latest",
    });

    const existingProposalIds = new Set(liveVotes.map(proposal => proposal.id));

    const newProposals = events
      .filter(event => !existingProposalIds.has(event.args.id))
      .map(event => ({ id: event.args.id, description: event.args.description, voted: null }));

    if (newProposals.length > 0) {
      setLiveVotes(prevLiveVotes => [
        ...prevLiveVotes,
        ...newProposals.filter(proposal => !prevLiveVotes.some(p => p.id === proposal.id)),
      ]);
    }

    console.log(events);
    return events;
  }

  async function getRegisteredNames() {
    const events = await client.getContractEvents({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi,
      eventName: "EnsNodeRegistered",
      fromBlock: 5500322n,
      toBlock: "latest",
    });

    const newNames = events.map(event => event.args.ensName);
    const uniqueNames = Array.from(new Set(newNames));

    setEnsRegistry(prevEnsRegistry => {
      const registrySet = new Set(prevEnsRegistry);
      uniqueNames.forEach(name => {
        registrySet.add(name);
      });
      return Array.from(registrySet);
    });

    console.log(events);
    return events;
  }

  const onSuccess = (result: ISuccessResult) => {
    console.log(result);
    const { merkle_root, nullifier_hash, proof } = result;
    const decodedVal = decodeAbiParameters([{ name: "proof", type: "uint256[8]" }], proof as any);
    registerEns({ args: [ensName, merkle_root, nullifier_hash, decodedVal[0]] });
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
    setRegistryModalOpen(true);
  };

  const closeRegistry = () => {
    setRegistryModalOpen(false);
  };

  const castVote = async (voteItemId: number, tokenBalance: number | null, voteFor: boolean) => {
    await castVoteContract({ args: [voteItemId, voteFor ? 1 : 0, votingPower] });

    setLiveVotes(prevLiveVotes =>
      prevLiveVotes.map(vote => (vote.id === voteItemId ? { ...vote, voted: voteFor } : vote)),
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        flexGrow: "1",
        paddingTop: "10px",
        backgroundColor: isDarkMode ? "#282c34" : "#FFF",
        color: isDarkMode ? "#FFF" : "#000",
      }}
    >
      <div className="px-5">
        <div className="flex justify-center items-center space-x-2">
          <p className="my-2 font-medium">{ensName ? "ENS Name:" : "Connected Address:"}</p>
          {ensName ? <p className="text-blue-500">{ensName}</p> : <Address address={connectedAddress} />}
        </div>
        <div className="flex justify-center items-center space-x-2">
          <p className="my-2 font-medium">Voting Power (Quadratic):</p>
          <p className="text-blue-500">{String(weiToEtherBigInt(votingPower))}</p>
        </div>

        <div className="flex justify-center items-center space-x-2">
          {isVerified || (
            <IDKitWidget
              app_id="app_staging_1b0aee8169e8e96effda6718b3d14c65"
              action="register-ens"
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
            {!isVerified || (
              <AwesomeButton type="primary" onPress={onVotePress}>
                Vote with your verified ENS
              </AwesomeButton>
            )}
          </div>
          {!showRegistry || (
            <div className="flex justify-center items-center space-x-2">
              <AwesomeButton type="primary" onPress={openRegistry}>
                View verified ENS registry
              </AwesomeButton>
            </div>
          )}
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
              backgroundColor: isDarkMode ? "#2c2f33" : "white", // Dark mode support
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              outline: "none",
              color: isDarkMode ? "white" : "black", // Text color for dark mode
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
          <div className="modal-content" style={{ position: "relative", color: isDarkMode ? "white" : "black" }}>
            <h2
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "24px",
                fontWeight: "bold",
                color: isDarkMode ? "white" : "black",
              }}
            >
              Registered ENS Names
            </h2>
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
              backgroundColor: isDarkMode ? "#2c2f33" : "white", // Dark mode support
              padding: "40px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              outline: "none",
              color: isDarkMode ? "white" : "black", // Text color for dark mode
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
                    {voteItem.voted !== null ? (
                      <span style={{ color: voteItem.voted ? "green" : "red" }}>
                        You have already voted {voteItem.voted ? "For" : "Against"}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => castVote(voteItem.id, balance, true)} // Passing true for voting for the proposal
                          style={{
                            marginRight: "10px",
                            padding: "10px 20px",
                            border: "1px solid #28a745",
                            background: "#28a745",
                            color: "white",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          For
                        </button>
                        <button
                          onClick={() => castVote(voteItem.id, balance, false)} // Passing false for voting against the proposal
                          style={{
                            padding: "10px 20px",
                            border: "1px solid #dc3545",
                            background: "#dc3545",
                            color: "white",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          Against
                        </button>
                      </>
                    )}
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
