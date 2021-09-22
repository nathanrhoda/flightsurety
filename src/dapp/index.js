
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async() => {
  let result = null;

  let contract = new Contract('localhost', () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error,result);
      display('Operational Status', 'Check if contract is operational', [{label: 'Operational Status', error: error, value: result}]);
    });

   


    // User-submitted transaction
    DOM.elid('submit-oracle').addEventListener('click', () => {
      let flightkey = DOM.elid('flight-number').value;
      let flightNumber = DOM.elid('flight-number').innerText;
      console.log(flightNumber + " " + flightkey);


      contract.fetchFlightStatus(flightkey, (error, result) => {
        display('Oracles', 'Trigger oracles', [{label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp}]);
      });            
    })

    DOM.elid('load-flights').addEventListener('click', () => {


      contract.getAllFlightInfo((error, result) => {
        console.log(result);        
        var flightNumberDropdown = DOM.elid('flight-number'); 
        var insuranceFlightNumberDropdown = DOM.elid('insurance-flight-number');     
        
        console.log(result.flights);
        console.log(result.flightkeys);
  
        for(let i=0; i<result.flights.length; i++) {
          flightNumberDropdown.add(new Option(result.flights[i], result.flightkeys[i]));
          insuranceFlightNumberDropdown.add(new Option(result.flights[i], result.flightkeys[i]));
        }            
      });       
    })
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({className:'row'}));
    row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
    row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
    section.appendChild(row);
  })
  displayDiv.append(section);
}