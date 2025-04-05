import React from 'react';
import Link from 'next/link';

interface EventCardProps {
  id: number;
  name: string;
  description: string;
  expiresAt: string;
  volunteers: number;
  donations: string;
  status: string;
}

export default function EventCard({
  id,
  name,
  description,
  expiresAt,
  volunteers,
  donations,
  status,
}: EventCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 flex items-center justify-center">
          <div className="relative w-full h-40 md:h-full bg-gray-200 rounded-md overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-500">地震救援</span>
            </div>
          </div>
        </div>
        
        <div className="md:w-3/4">
          <h2 className="text-xl font-bold mb-2">{name}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">狀態</p>
              <p className="font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                {status === 'active' ? '進行中' : '已結束'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">志願者</p>
              <p className="font-medium">{volunteers} 名</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">捐款總額</p>
              <p className="font-medium">{donations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">截止日期</p>
              <p className="font-medium">{new Date(expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link href={`/daos/${id}`} className="btn btn-primary">
              了解更多
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 