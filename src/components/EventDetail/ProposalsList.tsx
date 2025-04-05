import React from 'react';

interface Proposal {
  id: number;
  title: string;
  description: string;
  amount: string;
  votes: number;
  status: string;
}

interface ProposalsListProps {
  proposals: Proposal[];
  isConnected: boolean;
  onVote: (proposalId: number) => void;
}

export default function ProposalsList({
  proposals,
  isConnected,
  onVote,
}: ProposalsListProps) {
  return (
    <div>
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">資金使用提案</h2>
        <div className="space-y-6">
          {proposals.map(proposal => (
            <div key={proposal.id} className="border-b pb-6 last:border-0 last:pb-0">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                <h3 className="font-medium">{proposal.title}</h3>
                <span className="text-sm text-gray-500">申請金額: {proposal.amount}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{proposal.description}</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{proposal.votes} 票</p>
                </div>
                
                {isConnected && (
                  <button 
                    onClick={() => onVote(proposal.id)} 
                    className="btn btn-sm btn-secondary"
                  >
                    投票
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 