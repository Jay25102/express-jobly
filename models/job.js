"use strict";

const db = require("../db");
const { BadRequestError, ExpressError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/* Related functions for jobs */

class Job {
    /** Create a job (from data), update db, return new job data.
     * 
     * data should be { title, salary, equity, company_handle }
     * 
     * Returns { title, salary, equity, company_handle }
     * 
     * Throws BadRequestError if job already exists
     */
    static async create({ title, salary, equity, company_handle }) {
        const duplicateCheck = await db.query(
            `SELECT title
             FROM jobs
             WHERE title = $1`,
          [title]);
  
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Duplicate job: ${title}`);

      const companyExists = await db.query(`
            SELECT handle
            FROM companies
            WHERE handle = $1
        `, [company_handle]);

        if (companyExists.rows[0] === undefined) {
            throw new BadRequestError(`Cannot make a request for a non-existing company: ${company_handle}`);
        }

      const result = await db.query(`
        INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle
        `, [title, salary, equity, company_handle]);

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     * 
     * searchFilters (all optional):
     * - title (case-insensitive title search)
     * - minSalary
     * - hasEquity(only returns jobs with non-zero equity if true)
     * 
     * Returns [{ id, title, salary, equity, company_handle, companyName}, ...]
     */
    static async findAll(searchFilters = {}) {
        let query = `SELECT j.id, 
                            j.title, 
                            j.salary, 
                            j.equity, 
                            j.company_handle,
                            c.name AS "companyName"
                    FROM jobs j
                    LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        // create arrays to store parts of the query string depending on
        // how many filters the user wants
        let queryValues = [];
        let whereExpressions = [];

        const { title, minSalary, hasEquity } = searchFilters;

        // if user filters by title, add query to search by
        // title case-insensitive
        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        // add salary to query where salary must be greater or equal
        // to the amount specified
        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        // filters by equity greater than 0
        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`);
        }

        // join all the filter expressions together
        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // finalize and query
        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     * 
     * Returns { title, salary, equity, company_handle, company }
     *  where company is { handle, name, description, numEmployees, logoUrl }
     * 
     * Throws NotFoundError if not found.
     * 
     */
    static async get(id) {
        const jobRes = await db.query(`
            SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = $1
            `, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(`
            SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1
            `, [job.company_handle]);

        delete job.company_handle;
        job.company = companiesRes.rows[0];

        return job;
    }

    /** Update job data with `data`.
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all
     * the fields; this only changes provided ones.
     * 
     * Data can include: { title, salary, equity }
     * 
     * Returns { id, title, salary, equity, company_handle }
     * 
     * Throws NotFoundError if not found.
     */
    static async update(id, data) {
        const {setCols, values } = sqlForPartialUpdate(
            data, {}
        );
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     * 
     * Throws NotFoundError if job not found.
     */
    static async remove(id) {
        const result = await db.query(`
            DELETE FROM jobs
            WHERE id = ${id}
            RETURNING id
        `);
        const job = result.rows[0];
        
        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;