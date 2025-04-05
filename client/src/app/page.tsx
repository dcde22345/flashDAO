"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Dao {
  id: number;
  title: string;
  image: string;
  goal: number;
  current: number;
  location: string;
  date: string;
}

interface EthereumProvider {
  request: (args: { method: string; params?: string[] }) => Promise<string[]>;
  send: (method: string, params?: string[]) => Promise<string[]>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [daos, setDaos] = useState<Dao[]>([]);

  useEffect(() => {
    // DAO info based on the April 3 Hualien Earthquake in Taiwan
    setDaos([
      {
        id: 1,
        title: "Taiwan Earthquake Relief",
        image: "/example.png",
        goal: 2000,
        current: 625,
        location: "Hualien County and Eastern Taiwan",
        date: "2024-04-03",
      },
    ]);
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold mr-6">FlashDAO</h1>
          <Link href="/event_trigger">
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Event Trigger
            </Button>
          </Link>
        </div>
        {walletAddress ? (
          <div className="text-sm">
            Wallet Connected: {walletAddress.slice(0, 6)}...
            {walletAddress.slice(-4)}
          </div>
        ) : (
          <Button onClick={connectWallet}>Connect Wallet</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto px-4">
        {daos.map((dao) => (
          <div
            style={{ width: "100%", maxWidth: "300px" }}
            className="mx-auto"
            key={dao.id}
          >
            <div className="bg-white overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={dao.image}
                  alt={dao.title}
                  width={300}
                  height={300}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{dao.title}</h3>
                  <p className="text-sm text-gray-600">{dao.summary}</p>
                </div>

                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Location:</span>{" "}
                    {dao.location}
                  </div>

                  <div className="space-y-1.5 w-full mt-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="font-medium text-gray-600">
                        <span>{dao.current}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span>{dao.goal} USDC</span>
                      </div>
                      <div className="text-blue-600 font-medium">
                        {Math.round((dao.current / dao.goal) * 100)}%
                      </div>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            (dao.current / dao.goal) * 100,
                            100
                          )}%`,
                          background:
                            "linear-gradient(90deg, #3b82f6, #2563eb)",
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="w-full bg-blue-600 text-white font-medium rounded-lg py-3 px-4 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Learn More
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{dao.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-gray-700">{dao.details}</p>
                          <div className="text-sm text-gray-500">
                            <p>Location: {dao.location}</p>
                            <p>Date: {dao.date}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
