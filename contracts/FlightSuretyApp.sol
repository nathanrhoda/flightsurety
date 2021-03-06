// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;          // Account used to deploy contract
    IFlightSuretyData dataContract;

    mapping(address => address[]) public consensusList;     
    
    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
        
    
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAirlineIsFunded(address addr)
    {
        require(dataContract.isAirlineFunded(addr), "Airline is not funded");
        _;
    }

    modifier requireIsAirline(address addr)
    {
        require(dataContract.isAirline(addr), "This is not a airline");
        _;
    }

    modifier requireFirstTimeRegisteringAirline(address addr)
    {        
        for(uint i=0; i<consensusList[addr].length; i++){
            require(msg.sender != consensusList[addr][i], "Caller has already registered this airline");
        }
        _;
    }

    modifier requireFundedAmountIs10ETH()
    {
        require(msg.value == 10 ether, "Funded amount is not 10 ETh");    
        _;
    }
       
    modifier requireEthIsLessThanOne()
    {
        require(msg.value < 1 ether, "Funded amount must be less than 1 ETH");    
        _;
    }
    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address dataContractAddress
                                ) 
    {
        contractOwner = msg.sender;
        dataContract = IFlightSuretyData(dataContractAddress);
        consensusList[contractOwner] = new address[](0);        
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public
                            returns(bool) 
    {
        return dataContract.isOperational();  
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function getConsensus(address addr) 
                        external          
                        view                                      
                        returns (address[] memory, uint)                    
    {                        
        return (consensusList[addr], consensusList[addr].length);                
    }


    /********************************************************************************************/
    /*                                     AIRLINE FUNCTIONS                                    */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
                            (   
                                string memory name,
                                address account
                            )
                            external
                            requireIsOperational
                            requireAirlineIsFunded(msg.sender)
                            requireFirstTimeRegisteringAirline(account)
                            returns(bool success, uint256 votes)
    {       
        address[] memory registeredAirlines = dataContract.getRegisteredAirlines();
        for(uint8 i=0; i<registeredAirlines.length; i++) {
            require(registeredAirlines[i] != account, "Account has already been registered");        
        }
        
        uint consensusRequiered = registeredAirlines.length / 2;

        bool result = false;
        if(registeredAirlines.length > 3) {                               
            consensusList[account].push(msg.sender);
            if(consensusList[account].length >= consensusRequiered) {                
                result = dataContract.registerAirline(name, account); 
            }             
        } else {
            result = dataContract.registerAirline(name, account);            
        }
        return (result, uint(consensusList[account].length));        
    }

    function fundAirline(       
                                                
                        )
                        external
                        payable
                        requireIsOperational
                        requireFundedAmountIs10ETH
                        requireIsAirline(msg.sender)
    {        
        address payable payableAddress = payable(address(uint160((address(dataContract)))));  
        payableAddress.transfer(msg.value);

        dataContract.fundAirline(msg.sender);
    }


    /********************************************************************************************/
    /*                                     FLIGHT FUNCTIONS                                     */
    /********************************************************************************************/
   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (                                    
                                    string memory flightNumber,
                                    uint256 departureTime
                                )
                                external
                                requireIsOperational
                                requireAirlineIsFunded(msg.sender)
    {                         
        bytes32 flightKey = getFlightKey(msg.sender, flightNumber, departureTime);                        
        bool isFlightRegistered = dataContract.isFlightRegistered(flightKey);
        require(isFlightRegistered == false, "Flight has already been registered");
        dataContract.registerFlight(flightNumber, departureTime);       
    }

       /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                public                                
                                requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        
        if(statusCode == STATUS_CODE_LATE_AIRLINE) {
            // 1.5 when its airlines fault
            dataContract.creditInsurees(flightKey, statusCode, 150);            
        }        
        dataContract.updateFlightStatus(flightKey, statusCode);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        ResponseInfo storage flightResponse = oracleResponses[key];
        flightResponse.isOpen = true;
        flightResponse.requester = msg.sender;        

        emit OracleRequest(index, airline, flight, timestamp);
    }     

    /********************************************************************************************/
    /*                                     INSURANCE FUNCTIONS                                  */
    /********************************************************************************************/

    function buyInsurance
                    (
                        address airline,
                        string memory flightNumber,
                        uint256 departureTime                        
                    )
                    external
                    payable
                    requireIsOperational
                    requireEthIsLessThanOne
    {        
        bytes32 flightKey = getFlightKey(airline, flightNumber, departureTime);

        bool hasInsurance = dataContract.passengerHasInsuranceCover(flightKey, msg.sender);
        require(hasInsurance == false, "Passenger has already bought insurance for this flight");
        
        dataContract.buy(flightKey, msg.sender, msg.value);
    }    

    function buyInsuranceByFlightKey
                    (
                      bytes32 flightKey                       
                    )
                    external
                    payable
                    requireIsOperational
                    requireEthIsLessThanOne
    {                
        bool hasInsurance = dataContract.passengerHasInsuranceCover(flightKey, msg.sender);
        require(hasInsurance == false, "Passenged has already bought insurance for this flight");
        
        dataContract.buy(flightKey, msg.sender, msg.value);
    }    


    function withdraw
                    (
                        
                    )
                    external
                    payable
                    requireIsOperational                    
                    returns(uint256)
    {        
        return dataContract.pay(msg.sender);
    }    

    /********************************************************************************************/
    /*                                     ORACLE FUNCTIONS                                     */
    /********************************************************************************************/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string memory flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        public
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation        
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);
        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

abstract contract IFlightSuretyData {
    function isOperational() external virtual returns(bool);
    function registerAirline(string calldata name, address account) external virtual returns (bool);
    function isAirline(address account) external virtual returns(bool);    
    function isAirlineFunded(address account) external virtual returns(bool);
    function fundAirline(address account) external virtual;
    function getRegisteredAirlines() external view virtual returns(address[] memory);    

    function registerFlight(string calldata flightNumber, uint256 departureTime) external virtual returns(bool);
    function isFlightRegistered(bytes32 flightKey) external view virtual returns(bool);
    function buy(bytes32 flightKey, address passenger, uint256 amount) external virtual;

    function passengerHasInsuranceCover(bytes32 flightKey, address passenger) external virtual returns(bool);
    function creditInsurees(bytes32 flightKey, uint8 statusCode, uint8 multiplier) external virtual;
    function pay(address passenger) external virtual returns(uint256);

    function updateFlightStatus(bytes32 flightKey, uint8 statusCode) public virtual;
}