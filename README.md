# WatchSignals
Web Scraping Assessment Task


This Project will visit "https://www.chronext.com/mens-watches", change location if necessary and then scrap
all the contents of all the pages and save to a CSV file (output.csv).

To accomodate for slower networks and complete page content loads, occasionally we manually call waitTimeout.

In a case where the country region you run the program is not on the website list, the program will automatically select the first region and return an output from that. At the time of completion of this mini project, that region is Anguilla (USD)

Ensure you have node installed on your local station
Clone the Project 
Install dependencies with `npm i`
Run the project and wait for the output with `node index.js`


Improvements
1. Feature to scroll select all the countries/regions and get their discounts
2. Feature to select a particular country/region and get the products and prices for that region