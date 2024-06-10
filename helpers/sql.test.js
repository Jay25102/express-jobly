const { BadRequestError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function() {
    // sqlForPartialUpdate needs to be wrapped in a function
    // to test for type of error thrown
    test("No data, throws error", function() {
        expect(function() {
            sqlForPartialUpdate({}, {})
        }).toThrow(BadRequestError);
    });

    test("With sample data", function() {
        expect(sqlForPartialUpdate({
            "name": "New-Name",
            "description": "new company",
            "numEmployees": 500
        },
        {
            "numEmployees": "num_employees"
        })).toEqual({
            setCols: "\"name\"=$1, \"description\"=$2, \"num_employees\"=$3",
            values: ["New-Name", "new company", 500]
        });
    });
});