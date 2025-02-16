// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EWasteTracking {
    struct WasteItem {
        string itemType;
        uint256 weight;
        uint256 timestamp;
        string userId;
        Status status;
        address[] handlers;
    }

    struct Vendor {
        string[] certifications;
        bool isVerified;
        uint256 verificationDate;
    }

    enum Status { Pending, InProgress, Completed }

    mapping(string => WasteItem) public wasteItems;
    mapping(string => Vendor) public vendors;
    mapping(address => bool) public admins;

    event WasteItemRecorded(string itemId, string itemType, uint256 timestamp);
    event StatusUpdated(string itemId, Status newStatus);
    event VendorVerified(string vendorId, string[] certifications);

    constructor() {
        admins[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    function recordWasteItem(
        string memory itemId,
        string memory itemType,
        uint256 weight,
        uint256 timestamp,
        string memory userId
    ) public {
        WasteItem storage item = wasteItems[itemId];
        item.itemType = itemType;
        item.weight = weight;
        item.timestamp = timestamp;
        item.userId = userId;
        item.status = Status.Pending;
        
        emit WasteItemRecorded(itemId, itemType, timestamp);
    }

    function updateStatus(string memory itemId, Status newStatus) public onlyAdmin {
        require(bytes(wasteItems[itemId].itemType).length > 0, "Item does not exist");
        wasteItems[itemId].status = newStatus;
        wasteItems[itemId].handlers.push(msg.sender);
        
        emit StatusUpdated(itemId, newStatus);
    }

    function verifyVendor(string memory vendorId, string[] memory certifications) public onlyAdmin {
        vendors[vendorId] = Vendor({
            certifications: certifications,
            isVerified: true,
            verificationDate: block.timestamp
        });
        
        emit VendorVerified(vendorId, certifications);
    }

    function getWasteItemHistory(string memory itemId) public view returns (
        string memory itemType,
        uint256 weight,
        uint256 timestamp,
        Status status,
        address[] memory handlers
    ) {
        WasteItem storage item = wasteItems[itemId];
        require(bytes(item.itemType).length > 0, "Item does not exist");
        
        return (
            item.itemType,
            item.weight,
            item.timestamp,
            item.status,
            item.handlers
        );
    }

    function isVendorVerified(string memory vendorId) public view returns (bool) {
        return vendors[vendorId].isVerified;
    }

    function addAdmin(address newAdmin) public onlyAdmin {
        admins[newAdmin] = true;
    }

    function removeAdmin(address admin) public onlyAdmin {
        require(msg.sender != admin, "Cannot remove self as admin");
        admins[admin] = false;
    }
}