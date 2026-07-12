// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ColdChainTracker {
    struct LogReceipt {
        bytes32 dataHash;
        uint256 timestamp;
        string location;
        int256 temperature;
    }

    // checkpointId (예: PO_NUMBER + STATUS 등) -> LogReceipt 매핑
    mapping(string => LogReceipt) private receipts;
    
    // 이력 등록 이벤트
    event LogRegistered(string checkpointId, bytes32 dataHash, uint256 timestamp);

    function registerCheckpoint(
        string calldata checkpointId,
        bytes32 dataHash,
        string calldata location,
        int256 temperature
    ) external {
        require(receipts[checkpointId].timestamp == 0, "Checkpoint already registered");
        
        receipts[checkpointId] = LogReceipt({
            dataHash: dataHash,
            timestamp: block.timestamp,
            location: location,
            temperature: temperature
        });

        emit LogRegistered(checkpointId, dataHash, block.timestamp);
    }

    function verifyCheckpoint(string calldata checkpointId) 
        external 
        view 
        returns (bytes32 dataHash, uint256 timestamp, string memory location, int256 temperature) 
    {
        LogReceipt memory receipt = receipts[checkpointId];
        require(receipt.timestamp > 0, "Checkpoint not found");
        return (receipt.dataHash, receipt.timestamp, receipt.location, receipt.temperature);
    }
}
