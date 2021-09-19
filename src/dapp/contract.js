import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }    

    
    initialize(callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
 
            self.flightSuretyData.contractOwner.call()
                .then((won)=>console.log(won));
            
            self.flightSuretyData.methods
                .authorizeCaller(accts[1]) 
                .send({from: self.owner});
    
            // self.flightSuretyApp.methods                    
            // .fundAirline()
            // .send({from: accts[1], value: this.web3.utils.toWei("10", "ether")}, (error, result) =>{
            //     callback(error);
            // });

            // Fund all airlines
            // for(let i=0; i<this.airlines.length; i++) {
            //     let registerAirlinePayload = {
            //         airline: accts[i],
            //         name: `Airline ${i}`
            //     };

                // self.flightSuretyApp.methods                    
                //     .registerAirline(`Airline ${i}`, accts[i])
                //     .send({from: accts[1]}, (error, result) =>{
                //         callback(error, registerAirlinePayload);
                //     });    
                    
                // self.flightSuretyApp.methods                    
                //     .fundAirline()
                //     .send({from: accts[i], value: this.web3.utils.toWei("10", "ether")}, (error, result) =>{
                //         callback(error);
                //     });                    
            // } 

            // Register all flights
            // self.flightSuretyData.methods    
            //     .getRegisteredAirlines()
            //     .call({from:self.owner})
            //         .then((airlineList) =>{
            //             console.log(airlineList);
            //         });
             
            //callback();
        }); 
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {        
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);                
            });
    }        

    buyInsurance(amount) {

    }
}