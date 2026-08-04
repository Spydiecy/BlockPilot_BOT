// constants/contracts.ts
export const CONTRACT_ADDRESSES = {
  zeroGTestnet: '0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0',
} as const;

export const AUDIT_REGISTRY_ABI = [
  "function registerAudit(bytes32 contractHash, uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, bytes32 reportHash, string calldata summaryPreview, bytes32 computeJobId) external",
  "function getContractAudits(bytes32 contractHash) external view returns (tuple(uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, bytes32 reportHash, string summaryPreview, address auditor, uint256 timestamp, bytes32 computeJobId)[])",
  "function getLatestAudit(bytes32 contractHash) external view returns (tuple(uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, bytes32 reportHash, string summaryPreview, address auditor, uint256 timestamp, bytes32 computeJobId))",
  "function getAuditorHistory(address auditor) external view returns (bytes32[])",
  "function getTotalContracts() external view returns (uint256)",
  "function getAllAudits(uint256 startIndex, uint256 limit) external view returns (bytes32[] contractHashes, uint8[] stars, bytes32[] reportHashes, address[] auditors, uint256[] timestamps, bytes32[] computeJobIds)",
  "function auditorReputation(address auditor) external view returns (uint256)",
  "function withdraw() external",
  "event AuditRegistered(bytes32 indexed contractHash, uint8 stars, bytes32 reportHash, address indexed auditor, uint256 timestamp, bytes32 computeJobId)"
] as const;

export type ChainKey = keyof typeof CONTRACT_ADDRESSES;

// Audit struct type for TypeScript
export interface Audit {
  stars: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  reportHash: string; // 0G Storage content hash
  summaryPreview: string;
  auditor: string;
  timestamp: number;
  computeJobId: string; // 0G Compute job ID
}