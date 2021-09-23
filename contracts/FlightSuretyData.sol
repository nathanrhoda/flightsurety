// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        address addr;
        string name;
        bool isRegistered;
        bool isFunded;
    }

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    mapping(address=> uint256) private authorizedAccounts;
    mapping(address=>Airline) private airlines;        
    address[] registeredAirlines = new address[](0);

    struct Flight {        
        string flightNumber;
        bool isRegistered;
        uint8 statusCode;
        uint256 timestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;
    string[] registeredFlights = new string[](0);
    bytes32[] registeredFlightkeys = new bytes32[](0);

    struct Insurance {
        address passenger;
        bool isCredited;
        uint256 amount;
    }

    mapping(bytes32 => Insurance[]) insuranceCover;
    mapping(address => uint256) passengerCreditFlights;
    
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/    
    event AirlineRegistered (string name, address airline);
    event AirlineFunded(address airline);
    event InsuranceBought(address passenger, bytes32 flightkey);
    event CreditInsurees(bytes32 flightkey);
    event FlightStatusUpdated(bytes32 flightKey, uint8 status);
    event PassengedWithdrawal(address passenger, uint256 amount);
    event RegisterFlight(bytes32 flightKey, string flightNumber);


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (   
                                    string memory name,  
                                    address firstAirline
                                ) 
    {        
        contractOwner = msg.sender;        
        airlines[firstAirline] = Airline({
                                    addr: firstAirline,
                                    name: name,
                                    isRegistered: true,
                                    isFunded: false
                                });
        authorizedAccounts[contractOwner] = 1;        
        registeredAirlines.push(firstAirline);
    }

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
        require(operational, "Contract is currently not operational");
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

    /**
    * @dev Modifier that requires account to be authorized
    */
    modifier requireCallerAuthorized()
    {
        require(authorizedAccounts[msg.sender] == 1, "Caller is not authorized");
        _;        
    }
    
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function passengerHasInsuranceCover
                                (
                                    bytes32 flightKey,
                                    address passenger
                                )
                                external
                                view
                                returns (bool)                                             
    {
        bool hasCover = false;
        for(uint i=0; i<insuranceCover[flightKey].length; i++) {
            if(insuranceCover[flightKey][i].passenger == passenger) {
                hasCover = true;
            }
        }
        return hasCover;
    }                                
    /**
    * @dev Checks to see if calling account is a airline
    */
    function isAirline
                      (
                          address account  
                      )
                      public
                      view
                      returns(bool)
    {        
        return airlines[account].isRegistered;
    }

    function isAirlineFunded
                      (
                         address account
                      )
                      external
                      view
                      returns(bool)
    {        
        return airlines[account].isFunded == true;
    }
    /** 
    * @dev Authorizes account to make use of the contract    
    */
    function authorizeCaller
                            (
                                address account
                            )
                            external
                            requireIsOperational
                            requireContractOwner
    {
        authorizedAccounts[account] = 1;
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    /********************************************************************************************/
    /*                                     AIRLINE FUNCTIONS                                    */
    /********************************************************************************************/

    
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                string calldata name,
                                address account
                            )
                            external  
                            requireIsOperational
                            requireCallerAuthorized
                            returns (bool)                                                 
    {                
        airlines[account] = Airline({
                                        addr: account,
                                        name: name,
                                        isRegistered: true,
                                        isFunded: false
                                    });
        registeredAirlines.push(account);   
        emit AirlineRegistered(name, account);
        return true;                        
    }

    function getRegisteredAirlines() 
                            public
                            view 
                            returns(address[] memory) 
    {
        return registeredAirlines;
    }

    function fundAirline
                        (  
                           address account 
                        )
                        external
                        requireIsOperational                             
    {        
        airlines[account].isFunded = true;                
        emit AirlineFunded(account);
    }

    /********************************************************************************************/
    /*                                     INSURANCE FUNCTIONS                                  */
    /********************************************************************************************/

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                        (
                           bytes32 flightKey,
                           address passenger, 
                           uint256 amount      
                        ) 
                        external
                        payable
                        requireIsOperational                                   
                        requireCallerAuthorized                                                          
    {                        
        address payable payableAddress = payable(address(uint160((address(this)))));  
        payableAddress.transfer(amount);

        insuranceCover[flightKey].push(Insurance({
                                                    passenger: passenger,
                                                    isCredited: false,
                                                    amount: amount
                                                }));        

        emit InsuranceBought(passenger, flightKey);
    }

    function getInsurance
                        (
                            bytes32 flightKey
                        )                        
                        external                                                
                        view
                        requireIsOperational
                        returns(bool hasInsurnace, address passenger, bool isCredited, uint256 amount)
    {
        Insurance memory insurance;
        bool hasInsurance = false;
        
        for(uint i=0; i<insuranceCover[flightKey].length; i++) {
            if(insuranceCover[flightKey][i].passenger == msg.sender) {
                insurance = insuranceCover[flightKey][i];    
                hasInsurance = true;            
            }
        }
        
        return (hasInsurance, insurance.passenger, insurance.isCredited, insurance.amount);        
    }


     function getCredits
                        (
                            address passenger
                        )
                        external
                        payable
                        requireIsOperational
                        returns(uint256)
    {
       return passengerCreditFlights[passenger];                
    }


    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    bytes32 flightKey,
                                    uint8 statusCode,
                                    uint8 multiplier
                                )
                                external
                                requireIsOperational       
                                requireCallerAuthorized
    {
        for(uint i=0; i<insuranceCover[flightKey].length; i++){
            if(insuranceCover[flightKey][i].isCredited == false) {
                insuranceCover[flightKey][i].isCredited = true;                
                uint256 amount = insuranceCover[flightKey][i].amount.mul(multiplier).div(100);
                passengerCreditFlights[insuranceCover[flightKey][i].passenger] += amount;                                           
            }            
        }           

       updateFlightStatus(flightKey, statusCode);
       emit CreditInsurees(flightKey);
    }

    function updateFlightStatus     
                            (
                                bytes32 flightKey,
                                uint8 statusCode
                            )
                            public
                            requireIsOperational
                            requireCallerAuthorized
    {
        flights[flightKey].statusCode = statusCode;     
        emit FlightStatusUpdated(flightKey, statusCode);
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address passenger
                            )
                            external
                            requireIsOperational        
                            requireCallerAuthorized
                            returns(uint256)                    
    {
        require(passenger == tx.origin, "Contracts not allowed");
        uint256 amount = passengerCreditFlights[passenger];
        require(amount > 0, "No Credits to payout");
        passengerCreditFlights[passenger] = 0;
                
        delete passengerCreditFlights[passenger];
        address payable passengerPayableAddress = payable(address(uint160((address(passenger)))));  
        passengerPayableAddress.transfer(amount);        

        emit PassengedWithdrawal(passenger, amount);
        return amount;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
                            requireIsOperational
                            requireCallerAuthorized                            
    {
    }


    /********************************************************************************************/
    /*                                     FLIGHT FUNCTIONS                                     */
    /********************************************************************************************/

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function registerFlight
                            (
                                string calldata flightNumber, 
                                uint256 departureTime
                            )
                            external 
                            requireIsOperational
                            requireCallerAuthorized                            
                            returns(bool)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flightNumber, departureTime);                                
        flights[flightKey] = Flight({            
                                        flightNumber: flightNumber,                             
                                        isRegistered: true,
                                        statusCode: 0,
                                        timestamp: departureTime,
                                        airline: msg.sender
                                    });         
        
        registeredFlights.push(flightNumber);
        registeredFlightkeys.push(flightKey);
        emit RegisterFlight(flightKey, flightNumber);
        return true;
    }

    function isFlightRegistered
                        (
                            bytes32 flightKey
                        )
                        external
                        view
                        returns(bool)
    {
        return flights[flightKey].isRegistered;        
    }

    function getFlightByKey
                        (
                            bytes32 flightKey
                        )
                        external
                        view
                        returns (address, string memory, uint256, uint8)
    {
        Flight memory flight = flights[flightKey]; 

        return (flight.airline, flight.flightNumber, flight.timestamp, flight.statusCode);                              
    }

    function getFlights
                        (

                        )
                        external
                        view
                        returns(string[] memory)
    {
        return registeredFlights;
    }

      function getAllFlightsKeys
                        (

                        )
                        external
                        view
                        returns (bytes32[] memory )
    {
        return registeredFlightkeys;
    }


    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback() 
                            external 
                            payable 
    {
        fund();
    }

    receive() 
                            external 
                            payable
    {

    }


}

