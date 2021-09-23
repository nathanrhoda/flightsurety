import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.appAddress = config.appAddress;
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.registeredAirlines = [];
    }    

    
    initialize(callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;

            let hasAlreadyLoaded = true;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
                                     
            self.flightSuretyData.methods
                .authorizeCaller(this.appAddress) 
                .send({from: self.owner}, (error, result) =>{                    
                  console.log(`Authroize Caller: ${result}`);                 
                });
     
            self.flightSuretyData.methods
              .isAirlineFunded(accts[1])
              .call({from: self.owner}, (error, result)=>{
                hasAlreadyLoaded = result;        
                console.log(`hasAlreadyLoaded = result : ${hasAlreadyLoaded}`)        
                self.flightSuretyData.methods    
                  .getRegisteredAirlines()
                  .call({from:self.owner})
                      .then((airlineList) =>{                      
                          console.log(airlineList);
                      });    
                  if(hasAlreadyLoaded === true){
                    console.log("Already Initialized");
                  } else {                
                    self.flightSuretyApp.methods                    
                        .fundAirline()
                        .send({from: accts[1], value: this.web3.utils.toWei("10", "ether")}, (error, result) =>{                        
                                                                                                    
                            for(let i=1; i<this.airlines.length; i++) {              
                                  let registerAirlinePayload = {
                                      airline: this.airlines[i],
                                      name: `Airline ${i}`
                                  };                      

                                  self.flightSuretyApp.methods                    
                                      .registerAirline(registerAirlinePayload.name, registerAirlinePayload.airline)
                                      .send({
                                              from: accts[1],
                                              gas: 5000000,
                                              gasPrice: 20000000
                                            }, (error, result) =>{

                                            if(i < 5)  {
                                                  self.flightSuretyApp.methods                                                                      
                                                      .fundAirline()
                                                      .send({from: registerAirlinePayload.airline, value: this.web3.utils.toWei("10", "ether")}, (error, result) =>{
                                                    
                                                        let flightPayload = {
                                                            flightNumber: `Flight ${i}`,
                                                            departureTime: Math.floor(Date.now()+1 / 1000)
                                                        };
                                                        self.flightSuretyApp.methods
                                                            .registerFlight(flightPayload.flightNumber, flightPayload.departureTime)
                                                            .send({
                                                                    from: this.airlines[i],
                                                                    gas: 5000000,
                                                                    gasPrice: 20000000
                                                                  }, (error, result) => {                                                                                          
                                                                  console.log(`Flight: ${flightPayload.flightNumber}`);
                                                                });                
                                                  });                     
                                            }
                                    });   
                            }
                            
                            
                        }); 
                      }
                callback();    
              });        
        }); 
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }
    
    getRegisteredAirlines(callback) {
        let self = this;
        self.flightSuretyData.methods    
            .getRegisteredAirlines()
            .call({from:self.owner})
                .then((airlineList) =>{
                    console.log(airlineList);
                });         
     }

    fetchFlightStatus(flightKey, callback) {        
        let self = this;

        self.flightSuretyData.methods
        .getFlightByKey(flightKey)
        .call({ from: self.owner})
            .then((flight) => {                
                self.flightSuretyApp.methods
                .fetchFlightStatus(flight[0], flight[1], flight[2])
                .send({ from: self.owner}, (error, result) => {
                    callback(error, result);                
                });
            });                       
    }        

    getFlightByKey(flightKey, callback) {
        let self = this;

        self.flightSuretyData.methods
        .getFlightByKey(flightKey)
        .call({ from: self.owner}
            , callback);
                           
    }
    getAllFlightInfo(callback){
        let self = this;

        self.flightSuretyData.methods
            .getFlights()
            .call({from: self.owner})
                .then(flights=>{
                    self.flightSuretyData.methods
                    .getAllFlightsKeys()
                    .call({from: self.owner}, (error, flightkeys) => {
                        let flightInfo = {flights, flightkeys};
                        callback(error, flightInfo);
                    })         
                });

    }
    
    buyInsurance(amount) {

    }
}