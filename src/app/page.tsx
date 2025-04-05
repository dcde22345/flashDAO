"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  summary: string;
  details: string;
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
    // 根據台灣 0403 花蓮大地震重構的 DAO 資訊
    setDaos([
      {
        id: 1,
        title: "台灣 0403 花蓮大地震賑災 DAO",
        summary:
          "援助地震災區居民重建生活，提供臨時居所、食物、醫療資源與災後心理重建。",
        details:
          "2024 年 4 月 3 日清晨，台灣花蓮發生芮氏規模 7.2 的強震，為 25 年來最強地震，造成超過 16 人死亡、上百人受傷，並有大量建物毀損、居民流離失所。本 DAO 目標為鏈上募資支援災區，包括：1) 緊急物資供應、2) 臨時安置與帳篷、3) 在地合作 NGO 的物資物流支援、4) 災後兒童與老人的心理創傷輔導。",
        image: "/example.png",
        goal: 2000,
        current: 625,
        location: "台灣・花蓮縣與東部地區",
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
        <h1 className="text-3xl font-bold">FlashDAO</h1>
        {walletAddress ? (
          <div className="text-sm">
            已連接錢包: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        ) : (
          <Button onClick={connectWallet}>連接錢包</Button>
        )}
      </div>

      <div className="mx-auto flex flex-wrap justify-center gap-6 max-w-[96rem]">
        {daos.map((dao) => (
          <Card
            key={dao.id}
            className="!bg-white !text-card-foreground !overflow-hidden !rounded-lg !w-[18rem] rounded-[20px]"
          >
            <div className="relative aspect-[16/9] bg-gray-100">
              <Image
                src={dao.image}
                alt={dao.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="p-[10px]">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-semibold">
                  {dao.title}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {dao.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-sm text-gray-500 mb-1">
                  地點：{dao.location}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  目標：{dao.goal} USDC ・ 已募集：{dao.current} USDC
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(dao.current / dao.goal) * 100}%` }}
                  ></div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        width: "100%",
                        transition: "all 0.2s ease-in-out",
                        fontWeight: "500",
                        padding: "0.75rem 1rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transform: "translateY(0)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#2563eb";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#3b82f6";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(0,0,0,0.1)";
                      }}
                    >
                      了解更多
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{dao.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-700">{dao.details}</p>
                      <div className="text-sm text-gray-500">
                        <p>地點: {dao.location}</p>
                        <p>日期: {dao.date}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
