// constants/contracts.ts
export const CONTRACT_ADDRESSES = {
  botMainnet: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6',
  botTestnet: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6',
} as const;

// Updated ABI matching the new IPFS-based AuditRegistry contract
export const AUDIT_REGISTRY_ABI = [
  "function registerAudit(bytes32 contractHash, uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, string calldata reportCID, string calldata summaryPreview, bytes32 analysisJobId) external",
  "function getContractAudits(bytes32 contractHash) external view returns (tuple(uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, string reportCID, string summaryPreview, address auditor, uint256 timestamp, bytes32 analysisJobId)[])",
  "function getLatestAudit(bytes32 contractHash) external view returns (tuple(uint8 stars, uint8 criticalIssues, uint8 highIssues, uint8 mediumIssues, string reportCID, string summaryPreview, address auditor, uint256 timestamp, bytes32 analysisJobId))",
  "function getAuditorHistory(address auditor) external view returns (bytes32[])",
  "function getTotalContracts() external view returns (uint256)",
  "function getAllAudits(uint256 startIndex, uint256 limit) external view returns (bytes32[] contractHashes, uint8[] stars, string[] reportCIDs, address[] auditors, uint256[] timestamps, bytes32[] analysisJobIds)",
  "function auditorReputation(address auditor) external view returns (uint256)",
  "function withdraw() external",
  "event AuditRegistered(bytes32 indexed contractHash, uint8 stars, string reportCID, address indexed auditor, uint256 timestamp, bytes32 analysisJobId)"
] as const;

export type ChainKey = keyof typeof CONTRACT_ADDRESSES;

// Audit struct type for TypeScript
export interface Audit {
  stars: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  reportCID: string;   // IPFS CID of the full audit report
  summaryPreview: string;
  auditor: string;
  timestamp: number;
  analysisJobId: string;
}
