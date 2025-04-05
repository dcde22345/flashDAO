import React from 'react';

interface Volunteer {
  id: number;
  name: string;
  description: string;
  approved: boolean;
  votingPower: number;
}

interface VolunteersListProps {
  volunteers: Volunteer[];
  isConnected: boolean;
  onRegisterVolunteer: () => void;
  onVote: (volunteerId: number) => void;
}

export default function VolunteersList({
  volunteers,
  isConnected,
  onRegisterVolunteer,
  onVote,
}: VolunteersListProps) {
  return (
    <div>
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">志願者列表</h2>
        <p className="text-gray-600 mb-4">
          選出一位志願者接收所有捐款資金用於救援活動。志願者將根據他們的專業和計劃獲得投票。獲得最多票數的志願者將在事件結束後獲得所有資金。
        </p>
        <div className="space-y-4">
          {volunteers.map(volunteer => (
            <div key={volunteer.id} className="border-b pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg">{volunteer.name}</h3>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    volunteer.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {volunteer.approved ? '已批准' : '待批准'}
                  </span>
                  {volunteer.approved && (
                    <p className="text-sm text-gray-500 mt-1">當前票數: {volunteer.votingPower}</p>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{volunteer.description}</p>
              
              {isConnected && volunteer.approved && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => onVote(volunteer.id)} 
                    className="btn btn-sm btn-primary"
                  >
                    投票支持
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {isConnected && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">想成為志願者？請註冊並提交您的救援計劃</p>
          <button onClick={onRegisterVolunteer} className="btn btn-secondary">
            註冊為志願者
          </button>
        </div>
      )}
    </div>
  );
} 