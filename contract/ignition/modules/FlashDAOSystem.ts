import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { parseUnits } from 'ethers';

const FlashDAOSystemModule = buildModule('FlashDAOSystemModule', (m) => {
  // Deploy MockUSDC for testing
  const mockUSDC = m.contract('MockUSDC');
  
  // Create donor milestones for rewards
  const donorMilestones = [
    parseUnits('100', 6),  // 100 USDC
    parseUnits('500', 6),  // 500 USDC
    parseUnits('1000', 6), // 1,000 USDC
    parseUnits('5000', 6), // 5,000 USDC
    parseUnits('10000', 6) // 10,000 USDC
  ];
  
  // Deploy FlashDAORewards
  const flashDAORewards = m.contract('FlashDAORewards', [donorMilestones]);
  
  // Deploy FlashDAOFactory
  const flashDAOFactory = m.contract('FlashDAOFactory');
  
  // Configuration for the agent
  const severityThreshold = 6; // Minimum severity to trigger DAO creation (scale 1-10)
  const fundingGoalMultiplier = parseUnits('1000', 6); // 1,000 USDC per severity point
  
  // Deploy FlashDAOAgent
  const flashDAOAgent = m.contract(
    'FlashDAOAgent',
    [
      m.getContractAddress(flashDAOFactory),
      m.getContractAddress(flashDAORewards),
      m.getContractAddress(mockUSDC),
      severityThreshold,
      fundingGoalMultiplier
    ]
  );
  
  // Grant AGENT_ROLE to the agent in the factory
  const grantAgentRole = m.call(
    flashDAOFactory,
    'grantRole',
    [
      m.staticCall(flashDAOFactory, 'AGENT_ROLE'),
      m.getContractAddress(flashDAOAgent)
    ]
  );
  
  return {
    mockUSDC,
    flashDAORewards,
    flashDAOFactory,
    flashDAOAgent,
    grantAgentRole
  };
});

export default FlashDAOSystemModule; 