"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function EventTrigger() {
  const router = useRouter();

  const triggerEarthquakeEvent = async () => {
    const exampleEarthquakeEvent = {
      type: "Earthquake",
      name: "Hualien Earthquake",
      description:
        "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
      severity: 8,
      location: "Hualien County, Taiwan",
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/trigger-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exampleEarthquakeEvent),
      });

      if (response.ok) {
        alert("地震事件已触发！");
      } else {
        alert("事件触发失败，请查看控制台以获取更多信息");
        console.error("事件触发失败:", await response.text());
      }
    } catch (error) {
      alert("连接错误，请确保服务器正在运行");
      console.error("连接错误:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">事件触发器</h1>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">模拟灾害事件</h2>
        <Button
          onClick={triggerEarthquakeEvent}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
        >
          发生地震
        </Button>
        <p className="mt-4 text-gray-600">
          点击此按钮将模拟花莲县发生7.2级地震事件，并将数据发送到后端系统。
        </p>
      </div>
    </div>
  );
}
