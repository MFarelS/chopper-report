const fetch = require('node-fetch').default;

module.exports = {
  search: async ({ query }) => {
    let url = `https://www.jetphotos.com/api/json/quicksearch.php?term=${query}`;
    
    const response = await fetch(url);
    try {
      const json = await response.json();

      return json;
    } catch (error) {
      console.log(await response.text());
      throw error;
    }
  },
};
