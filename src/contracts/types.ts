export interface EventDAOInfo {
  daoAddress: string;
  eventName: string;
  eventDescription: string;
  createdAt: number;
  expiresAt: number;
  exists: boolean;
}

export interface Volunteer {
  address: string;
  name: string;
  description: string;
  approved: boolean;
  votes: number;
}

export interface EventDAO {
  address: string;
  eventName: string;
  eventDescription: string;
  expiresAt: number;
  createdAt: number;
  isExpired: boolean;
  fundsDistributed: boolean;
  electionConcluded: boolean;
  noWinner: boolean;
  totalDonations: bigint;
  donorCount: number;
  volunteers: Volunteer[];
  volunteersCount: number;
  winningVolunteerIndex: number;
  winningVolunteer?: Volunteer;
  tokenName: string;
  tokenSymbol: string;
}

export interface Donation {
  donor: string;
  amount: bigint;
  tokensMinted: bigint;
}

export interface Vote {
  voter: string;
  volunteerIndex: number;
  votes: bigint;
}

export interface UserInfo {
  isVolunteer: boolean;
  volunteerIndex?: number;
  hasVoted: boolean;
  votingPower: bigint;
  donations: bigint;
  tokenBalance: bigint;
  refunded: boolean;
} 