
module.exports = {
  country: {
    code: "GH",
    name: "Ghana"
  },

  regions: [
    {
      code: "BE",
      name: "Bono East",

      districts: [
        {
          code: "TECH-M",
          name: "Techiman Municipal",

          constituencies: [
            {
              code: "TEC-S",
              name: "Techiman South",

              pollingStations: [
                "BE-TEC-001",
                "BE-TEC-002",
                "BE-TEC-003"
              ]
            }
          ]
        }
      ]
    },

    {
      code: "GA",
      name: "Greater Accra",
      districts: []
    },

    {
      code: "AS",
      name: "Ashanti",
      districts: []
    }
  ]
};
