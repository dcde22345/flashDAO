"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/volunteer-dialog";

export default function VolunteerPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">志願者選舉</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 成為志願者候選人 */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>成為志願者候選人</CardTitle>
            <CardDescription>
              擔任募款兌現者，協助將資金用於實際救助
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                志願者將擔任此 DAO
                的募款兌現者，當成為最高票的志願者會立即被視為所有資金的 swap
                地址。
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>需要通過 Self 數位認證</li>
                <li>投票期間需公開真實姓名</li>
                <li>若未履行職責將被列入黑名單</li>
                <li>無初始投入金額限制</li>
              </ul>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    申請成為候選人
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>志願者申請流程</DialogTitle>
                    <DialogDescription>
                      請按照以下步驟完成申請：
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>下載 Self App</li>
                      <li>掃描護照進行身份驗證</li>
                      <li>上傳相關證明文件</li>
                      <li>等待驗證結果</li>
                    </ol>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setIsVerified(true)}
                    >
                      開始驗證流程
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* 投票選舉志願者 */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>投票選舉志願者</CardTitle>
            <CardDescription>為您信任的志願者投下寶貴的一票</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                投入資金者具備等值的投票權，可以票選最值得信任的志願者。
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>投入資金即獲得投票權</li>
                <li>投票權與投入金額等值</li>
                <li>志願者不得參與投票</li>
                <li>時限內選出最高票志願者</li>
              </ul>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={hasVoted}
                  >
                    {hasVoted ? "已投票" : "開始投票"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>投票須知</DialogTitle>
                    <DialogDescription>
                      請仔細閱讀以下投票規則：
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      投票後，最高票的志願者將成為資金的兌現者，負責將資金用於實際救助。
                    </p>
                    <div className="space-y-2">
                      <h3 className="font-semibold">候選人名單：</h3>
                      <div className="space-y-2">
                        {/* 這裡可以動態渲染候選人名單 */}
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span>候選人 A</span>
                          <Button size="sm" onClick={() => setHasVoted(true)}>
                            投票
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span>候選人 B</span>
                          <Button size="sm" onClick={() => setHasVoted(true)}>
                            投票
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
