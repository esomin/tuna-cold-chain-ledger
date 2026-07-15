// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ColdChainTracker {
    struct LogReceipt {
        bytes32 dataHash;      // 오프체인 상세 데이터의 Keccak256 해시값
        uint256 timestamp;     // 블록체인 기록 시간
        string stepName;       // 유통 단계 이름 (예: 어획 완료, 하역 완료 등)
    }

    // checkpointId (예: PO_NUMBER + STATUS 등) -> LogReceipt 매핑
    mapping(string => LogReceipt) private receipts;
    
    // 이력 등록 이벤트
    event LogRegistered(string checkpointId, bytes32 dataHash, uint256 timestamp, string stepName);

    function registerCheckpoint(
        string calldata checkpointId,
        bytes32 dataHash,
        string calldata stepName
    ) external {
        require(receipts[checkpointId].timestamp == 0, "Checkpoint already registered");
        
        receipts[checkpointId] = LogReceipt({
            dataHash: dataHash,
            timestamp: block.timestamp,
            stepName: stepName
        });

        emit LogRegistered(checkpointId, dataHash, block.timestamp, stepName);
    }

    function verifyCheckpoint(string calldata checkpointId) 
        external 
        view 
        returns (bytes32 dataHash, uint256 timestamp, string memory stepName) 
    {
        LogReceipt memory receipt = receipts[checkpointId];
        require(receipt.timestamp > 0, "Checkpoint not found");
        return (receipt.dataHash, receipt.timestamp, receipt.stepName);
    }
}
