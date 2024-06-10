const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** 
 * Prepares company data to be updated by reformatting json into
 * SQL
 * 
 * @param{json} dataToUpdate is the data sent by the user to update
 * @param{json} jsToSql 
 * @returns {setCols, values} columns to be updated as the value for setCols
 * and values of those columns as a value of the values key
 * 
 * Throws a 400 bad request error if there are no keys
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
