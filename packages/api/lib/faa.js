const fetch = require('node-fetch');
const cheerio = require('cheerio');

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

module.exports = {
    search: async ({ query }) => {
        let url = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${query}`;
        
        const response = await fetch(url);
        try {
            const html = await response.text();
            const $ = cheerio.load(html);

            return {
                owner: toTitleCase($('#mainDiv > div:nth-child(6) > table > tbody > tr:nth-child(1) > td:nth-child(2)').text())
            };
        } catch (error) {
            console.log(await response.text());
            throw error;
        }
    },
};
